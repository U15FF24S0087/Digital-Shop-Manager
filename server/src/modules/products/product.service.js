const AppError  = require('../../utils/AppError');
const { getPagination } = require('../../utils/pagination');
const repo      = require('./product.repository');
const Product   = require('./product.model');
const Category  = require('../categories/category.model');
const Supplier  = require('../suppliers/supplier.model');
const InventoryMovement = require('../inventory/inventoryMovement.model');
const { withTransaction } = require('../../utils/txnHelper');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFilter = (query) => {
  const filter = {};

  if (query.search?.trim()) {
    const search = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [
      { name: search },
      { sku: search },
    ];
  }

  if (query.category)  filter.category  = query.category;
  if (query.supplier)  filter.supplier  = query.supplier;
  if (query.isActive !== undefined) filter.isActive = query.isActive;

  if (query.stockStatus === 'out_of_stock') {
    filter.stock = 0;
  } else if (query.stockStatus === 'low_stock') {
    filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
  } else if (query.stockStatus === 'in_stock') {
    filter.$expr = { $gt: ['$stock', '$lowStockThreshold'] };
  } else if (query.lowStock) {
    filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
  }

  if (query.minPrice !== undefined) filter.price = { ...filter.price, $gte: Number(query.minPrice) };
  if (query.maxPrice !== undefined) filter.price = { ...filter.price, $lte: Number(query.maxPrice) };

  return filter;
};

const getProducts = async (query) => {
  const { skip, limit, page, sort } = getPagination(query);
  const filter = buildFilter(query);
  const [products, total] = await Promise.all([
    repo.findAll({ filter, skip, limit, sort }),
    repo.countAll(filter),
  ]);
  return { products, total, page, limit };
};

const getProductStats = async () => {
  const [total, active, inactive, lowStock, outOfStock] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: false }),
    Product.countDocuments({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    }),
    Product.countDocuments({ isActive: true, stock: 0 }),
  ]);

  return { total, active, inactive, lowStock, outOfStock };
};

const getLowStockProducts = () => repo.findLowStock();

const getProductById = async (id) => {
  const product = await repo.findById(id);
  if (!product) throw new AppError('Product not found', 404);
  return product;
};

const createProduct = async (data, user) => {
  const skuExists = await repo.findBySku(data.sku);
  if (skuExists) throw new AppError(`SKU "${data.sku.toUpperCase()}" is already in use`, 409);

  const category = await Category.findById(data.category);
  if (!category) throw new AppError('Category not found', 404);
  if (!category.isActive) throw new AppError('Category is inactive', 400);

  if (data.supplier) {
    const supplier = await Supplier.findById(data.supplier);
    if (!supplier) throw new AppError('Supplier not found', 404);
    if (!supplier.isActive) throw new AppError('Supplier is inactive', 400);
  }

  const productData = { ...data, sku: data.sku.trim().toUpperCase() };
  return withTransaction(async (session) => {
    let product;
    if (session) {
      [product] = await Product.create([productData], { session });
    } else {
      product = await repo.create(productData);
    }

    if (product.stock > 0) {
      const movement = {
        product: product._id,
        type: 'adjustment',
        quantityChange: product.stock,
        quantityBefore: 0,
        quantityAfter: product.stock,
        notes: 'Initial stock on product creation',
        performedBy: user._id,
      };
      if (session) await InventoryMovement.create([movement], { session });
      else await InventoryMovement.create(movement);
    }

    return product;
  });
};

const updateProduct = async (id, data) => {
  const product = await repo.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  if (data.sku !== undefined) {
    const upper = data.sku.trim().toUpperCase();
    const skuExists = await repo.findBySku(upper);
    if (skuExists && skuExists._id.toString() !== id) {
      throw new AppError(`SKU "${upper}" is already in use`, 409);
    }
    data.sku = upper;
  }

  if (data.category) {
    const category = await Category.findById(data.category);
    if (!category) throw new AppError('Category not found', 404);
    if (!category.isActive && category._id.toString() !== product.category?._id?.toString()) {
      throw new AppError('Category is inactive', 400);
    }
  }

  if (data.supplier) {
    const supplier = await Supplier.findById(data.supplier);
    if (!supplier) throw new AppError('Supplier not found', 404);
    if (!supplier.isActive) throw new AppError('Supplier is inactive', 400);
  }

  return repo.updateById(id, data);
};

const deleteProduct = async (id) => {
  const product = await repo.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  // Soft-delete: just deactivate rather than remove
  // (keeps historical sale/purchase references intact)
  return repo.updateById(id, { isActive: false });
};

const hardDeleteProduct = async (id) => {
  const product = await repo.findById(id);
  if (!product) throw new AppError('Product not found', 404);
  await repo.deleteById(id);
};

module.exports = {
  getProducts,
  getProductStats,
  getLowStockProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  hardDeleteProduct,
};
