/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Product category management
 */

const express      = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const validate     = require('../../middleware/validate');
const {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
  categoryProductsQuerySchema,
  categoryIdSchema,
  deleteCategoryQuerySchema,
} = require('./category.validators');
const ctrl         = require('./category.controller');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /categories/all:
 *   get:
 *     summary: Get all active categories (no pagination — for dropdowns)
 *     tags: [Categories]
 */
router.get('/stats', authorize('categories:read'), ctrl.getCategoryStats);
router.get('/all', authorize('categories:read'), ctrl.getAllCategories);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: List categories (paginated)
 *     tags: [Categories]
 *   post:
 *     summary: Create a category
 *     tags: [Categories]
 */
router.get('/',    authorize('categories:read'), validate(categoryQuerySchema, 'query'), ctrl.getCategories);
router.post('/',   authorize('categories:create'), validate(createCategorySchema), ctrl.createCategory);

router.get('/:id/products', authorize('products:read'), validate(categoryIdSchema, 'params'), validate(categoryProductsQuerySchema, 'query'), ctrl.getCategoryProducts);
router.get('/:id',    authorize('categories:read'),   validate(categoryIdSchema, 'params'), ctrl.getCategoryById);
router.patch('/:id',  authorize('categories:update'), validate(categoryIdSchema, 'params'), validate(updateCategorySchema), ctrl.updateCategory);
router.put('/:id',    authorize('categories:update'), validate(categoryIdSchema, 'params'), validate(updateCategorySchema), ctrl.updateCategory);
router.delete('/:id', authorize('categories:delete'), validate(categoryIdSchema, 'params'), validate(deleteCategoryQuerySchema, 'query'), ctrl.deleteCategory);

module.exports = router;
