const Customer = require('./customer.model');

const findAll = ({ filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) =>
  Customer.find(filter).sort(sort).skip(skip).limit(limit);

const countAll = (filter = {}) => Customer.countDocuments(filter);

const findById    = (id)    => Customer.findById(id);
const findByEmail = (email) => Customer.findOne({ email });

const create = (data) => Customer.create(data);

const updateById = (id, data) =>
  Customer.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteById = (id) => Customer.findByIdAndDelete(id);

// Purchase history — resolved in the sales service
const findAllActive = () => Customer.find({ isActive: true }).sort({ name: 1 });

module.exports = {
  findAll,
  countAll,
  findById,
  findByEmail,
  create,
  updateById,
  deleteById,
  findAllActive,
};
