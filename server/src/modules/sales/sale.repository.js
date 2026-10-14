const Sale     = require('./sale.model');
const SaleItem = require('../sale-items/saleItem.model');

// ── Sale queries ──────────────────────────────────────────────────────────────

const findAll = ({ filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) =>
  Sale.find(filter)
    .populate('customer', 'name email phone')
    .populate('soldBy',   'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);

const countAll = (filter = {}) => Sale.countDocuments(filter);

const findById = (id) =>
  Sale.findById(id)
    .populate('customer', 'name email phone')
    .populate('soldBy',   'name email');

// ── SaleItem queries ──────────────────────────────────────────────────────────

const findItemsBySaleId = (saleId) =>
  SaleItem.find({ sale: saleId }).populate('product', 'name sku price');

// ── Transactional writes ──────────────────────────────────────────────────────

/**
 * Create a Sale document. session may be null on standalone MongoDB.
 */
const createSale = (data, session) =>
  session
    ? Sale.create([data], { session })
    : Sale.create([data]);

/**
 * Insert SaleItem documents. session may be null on standalone MongoDB.
 */
const createSaleItems = (items, session) =>
  session
    ? SaleItem.insertMany(items, { session })
    : SaleItem.insertMany(items);

/**
 * Update sale status (no transaction needed — status update only).
 */
const updateStatus = (id, data) =>
  Sale.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('customer', 'name email phone')
    .populate('soldBy',   'name email');

/**
 * Generate a unique sale number: SALE-YYYYMMDD-XXXXX
 */
const generateSaleNumber = async () => {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Sale.countDocuments();
  const seq   = String(count + 1).padStart(5, '0');
  return `SALE-${datePart}-${seq}`;
};

module.exports = {
  findAll,
  countAll,
  findById,
  findItemsBySaleId,
  createSale,
  createSaleItems,
  updateStatus,
  generateSaleNumber,
};
