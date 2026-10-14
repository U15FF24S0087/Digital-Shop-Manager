const Category = require('./category.model');
const Product = require('../products/product.model');

const findAll = ({ filter = {}, skip = 0, limit = 20, sort = { name: 1 } } = {}) =>
  Category.find(filter).sort(sort).skip(skip).limit(limit);

const countAll = (filter = {}) => Category.countDocuments(filter);

const findById   = (id)   => Category.findById(id);
const findByName = (name, excludeId) => {
  const filter = { name: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
  if (excludeId) filter._id = { $ne: excludeId };
  return Category.findOne(filter);
};
const findBySlug = (slug, excludeId) => {
  const filter = { slug };
  if (excludeId) filter._id = { $ne: excludeId };
  return Category.findOne(filter);
};
const create     = (data) => Category.create(data);

const updateById = (id, data) =>
  Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteById = (id) => Category.findByIdAndDelete(id);

const countProductsByCategory = async (ids) => {
  const counts = await Product.aggregate([
    { $match: { category: { $in: ids } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  return new Map(counts.map(({ _id, count }) => [_id.toString(), count]));
};

const findProducts = ({ categoryId, search, skip, limit, sort }) => {
  const filter = { category: categoryId };
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: new RegExp(escaped, 'i') },
      { sku: new RegExp(escaped, 'i') },
    ];
  }
  return Product.find(filter)
    .populate('category', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

module.exports = {
  findAll,
  countAll,
  findById,
  findByName,
  findBySlug,
  create,
  updateById,
  deleteById,
  countProductsByCategory,
  findProducts,
};
