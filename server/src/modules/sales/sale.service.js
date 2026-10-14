/**
 * Sales Service
 * =============
 * Runs inside a MongoDB transaction when the server is a replica set or Atlas.
 * Falls back to non-transactional execution on a standalone mongod, while
 * still enforcing all stock and business rules.
 *
 * Transaction flow:
 *  1. Validate products exist and are active.
 *  2. Atomically check + decrement stock per item ($gte guard).
 *  3. Compute server-side subtotal, discount, tax and totalAmount.
 *  4. Create Sale document.
 *  5. Insert SaleItems.
 *  6. Record InventoryMovements.
 *  7. Commit (or no-op if standalone).
 */

const AppError          = require('../../utils/AppError');
const { getPagination } = require('../../utils/pagination');
const { withTransaction } = require('../../utils/txnHelper');
const saleRepo          = require('./sale.repository');
const Product           = require('../products/product.model');
const InventoryMovement = require('../inventory/inventoryMovement.model');
const Customer          = require('../customers/customer.model');

const round2 = (n) => Math.round(n * 100) / 100;

const buildFilter = (query) => {
  const filter = {};
  if (query.customer) filter.customer = query.customer;
  if (query.status)   filter.status   = query.status;
  if (query.soldBy)   filter.soldBy   = query.soldBy;
  if (query.startDate || query.endDate) {
    filter.saleDate = {};
    if (query.startDate) filter.saleDate.$gte = new Date(query.startDate);
    if (query.endDate)   filter.saleDate.$lte = new Date(query.endDate);
  }
  return filter;
};

const getSales = async (query) => {
  const { skip, limit, page, sort } = getPagination(query);
  const filter = buildFilter(query);
  const [sales, total] = await Promise.all([
    saleRepo.findAll({ filter, skip, limit, sort }),
    saleRepo.countAll(filter),
  ]);
  return { sales, total, page, limit };
};

const getSaleById = async (id) => {
  const sale = await saleRepo.findById(id);
  if (!sale) throw new AppError('Sale not found', 404);
  const items = await saleRepo.findItemsBySaleId(id);
  return { ...sale.toObject(), items };
};

const createSale = async (data, user) => {
  const { items, customer, paymentMethod, taxRate = 0, notes, saleDate } = data;

  // ── Pre-flight validation (outside transaction) ───────────────────────────
  if (customer) {
    const cust = await Customer.findById(customer);
    if (!cust)          throw new AppError('Customer not found', 404);
    if (!cust.isActive) throw new AppError('Customer account is inactive', 400);
  }

  const productIds = items.map((i) => i.product);
  const products   = await Product.find({ _id: { $in: productIds }, isActive: true });

  if (products.length !== productIds.length) {
    const foundIds = products.map((p) => p._id.toString());
    const missing  = productIds.filter((id) => !foundIds.includes(id.toString()));
    throw new AppError(`Products not found or inactive: ${missing.join(', ')}`, 404);
  }

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  // ── Run inside transaction (or standalone fallback) ───────────────────────
  return withTransaction(async (session) => {
    const stockResults = [];

    // Step 1: Atomic stock check + decrement
    for (const item of items) {
      const product = productMap.get(item.product.toString());
      const qty     = item.quantity;

      const updateQuery = session
        ? Product.findOneAndUpdate(
            { _id: product._id, stock: { $gte: qty } },
            { $inc: { stock: -qty } },
            { new: true, session },
          )
        : Product.findOneAndUpdate(
            { _id: product._id, stock: { $gte: qty } },
            { $inc: { stock: -qty } },
            { new: true },
          );

      const updated = await updateQuery;

      if (!updated) {
        throw new AppError(
          `Insufficient stock for "${product.name}" (SKU: ${product.sku}). ` +
          `Available: ${product.stock}, Requested: ${qty}`,
          422,
        );
      }

      stockResults.push({ product, qty, stockBefore: product.stock, stockAfter: updated.stock });
    }

    // Step 2: Calculate totals
    const saleItemDocs = [];
    let subtotal = 0;

    for (const item of items) {
      const product        = productMap.get(item.product.toString());
      const unitPrice      = item.unitPrice !== undefined ? item.unitPrice : product.price;
      const discountPct    = item.discountPercent || 0;
      const discountAmount = round2((unitPrice * item.quantity) * (discountPct / 100));
      const lineTotal      = round2(unitPrice * item.quantity - discountAmount);
      subtotal            += lineTotal;

      saleItemDocs.push({
        product:         product._id,
        productName:     product.name,
        productSku:      product.sku,
        quantity:        item.quantity,
        unitPrice,
        costPrice:       product.cost,
        discountPercent: discountPct,
        discountAmount,
        lineTotal,
      });
    }

    subtotal          = round2(subtotal);
    const taxAmount   = round2(subtotal * (taxRate / 100));
    const totalAmount = round2(subtotal + taxAmount);
    const saleNumber  = await saleRepo.generateSaleNumber();

    // Step 3: Create Sale
    const saleData = {
      saleNumber,
      customer:       customer || null,
      soldBy:         user._id,
      status:         'completed',
      paymentMethod:  paymentMethod || 'cash',
      subtotal,
      discountAmount: saleItemDocs.reduce((s, i) => s + i.discountAmount, 0),
      taxRate,
      taxAmount,
      totalAmount,
      notes:    notes || '',
      saleDate: saleDate || new Date(),
    };

    let sale;
    if (session) {
      [sale] = await saleRepo.createSale(saleData, session);
    } else {
      [sale] = await saleRepo.createSale(saleData, null);
    }

    // Step 4: Create SaleItems
    const itemsWithSale = saleItemDocs.map((i) => ({ ...i, sale: sale._id }));
    const createdItems  = session
      ? await saleRepo.createSaleItems(itemsWithSale, session)
      : await saleRepo.createSaleItems(itemsWithSale, null);

    // Step 5: Record InventoryMovements
    const movementDocs = stockResults.map(({ product, qty, stockBefore, stockAfter }) => ({
      product:        product._id,
      type:           'sale',
      quantityChange: -qty,
      quantityBefore: stockBefore,
      quantityAfter:  stockAfter,
      reference:      sale._id,
      referenceModel: 'Sale',
      notes:          `Sale ${saleNumber}`,
      performedBy:    user._id,
    }));

    if (session) {
      await InventoryMovement.insertMany(movementDocs, { session });
    } else {
      await InventoryMovement.insertMany(movementDocs);
    }

    return { sale, items: createdItems };
  });
};

const updateSaleStatus = async (id, data) => {
  const sale = await saleRepo.findById(id);
  if (!sale) throw new AppError('Sale not found', 404);
  if (sale.status === 'cancelled') throw new AppError('Cannot update a cancelled sale', 400);
  return saleRepo.updateStatus(id, data);
};

module.exports = { getSales, getSaleById, createSale, updateSaleStatus };
