const catchAsync = require('../../utils/catchAsync');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');
const roleService = require('./role.service');

const getRoles = catchAsync(async (_req, res) => {
  const roles = await roleService.getRoles();
  sendSuccess(res, { data: roles });
});

const getRoleById = catchAsync(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);
  sendSuccess(res, { data: role });
});

const createRole = catchAsync(async (req, res) => {
  const role = await roleService.createRole(req.body);
  sendCreated(res, { message: 'Role created successfully', data: role });
});

const updateRole = catchAsync(async (req, res) => {
  const role = await roleService.updateRole(req.params.id, req.body);
  sendSuccess(res, { message: 'Role updated successfully', data: role });
});

const deleteRole = catchAsync(async (req, res) => {
  await roleService.deleteRole(req.params.id);
  sendSuccess(res, { message: 'Role deleted successfully' });
});

const getPermissions = catchAsync(async (_req, res) => {
  const permissions = roleService.getPermissions();
  sendSuccess(res, { data: permissions });
});

module.exports = { getRoles, getRoleById, createRole, updateRole, deleteRole, getPermissions };
