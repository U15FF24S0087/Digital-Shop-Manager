const mongoose          = require('mongoose');
const AppError          = require('../../utils/AppError');
const { getPagination } = require('../../utils/pagination');
const { withTransaction } = require('../../utils/txnHelper');
const Product           = require('../products/product.model');
const InventoryMovement = require('./inventoryMovement.model');

// ── Current stock snapshot ────────────────────────────────────────────────────

const getStockSummary = async (query) => {
  const { skip, limit, page, sort } = getPagination(query);
  const filter = { isActive: true };

  if (query.category) filter.category = query.category;
  if (query.lowStock === 'true') {
    filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
  }
  if (query.search) {
    const re = new RegExp(query.search, 'i');
    filter.$or = [{ name: re }, { sku: re }];
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('name sku stock lowStockThreshold unit category supplier price cost isActive'),
    Product.countDocuments(filter),
  ]);

  return { products, total, page, limit };
};

const getLowStockAlerts = async () => {
  const products = await Product.find({
    isActive: true,
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
  })
    .populate('category', 'name')
    .populate('supplier', 'name')
    .sort({ stock: 1 })
    .select('name sku stock lowStockThreshold unit category supplier');

  return products;
};

// ── Movement history ──────────────────────────────────────────────────────────

const getMovements = async (query) => {
  const { skip, limit, page, sort } = getPagination(query);
  const filter = {};

  if (query.product)     filter.product      = query.product;
  if (query.type)        filter.type         = query.type;
  if (query.performedBy) filter.performedBy  = query.performedBy;

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate)   filter.createdAt.$lte = new Date(query.endDate);
  }

  const [movements, total] = await Promise.all([
    InventoryMovement.find(filter)
      .populate('product',     'name sku')
      .populate('performedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    InventoryMovement.countDocuments(filter),
  ]);

  return { movements, total, page, limit };
};

const getMovementsByProduct = async (productId, query) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);

  const { skip, limit, page } = getPagination(query);
  const filter = { product: productId };

  const [movements, total] = await Promise.all([
    InventoryMovement.find(filter)
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    InventoryMovement.countDocuments(filter),
  ]);

  return { product, movements, total, page, limit };
};

// ── Manual stock adjustment ───────────────────────────────────────────────────

/**
 * Manually adjust stock for a product.
 * Uses a MongoDB transaction to ensure stock and movement record stay consistent.
 * Prevents negative stock.
 *
 * @param {object} data   { product, type, quantityChange, notes }
 * @param {object} user   req.user
 */
const adjustStock = async (data, user) => {
  const { product: productId, type, quantityChange, notes } = data;

  const product = await Product.findById(productId);
  if (!product)      throw new AppError('Product not found', 404);
  if (!product.isActive) throw new AppError('Product is inactive', 400);

  const newStock = product.stock + quantityChange;
  if (newStock < 0) {
    throw new AppError(
      `Adjustment would result in negative stock. ` +
      `Current stock: ${product.stock}, adjustment: ${quantityChange}`,
      422,
    );
  }

  return withTransaction(async (session) => {
    const stockBefore = product.stock;

    if (session) {
      await Product.findByIdAndUpdate(productId, { $inc: { stock: quantityChange } }, { session });
    } else {
      await Product.findByIdAndUpdate(productId, { $inc: { stock: quantityChange } });
    }

    const movementData = [{
      product:        productId,
      type,
      quantityChange,
      quantityBefore: stockBefore,
      quantityAfter:  newStock,
      notes:          notes || '',
      performedBy:    user._id,
    }];

    let movements;
    if (session) {
      movements = await InventoryMovement.create(movementData, { session });
    } else {
      movements = await InventoryMovement.create(movementData);
    }

    return {
      product:  { _id: product._id, name: product.name, sku: product.sku, stock: newStock },
      movement: movements[0],
    };
  });
};

module.exports = {
  getStockSummary,
  getLowStockAlerts,
  getMovements,
  getMovementsByProduct,
  adjustStock,
};
