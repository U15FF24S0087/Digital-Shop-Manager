const catchAsync = require('../../utils/catchAsync');
const { sendSuccess, sendCreated, sendPaginated } = require('../../utils/apiResponse');
const customerService = require('./customer.service');

const getCustomers = catchAsync(async (req, res) => {
  const { customers, total, page, limit } = await customerService.getCustomers(req.query);
  sendPaginated(res, { data: customers, page, limit, total });
});

const getAllActiveCustomers = catchAsync(async (_req, res) => {
  const customers = await customerService.getAllActiveCustomers();
  sendSuccess(res, { data: customers });
});

const getCustomerById = catchAsync(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  sendSuccess(res, { data: customer });
});

const createCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  sendCreated(res, { message: 'Customer created successfully', data: customer });
});

const updateCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  sendSuccess(res, { message: 'Customer updated successfully', data: customer });
});

const deleteCustomer = catchAsync(async (req, res) => {
  const customer = await customerService.deleteCustomer(req.params.id);
  sendSuccess(res, { message: 'Customer deactivated successfully', data: customer });
});

const getCustomerPurchaseHistory = catchAsync(async (req, res) => {
  const result = await customerService.getCustomerPurchaseHistory(req.params.id);
  sendSuccess(res, { data: result });
});

module.exports = {
  getCustomers,
  getAllActiveCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerPurchaseHistory,
};
