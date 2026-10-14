const AppError = require('../../utils/AppError');
const { getPagination } = require('../../utils/pagination');
const repo     = require('./user.repository');
const RoleModel = require('../roles/role.model');

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildFilter = (query) => {
  const filter = {};
  if (query.search) {
    const re = new RegExp(query.search, 'i');
    filter.$or = [{ name: re }, { email: re }];
  }
  if (query.role)     filter.role     = query.role;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  return filter;
};

// ── Service methods ───────────────────────────────────────────────────────────

const getUsers = async (query) => {
  const { skip, limit, page, sort } = getPagination(query);
  const filter = buildFilter(query);
  const [users, total] = await Promise.all([
    repo.findAll({ filter, skip, limit, sort }),
    repo.countAll(filter),
  ]);
  return { users, total, page, limit };
};

const getUserById = async (id) => {
  const user = await repo.findById(id);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const createUser = async (data) => {
  const exists = await repo.findByEmail(data.email);
  if (exists) throw new AppError('A user with this email already exists', 409);

  const role = await RoleModel.findById(data.role);
  if (!role) throw new AppError('Role not found', 404);

  // User model's pre-save hook will hash the password
  const user = await repo.create(data);
  return repo.findById(user._id);
};

const updateUser = async (id, data, requestingUser) => {
  const user = await repo.findById(id);
  if (!user) throw new AppError('User not found', 404);

  // Prevent demoting the last Admin
  if (data.role || data.isActive === false) {
    const currentRole = user.role?.name;
    if (currentRole === 'Admin') {
      const adminRole  = await RoleModel.findOne({ name: 'Admin' });
      const adminCount = await require('./user.model').countDocuments({
        role: adminRole?._id,
        isActive: true,
        _id: { $ne: id },
      });
      if (adminCount === 0) {
        throw new AppError('Cannot remove or demote the last active Admin', 400);
      }
    }
  }

  // Prevent users from editing their own role/status
  if (requestingUser._id.toString() === id) {
    delete data.role;
    delete data.isActive;
  }

  if (data.role) {
    const role = await RoleModel.findById(data.role);
    if (!role) throw new AppError('Role not found', 404);
  }

  return repo.updateById(id, data);
};

const deleteUser = async (id, requestingUser) => {
  if (requestingUser._id.toString() === id) {
    throw new AppError('You cannot delete your own account', 400);
  }
  const user = await repo.findById(id);
  if (!user) throw new AppError('User not found', 404);

  if (user.role?.name === 'Admin') {
    const adminRole  = await RoleModel.findOne({ name: 'Admin' });
    const adminCount = await require('./user.model').countDocuments({
      role: adminRole?._id,
      _id: { $ne: id },
    });
    if (adminCount === 0) {
      throw new AppError('Cannot delete the last Admin account', 400);
    }
  }

  await repo.deleteById(id);
};

const adminResetPassword = async (id, newPassword) => {
  const user = await repo.findByIdWithPassword(id);
  if (!user) throw new AppError('User not found', 404);
  user.password = newPassword;
  await user.save();
  return { message: 'Password reset successfully' };
};

const toggleUserStatus = async (id, requestingUser) => {
  const user = await repo.findById(id);
  if (!user) throw new AppError('User not found', 404);
  if (requestingUser._id.toString() === id) {
    throw new AppError('You cannot deactivate your own account', 400);
  }
  return repo.updateById(id, { isActive: !user.isActive });
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  adminResetPassword,
  toggleUserStatus,
};
