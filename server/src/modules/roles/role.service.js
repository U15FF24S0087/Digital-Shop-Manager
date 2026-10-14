const AppError = require('../../utils/AppError');
const repo     = require('./role.repository');
const User     = require('../users/user.model');
const { PERMISSIONS } = require('./role.model');

const getRoles = () => repo.findAll();

const getRoleById = async (id) => {
  const role = await repo.findById(id);
  if (!role) throw new AppError('Role not found', 404);
  return role;
};

const createRole = async (data) => {
  const exists = await repo.findByName(data.name);
  if (exists) throw new AppError('A role with this name already exists', 409);
  return repo.create(data);
};

const updateRole = async (id, data) => {
  const role = await repo.findById(id);
  if (!role) throw new AppError('Role not found', 404);

  // System roles can have their permissions updated but not renamed
  if (role.isSystem && data.name && data.name !== role.name) {
    throw new AppError(`System role "${role.name}" cannot be renamed`, 400);
  }

  return repo.updateById(id, data);
};

const deleteRole = async (id) => {
  const role = await repo.findById(id);
  if (!role) throw new AppError('Role not found', 404);
  if (role.isSystem) throw new AppError(`System role "${role.name}" cannot be deleted`, 400);

  // Check if any users are assigned this role
  const userCount = await User.countDocuments({ role: id });
  if (userCount > 0) {
    throw new AppError(
      `Cannot delete role: ${userCount} user(s) are currently assigned to it`,
      400,
    );
  }

  await repo.deleteById(id);
};

const getPermissions = () => PERMISSIONS;

module.exports = { getRoles, getRoleById, createRole, updateRole, deleteRole, getPermissions };
