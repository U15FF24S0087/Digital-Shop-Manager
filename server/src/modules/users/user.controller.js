const catchAsync = require('../../utils/catchAsync');
const { sendSuccess, sendCreated, sendPaginated } = require('../../utils/apiResponse');
const userService = require('./user.service');

const getUsers = catchAsync(async (req, res) => {
  const { users, total, page, limit } = await userService.getUsers(req.query);
  sendPaginated(res, { data: users, page, limit, total });
});

const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  sendSuccess(res, { data: user });
});

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  sendCreated(res, { message: 'User created successfully', data: user });
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user);
  sendSuccess(res, { message: 'User updated successfully', data: user });
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user);
  sendSuccess(res, { message: 'User deleted successfully' });
});

const adminResetPassword = catchAsync(async (req, res) => {
  const result = await userService.adminResetPassword(req.params.id, req.body.newPassword);
  sendSuccess(res, result);
});

const toggleUserStatus = catchAsync(async (req, res) => {
  const user = await userService.toggleUserStatus(req.params.id, req.user);
  sendSuccess(res, {
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: user,
  });
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  adminResetPassword,
  toggleUserStatus,
};
