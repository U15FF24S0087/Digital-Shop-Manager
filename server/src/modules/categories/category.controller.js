const catchAsync = require('../../utils/catchAsync');
const { sendSuccess, sendCreated, sendPaginated } = require('../../utils/apiResponse');
const categoryService = require('./category.service');

const getCategories = catchAsync(async (req, res) => {
  const { categories, total, page, limit } = await categoryService.getCategories(req.query);
  sendPaginated(res, { data: categories, page, limit, total });
});

const getCategoryStats = catchAsync(async (_req, res) => {
  const stats = await categoryService.getCategoryStats();
  sendSuccess(res, { data: stats });
});

const getAllCategories = catchAsync(async (_req, res) => {
  const categories = await categoryService.getAllCategories();
  sendSuccess(res, { data: categories });
});

const getCategoryProducts = catchAsync(async (req, res) => {
  const { products, total, page, limit } = await categoryService.getCategoryProducts(req.params.id, req.query);
  sendPaginated(res, { data: products, page, limit, total });
});

const getCategoryById = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  sendSuccess(res, { data: category });
});

const createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  sendCreated(res, { message: 'Category created successfully', data: category });
});

const updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  sendSuccess(res, { message: 'Category updated successfully', data: category });
});

const deleteCategory = catchAsync(async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id, req.query.reassignTo);
  sendSuccess(res, { message: 'Category deleted successfully', data: result });
});

module.exports = {
  getCategories,
  getCategoryStats,
  getAllCategories,
  getCategoryProducts,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
