/**
 * Purchases Service
 * =================
 * Runs inside a MongoDB transaction when the server is a replica set or Atlas.
 * Falls back to non-transactional execution on standalone mongod while still
 * enforcing all business rules.
 *
 * Transaction flow:
 *  1. Validate supplier + products.
 *  2. Calculate line totals and purchase total.
 *  3. Create Purchase document.
 *  4. Insert PurchaseItems.
 *  5. Increment stock + update weighted-average cost per product.
 *  6. Record InventoryMovements.
 *  7. Commit (or no-op if standalone).
 */

const AppError          = require('../../utils/AppError');
const { getPagination } = require('../../utils/pagination');
const { withTransaction } = require('../../utils/txnHelper');
const purchaseRepo      = require('./purchase.repository');
const Product           = require('../products/product.model');
const Supplier          = require('../suppliers/supplier.model');
const InventoryMovement = require('../inventory/inventoryMovement.model');

const round2 = (n) => Math.round(n * 100) / 100;

const buildFilter = (query) => {
  const filter = {};
  if (query.supplier)    filter.supplier    = query.supplier;
  if (query.status)      filter.status      = query.status;
  if (query.purchasedBy) filter.purchasedBy = query.purchasedBy;
  if (query.startDate || query.endDate) {
    filter.purchaseDate = {};
    if (query.startDate) filter.purchaseDate.$gte = new Date(query.startDate);
    if (query.endDate)   filter.purchaseDate.$lte = new Date(query.endDate);
  }
  return filter;
};

const getPurchases = async (query) => {
  const { skip, limit, page, sort } = getPagination(query);
  const filter = buildFilter(query);
  const [purchases, total] = await Promise.all([
    purchaseRepo.findAll({ filter, skip, limit, sort }),
    purchaseRepo.countAll(filter),
  ]);
  return { purchases, total, page, limit };
};

const getPurchaseById = async (id) => {
  const purchase = await purchaseRepo.findById(id);
  if (!purchase) throw new AppError('Purchase not found', 404);
  const items = await purchaseRepo.findItemsByPurchaseId(id);
  return { ...purchase.toObject(), items };
};

const createPurchase = async (data, user) => {
  const { supplier: supplierId, paymentMethod, discountAmount = 0, taxAmount = 0, notes, purchaseDate, items } = data;

  // ── Pre-flight validation ─────────────────────────────────────────────────
  const supplier = await Supplier.findById(supplierId);
  if (!supplier)          throw new AppError('Supplier not found', 404);
  if (!supplier.isActive) throw new AppError('Supplier is inactive', 400);

  const productIds = items.map((i) => i.product);
  const products   = await Product.find({ _id: { $in: productIds }, isActive: true });

  if (products.length !== productIds.length) {
    const foundIds = products.map((p) => p._id.toString());
    const missing  = productIds.filter((id) => !foundIds.includes(id.toString()));
    throw new AppError(`Products not found or inactive: ${missing.join(', ')}`, 404);
  }

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  // ── Compute item totals ───────────────────────────────────────────────────
  let subtotal = 0;
  const purchaseItemDocs = items.map((item) => {
    const product   = productMap.get(item.product.toString());
    const lineTotal = round2(item.unitCost * item.quantity);
    subtotal       += lineTotal;
    return { product: product._id, productName: product.name, productSku: product.sku, quantity: item.quantity, unitCost: item.unitCost, lineTotal };
  });
  subtotal          = round2(subtotal);
  const totalAmount = round2(subtotal - discountAmount + taxAmount);

  // ── Run inside transaction (or standalone fallback) ───────────────────────
  return withTransaction(async (session) => {
    const purchaseNumber = await purchaseRepo.generatePurchaseNumber();

    // Step 1: Create Purchase
    const purchaseData = {
      purchaseNumber, supplier: supplierId, purchasedBy: user._id,
      status: 'received', paymentMethod: paymentMethod || 'cash',
      subtotal, discountAmount, taxAmount, totalAmount,
      notes: notes || '', purchaseDate: purchaseDate || new Date(),
    };

    let purchase;
    if (session) {
      [purchase] = await purchaseRepo.createPurchase(purchaseData, session);
    } else {
      [purchase] = await purchaseRepo.createPurchase(purchaseData, null);
    }

    // Step 2: Create PurchaseItems
    const itemsWithPurchase = purchaseItemDocs.map((i) => ({ ...i, purchase: purchase._id }));
    const createdItems = session
      ? await purchaseRepo.createPurchaseItems(itemsWithPurchase, session)
      : await purchaseRepo.createPurchaseItems(itemsWithPurchase, null);

    // Step 3: Update stock + weighted-average cost
    const movementDocs = [];
    for (const item of items) {
      const product  = productMap.get(item.product.toString());
      const oldStock = product.stock;
      const oldCost  = product.cost;
      const newStock = oldStock + item.quantity;
      const newCost  = newStock > 0
        ? round2((oldStock * oldCost + item.quantity * item.unitCost) / newStock)
        : item.unitCost;

      if (session) {
        await Product.findByIdAndUpdate(product._id, { $inc: { stock: item.quantity }, cost: newCost }, { session });
      } else {
        await Product.findByIdAndUpdate(product._id, { $inc: { stock: item.quantity }, cost: newCost });
      }

      movementDocs.push({
        product: product._id, type: 'purchase', quantityChange: item.quantity,
        quantityBefore: oldStock, quantityAfter: newStock,
        reference: purchase._id, referenceModel: 'Purchase',
        notes: `Purchase ${purchaseNumber}`, performedBy: user._id,
      });
    }

    // Step 4: Record movements
    if (session) {
      await InventoryMovement.insertMany(movementDocs, { session });
    } else {
      await InventoryMovement.insertMany(movementDocs);
    }

    return { purchase, items: createdItems };
  });
};

const updatePurchaseStatus = async (id, data) => {
  const purchase = await purchaseRepo.findById(id);
  if (!purchase) throw new AppError('Purchase not found', 404);
  if (purchase.status === 'cancelled') throw new AppError('Cannot update a cancelled purchase', 400);
  return purchaseRepo.updateStatus(id, data);
};

module.exports = { getPurchases, getPurchaseById, createPurchase, updatePurchaseStatus };
