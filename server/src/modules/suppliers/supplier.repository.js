const Supplier = require('./supplier.model');

const findAll = ({ filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) =>
  Supplier.find(filter).sort(sort).skip(skip).limit(limit);

const countAll = (filter = {}) => Supplier.countDocuments(filter);

const findById    = (id)    => Supplier.findById(id);
const findByEmail = (email) => Supplier.findOne({ email });
const findByName  = (name)  => Supplier.findOne({ name: new RegExp(`^${name}$`, 'i') });

const create = (data) => Supplier.create(data);

const updateById = (id, data) =>
  Supplier.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteById = (id) => Supplier.findByIdAndDelete(id);

const findAllActive = () => Supplier.find({ isActive: true }).sort({ name: 1 });

module.exports = {
  findAll,
  countAll,
  findById,
  findByEmail,
  findByName,
  create,
  updateById,
  deleteById,
  findAllActive,
};
