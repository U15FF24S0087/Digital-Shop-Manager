const catchAsync = require('../../utils/catchAsync');
const { sendSuccess, sendCreated, sendPaginated } = require('../../utils/apiResponse');
const supplierService = require('./supplier.service');

const getSuppliers = catchAsync(async (req, res) => {
  const { suppliers, total, page, limit } = await supplierService.getSuppliers(req.query);
  sendPaginated(res, { data: suppliers, page, limit, total });
});

const getAllActiveSuppliers = catchAsync(async (_req, res) => {
  const suppliers = await supplierService.getAllActiveSuppliers();
  sendSuccess(res, { data: suppliers });
});

const getSupplierById = catchAsync(async (req, res) => {
  const supplier = await supplierService.getSupplierById(req.params.id);
  sendSuccess(res, { data: supplier });
});

const createSupplier = catchAsync(async (req, res) => {
  const supplier = await supplierService.createSupplier(req.body);
  sendCreated(res, { message: 'Supplier created successfully', data: supplier });
});

const updateSupplier = catchAsync(async (req, res) => {
  const supplier = await supplierService.updateSupplier(req.params.id, req.body);
  sendSuccess(res, { message: 'Supplier updated successfully', data: supplier });
});

const deleteSupplier = catchAsync(async (req, res) => {
  const supplier = await supplierService.deleteSupplier(req.params.id);
  sendSuccess(res, { message: 'Supplier deactivated successfully', data: supplier });
});

const getSupplierPurchaseHistory = catchAsync(async (req, res) => {
  const result = await supplierService.getSupplierPurchaseHistory(req.params.id);
  sendSuccess(res, { data: result });
});

module.exports = {
  getSuppliers,
  getAllActiveSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierPurchaseHistory,
};
