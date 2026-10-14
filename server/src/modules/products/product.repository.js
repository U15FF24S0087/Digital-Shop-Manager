const Product = require('./product.model');

const findAll = ({ filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) =>
  Product.find(filter)
    .populate('category', 'name')
    .populate('supplier', 'name')
    .sort(sort)
    .skip(skip)
    .limit(limit);

const countAll = (filter = {}) => Product.countDocuments(filter);

const findById = (id) =>
  Product.findById(id)
    .populate('category', 'name')
    .populate('supplier', 'name');

const findBySku = (sku) =>
  Product.findOne({ sku: sku.toUpperCase() });

// Find by id within a session (for transactions)
const findByIdSession = (id, session) =>
  Product.findById(id).session(session);

const create     = (data)        => Product.create(data);
const updateById = (id, data)    =>
  Product.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('category', 'name')
    .populate('supplier', 'name');

const deleteById = (id) => Product.findByIdAndDelete(id);

// Low-stock products
const findLowStock = () =>
  Product.find({
    isActive: true,
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
  })
    .populate('category', 'name')
    .sort({ stock: 1 });

module.exports = {
  findAll,
  countAll,
  findById,
  findBySku,
  findByIdSession,
  create,
  updateById,
  deleteById,
  findLowStock,
};
