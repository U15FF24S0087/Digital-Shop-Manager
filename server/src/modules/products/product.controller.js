const catchAsync = require('../../utils/catchAsync');
const { sendSuccess, sendCreated, sendPaginated } = require('../../utils/apiResponse');
const productService = require('./product.service');

const getProducts = catchAsync(async (req, res) => {
  const { products, total, page, limit } = await productService.getProducts(req.query);
  sendPaginated(res, { data: products, page, limit, total });
});

const getProductStats = catchAsync(async (_req, res) => {
  const stats = await productService.getProductStats();
  sendSuccess(res, { message: 'Product statistics retrieved', data: stats });
});

const getLowStockProducts = catchAsync(async (_req, res) => {
  const products = await productService.getLowStockProducts();
  sendSuccess(res, { data: products });
});

const getProductById = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  sendSuccess(res, { data: product });
});

const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user);
  sendCreated(res, { message: 'Product created successfully', data: product });
});

const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  sendSuccess(res, { message: 'Product updated successfully', data: product });
});

const deleteProduct = catchAsync(async (req, res) => {
  const product = await productService.deleteProduct(req.params.id);
  sendSuccess(res, { message: 'Product deactivated successfully', data: product });
});

module.exports = {
  getProducts,
  getProductStats,
  getLowStockProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
