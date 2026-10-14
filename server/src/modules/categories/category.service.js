const AppError = require('../../utils/AppError');
const { getPagination } = require('../../utils/pagination');
const { withTransaction } = require('../../utils/txnHelper');
const repo = require('./category.repository');
const Category = require('./category.model');
const Product = require('../products/product.model');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const slugify = (value) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const getCategories = async (query) => {
  const { skip, limit, page, sort } = getPagination(query);
  const filter = {};
  if (query.search?.trim()) {
    const search = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [{ name: search }, { description: search }];
  }
  if (query.isActive !== undefined) filter.isActive = query.isActive;

  const [categories, total] = await Promise.all([
    repo.findAll({ filter, skip, limit, sort }),
    repo.countAll(filter),
  ]);
  const productCounts = await repo.countProductsByCategory(categories.map(({ _id }) => _id));
  return {
    categories: categories.map((category) => ({
      ...category.toObject(),
      slug: category.slug || slugify(category.name),
      productCount: productCounts.get(category._id.toString()) ?? 0,
    })),
    total,
    page,
    limit,
  };
};

const getCategoryStats = async () => {
  const [total, active, withProducts] = await Promise.all([
    Category.countDocuments(),
    Category.countDocuments({ isActive: true }),
    Product.distinct('category'),
  ]);
  return {
    total,
    active,
    inactive: total - active,
    withProducts: withProducts.length,
  };
};

const getAllCategories = () => repo.findAll({ filter: { isActive: true } });

const getCategoryById = async (id) => {
  const category = await repo.findById(id);
  if (!category) throw new AppError('Category not found', 404);
  const productCount = await Product.countDocuments({ category: id });
  return { ...category.toObject(), slug: category.slug || slugify(category.name), productCount };
};

const getCategoryProducts = async (id, query) => {
  const category = await repo.findById(id);
  if (!category) throw new AppError('Category not found', 404);
  const { skip, limit, page, sort } = getPagination(query);
  const filter = { category: id };
  if (query.search?.trim()) {
    const search = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [{ name: search }, { sku: search }];
  }
  const [products, total] = await Promise.all([
    repo.findProducts({ categoryId: id, search: query.search?.trim(), skip, limit, sort }),
    Product.countDocuments(filter),
  ]);
  return { products, total, page, limit };
};

const createCategory = async (data) => {
  const normalizedName = data.name.trim().replace(/\s+/g, ' ');
  const slug = slugify(data.slug || normalizedName);
  if (!slug) throw new AppError('Category name must contain at least one letter or number', 422);
  if (await repo.findByName(normalizedName)) {
    throw new AppError('A category with this name already exists', 409);
  }
  if (await repo.findBySlug(slug)) {
    throw new AppError('A category with this slug already exists', 409);
  }
  return repo.create({ ...data, name: normalizedName, slug });
};

const updateCategory = async (id, data) => {
  const category = await repo.findById(id);
  if (!category) throw new AppError('Category not found', 404);

  const update = { ...data };
  if (update.name !== undefined) {
    update.name = update.name.trim().replace(/\s+/g, ' ');
    if (await repo.findByName(update.name, id)) {
      throw new AppError('A category with this name already exists', 409);
    }
  }
  if (update.name !== undefined || !category.nameKey) {
    update.nameKey = (update.name || category.name).toLocaleLowerCase('en-US');
  }
  if (update.slug !== undefined || update.name !== undefined || !category.slug) {
    update.slug = slugify(update.slug || update.name || category.name);
    if (!update.slug) throw new AppError('Category slug must contain at least one letter or number', 422);
    if (await repo.findBySlug(update.slug, id)) {
      throw new AppError('A category with this slug already exists', 409);
    }
  }
  const updated = await repo.updateById(id, update);
  if (!updated) throw new AppError('Category not found', 404);
  return updated;
};

const deleteCategory = async (id, reassignTo) => {
  const category = await repo.findById(id);
  if (!category) throw new AppError('Category not found', 404);

  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0 && !reassignTo) {
    throw new AppError(
      `Cannot delete category: ${productCount} product(s) are assigned. Choose another category to reassign them.`,
      409,
    );
  }

  if (reassignTo) {
    if (reassignTo === id) throw new AppError('Choose a different category for reassignment', 422);
    const destination = await repo.findById(reassignTo);
    if (!destination) throw new AppError('Reassignment category not found', 404);
    if (!destination.isActive) throw new AppError('Products can only be reassigned to an active category', 400);
  }

  await withTransaction(async (session) => {
    if (reassignTo) {
      const options = session ? { session } : {};
      await Product.updateMany({ category: id }, { $set: { category: reassignTo } }, options);
    }
    const remainingQuery = Product.countDocuments({ category: id });
    if (session) remainingQuery.session(session);
    const remainingProducts = await remainingQuery;
    if (remainingProducts > 0) {
      throw new AppError('Category still has assigned products and cannot be deleted', 409);
    }
    await Category.deleteOne({ _id: id }, session ? { session } : {});
  });
  return { reassignedProducts: productCount };
};

module.exports = {
  getCategories,
  getCategoryStats,
  getAllCategories,
  getCategoryById,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory,
};
