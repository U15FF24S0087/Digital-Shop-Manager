const AppError = require('../../utils/AppError');
const { getPagination } = require('../../utils/pagination');
const repo = require('./customer.repository');
const Sale = require('../sales/sale.model');
const SaleItem = require('../sale-items/saleItem.model');

// ── Filter builder ────────────────────────────────────────────────────────────
const buildFilter = (query) => {
  const filter = {};
  if (query.search) {
    const re = new RegExp(query.search, 'i');
    filter.$or = [{ name: re }, { email: re }, { phone: re }];
  }
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  return filter;
};

// ── Service methods ───────────────────────────────────────────────────────────

const getCustomers = async (query) => {
  const { skip, limit, page, sort } = getPagination(query);
  const filter = buildFilter(query);
  const [customers, total] = await Promise.all([
    repo.findAll({ filter, skip, limit, sort }),
    repo.countAll(filter),
  ]);
  return { customers, total, page, limit };
};

const getAllActiveCustomers = () => repo.findAllActive();

const getCustomerById = async (id) => {
  const customer = await repo.findById(id);
  if (!customer) throw new AppError('Customer not found', 404);
  return customer;
};

const createCustomer = async (data) => {
  if (data.email) {
    const exists = await repo.findByEmail(data.email);
    if (exists) throw new AppError('A customer with this email already exists', 409);
  }
  return repo.create(data);
};

const updateCustomer = async (id, data) => {
  const customer = await repo.findById(id);
  if (!customer) throw new AppError('Customer not found', 404);

  if (data.email && data.email !== customer.email) {
    const exists = await repo.findByEmail(data.email);
    if (exists) throw new AppError('A customer with this email already exists', 409);
  }

  return repo.updateById(id, data);
};

const deleteCustomer = async (id) => {
  const customer = await repo.findById(id);
  if (!customer) throw new AppError('Customer not found', 404);

  // Soft-delete to preserve sales history
  return repo.updateById(id, { isActive: false });
};

/**
 * Return all sales + their items for a given customer.
 */
const getCustomerPurchaseHistory = async (customerId) => {
  const customer = await repo.findById(customerId);
  if (!customer) throw new AppError('Customer not found', 404);

  const sales = await Sale.find({ customer: customerId })
    .sort({ saleDate: -1 })
    .populate('soldBy', 'name email')
    .lean();

  // Attach items to each sale
  const salesWithItems = await Promise.all(
    sales.map(async (sale) => {
      const items = await SaleItem.find({ sale: sale._id })
        .populate('product', 'name sku')
        .lean();
      return { ...sale, items };
    }),
  );

  return { customer, sales: salesWithItems };
};

module.exports = {
  getCustomers,
  getAllActiveCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerPurchaseHistory,
};
