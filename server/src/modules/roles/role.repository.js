const Role = require('./role.model');

const findAll  = () => Role.find().sort({ name: 1 });
const findById = (id) => Role.findById(id);
const findByName = (name) => Role.findOne({ name });
const create   = (data) => Role.create(data);
const updateById = (id, data) =>
  Role.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteById = (id) => Role.findByIdAndDelete(id);

module.exports = { findAll, findById, findByName, create, updateById, deleteById };
