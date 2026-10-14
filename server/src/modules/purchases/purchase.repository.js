const Purchase     = require('./purchase.model');
const PurchaseItem = require('../purchase-items/purchaseItem.model');

// ── Purchase queries ──────────────────────────────────────────────────────────

const findAll = ({ filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) =>
  Purchase.find(filter)
    .populate('supplier',    'name email phone')
    .populate('purchasedBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);

const countAll = (filter = {}) => Purchase.countDocuments(filter);

const findById = (id) =>
  Purchase.findById(id)
    .populate('supplier',    'name email phone')
    .populate('purchasedBy', 'name email');

// ── PurchaseItem queries ──────────────────────────────────────────────────────

const findItemsByPurchaseId = (purchaseId) =>
  PurchaseItem.find({ purchase: purchaseId }).populate('product', 'name sku cost');

// ── Transactional writes ──────────────────────────────────────────────────────

/**
 * Create a Purchase document. session may be null on standalone MongoDB.
 */
const createPurchase = (data, session) =>
  session
    ? Purchase.create([data], { session })
    : Purchase.create([data]);

/**
 * Insert PurchaseItem documents. session may be null on standalone MongoDB.
 */
const createPurchaseItems = (items, session) =>
  session
    ? PurchaseItem.insertMany(items, { session })
    : PurchaseItem.insertMany(items);

const updateStatus = (id, data) =>
  Purchase.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('supplier',    'name email phone')
    .populate('purchasedBy', 'name email');

/**
 * Generate a unique purchase order number: PO-YYYYMMDD-XXXXX
 */
const generatePurchaseNumber = async () => {
  const today    = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count    = await Purchase.countDocuments();
  const seq      = String(count + 1).padStart(5, '0');
  return `PO-${datePart}-${seq}`;
};

module.exports = {
  findAll,
  countAll,
  findById,
  findItemsByPurchaseId,
  createPurchase,
  createPurchaseItems,
  updateStatus,
  generatePurchaseNumber,
};
