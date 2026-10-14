const catchAsync = require('../../utils/catchAsync');
const { sendSuccess, sendCreated, sendPaginated } = require('../../utils/apiResponse');
const saleService = require('./sale.service');

const getSales = catchAsync(async (req, res) => {
  const { sales, total, page, limit } = await saleService.getSales(req.query);
  sendPaginated(res, { data: sales, page, limit, total });
});

const getSaleById = catchAsync(async (req, res) => {
  const sale = await saleService.getSaleById(req.params.id);
  sendSuccess(res, { data: sale });
});

const createSale = catchAsync(async (req, res) => {
  const result = await saleService.createSale(req.body, req.user);
  sendCreated(res, {
    message: 'Sale created successfully',
    data: result,
  });
});

const updateSaleStatus = catchAsync(async (req, res) => {
  const sale = await saleService.updateSaleStatus(req.params.id, req.body);
  sendSuccess(res, { message: 'Sale status updated successfully', data: sale });
});

module.exports = { getSales, getSaleById, createSale, updateSaleStatus };
