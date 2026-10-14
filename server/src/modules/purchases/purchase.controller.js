const catchAsync = require('../../utils/catchAsync');
const { sendSuccess, sendCreated, sendPaginated } = require('../../utils/apiResponse');
const purchaseService = require('./purchase.service');

const getPurchases = catchAsync(async (req, res) => {
  const { purchases, total, page, limit } = await purchaseService.getPurchases(req.query);
  sendPaginated(res, { data: purchases, page, limit, total });
});

const getPurchaseById = catchAsync(async (req, res) => {
  const purchase = await purchaseService.getPurchaseById(req.params.id);
  sendSuccess(res, { data: purchase });
});

const createPurchase = catchAsync(async (req, res) => {
  const result = await purchaseService.createPurchase(req.body, req.user);
  sendCreated(res, {
    message: 'Purchase recorded successfully',
    data: result,
  });
});

const updatePurchaseStatus = catchAsync(async (req, res) => {
  const purchase = await purchaseService.updatePurchaseStatus(req.params.id, req.body);
  sendSuccess(res, { message: 'Purchase status updated successfully', data: purchase });
});

module.exports = { getPurchases, getPurchaseById, createPurchase, updatePurchaseStatus };
