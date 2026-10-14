const User = require('./user.model');

const findAll = ({ filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) =>
  User.find(filter)
    .populate('role', 'name')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select('-password');

const countAll = (filter = {}) => User.countDocuments(filter);

const findById = (id) =>
  User.findById(id).populate('role', 'name permissions').select('-password');

const findByEmail = (email) =>
  User.findOne({ email }).populate('role', 'name permissions').select('-password');

const create = (data) => User.create(data);

const updateById = (id, updates) =>
  User.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate('role', 'name permissions')
    .select('-password');

const deleteById = (id) => User.findByIdAndDelete(id);

// Find a user with the password field for admin reset
const findByIdWithPassword = (id) =>
  User.findById(id).select('+password');

module.exports = {
  findAll,
  countAll,
  findById,
  findByEmail,
  create,
  updateById,
  deleteById,
  findByIdWithPassword,
};
