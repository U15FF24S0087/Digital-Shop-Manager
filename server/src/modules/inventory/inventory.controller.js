const catchAsync = require('../../utils/catchAsync');
const { sendSuccess, sendCreated, sendPaginated } = require('../../utils/apiResponse');
const inventoryService = require('./inventory.service');

const getStockSummary = catchAsync(async (req, res) => {
  const { products, total, page, limit } = await inventoryService.getStockSummary(req.query);
  sendPaginated(res, { data: products, page, limit, total, message: 'Stock summary retrieved' });
});

const getLowStockAlerts = catchAsync(async (_req, res) => {
  const products = await inventoryService.getLowStockAlerts();
  sendSuccess(res, { message: 'Low stock alerts retrieved', data: products });
});

const getMovements = catchAsync(async (req, res) => {
  const { movements, total, page, limit } = await inventoryService.getMovements(req.query);
  sendPaginated(res, { data: movements, page, limit, total, message: 'Movements retrieved' });
});

const getMovementsByProduct = catchAsync(async (req, res) => {
  const result = await inventoryService.getMovementsByProduct(req.params.productId, req.query);
  sendPaginated(res, {
    data:    result.movements,
    page:    result.page,
    limit:   result.limit,
    total:   result.total,
    message: `Movement history for ${result.product.name}`,
  });
});

const adjustStock = catchAsync(async (req, res) => {
  const result = await inventoryService.adjustStock(req.body, req.user);
  sendCreated(res, { message: 'Stock adjusted successfully', data: result });
});

module.exports = {
  getStockSummary,
  getLowStockAlerts,
  getMovements,
  getMovementsByProduct,
  adjustStock,
};
