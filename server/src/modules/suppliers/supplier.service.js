const AppError = require('../../utils/AppError');
const { getPagination } = require('../../utils/pagination');
const repo     = require('./supplier.repository');
const Purchase = require('../purchases/purchase.model');
const PurchaseItem = require('../purchase-items/purchaseItem.model');
const Product  = require('../products/product.model');

// ── Filter builder ────────────────────────────────────────────────────────────
const buildFilter = (query) => {
  const filter = {};
  if (query.search) {
    const re = new RegExp(query.search, 'i');
    filter.$or = [{ name: re }, { email: re }, { contactPerson: re }];
  }
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  return filter;
};

// ── Service methods ───────────────────────────────────────────────────────────

const getSuppliers = async (query) => {
  const { skip, limit, page, sort } = getPagination(query);
  const filter = buildFilter(query);
  const [suppliers, total] = await Promise.all([
    repo.findAll({ filter, skip, limit, sort }),
    repo.countAll(filter),
  ]);
  return { suppliers, total, page, limit };
};

const getAllActiveSuppliers = () => repo.findAllActive();

const getSupplierById = async (id) => {
  const supplier = await repo.findById(id);
  if (!supplier) throw new AppError('Supplier not found', 404);
  return supplier;
};

const createSupplier = async (data) => {
  if (data.email) {
    const emailExists = await repo.findByEmail(data.email);
    if (emailExists) throw new AppError('A supplier with this email already exists', 409);
  }
  return repo.create(data);
};

const updateSupplier = async (id, data) => {
  const supplier = await repo.findById(id);
  if (!supplier) throw new AppError('Supplier not found', 404);

  if (data.email && data.email !== supplier.email) {
    const emailExists = await repo.findByEmail(data.email);
    if (emailExists) throw new AppError('A supplier with this email already exists', 409);
  }

  return repo.updateById(id, data);
};

const deleteSupplier = async (id) => {
  const supplier = await repo.findById(id);
  if (!supplier) throw new AppError('Supplier not found', 404);

  // Soft-delete to preserve purchase history
  return repo.updateById(id, { isActive: false });
};

/**
 * Return all purchases + their items for a given supplier.
 */
const getSupplierPurchaseHistory = async (supplierId) => {
  const supplier = await repo.findById(supplierId);
  if (!supplier) throw new AppError('Supplier not found', 404);

  const purchases = await Purchase.find({ supplier: supplierId })
    .sort({ purchaseDate: -1 })
    .populate('purchasedBy', 'name email')
    .lean();

  const purchasesWithItems = await Promise.all(
    purchases.map(async (purchase) => {
      const items = await PurchaseItem.find({ purchase: purchase._id })
        .populate('product', 'name sku')
        .lean();
      return { ...purchase, items };
    }),
  );

  // Count products linked to this supplier
  const productCount = await Product.countDocuments({ supplier: supplierId, isActive: true });

  return { supplier, purchases: purchasesWithItems, productCount };
};

module.exports = {
  getSuppliers,
  getAllActiveSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierPurchaseHistory,
};
