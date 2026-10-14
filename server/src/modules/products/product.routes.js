/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management with SKU, pricing and stock
 */

const express      = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const validate     = require('../../middleware/validate');
const {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} = require('./product.validators');
const ctrl         = require('./product.controller');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /products/stats:
 *   get:
 *     summary: Get total, active, inactive, low-stock and out-of-stock counts
 *     tags: [Products]
 */
/**
 * @swagger
 * /products/low-stock:
 *   get:
 *     summary: Get all products at or below their low-stock threshold
 *     tags: [Products]
 */
router.get('/stats', authorize('products:read'), ctrl.getProductStats);
router.get('/low-stock', authorize('products:read'), ctrl.getLowStockProducts);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List products (paginated, searchable, filterable)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, SKU or description
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: supplier
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: stockStatus
 *         schema: { type: string, enum: [in_stock, low_stock, out_of_stock] }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [name, price, cost, stock, createdAt, updatedAt] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 */
router.get('/',    authorize('products:read'), validate(productQuerySchema, 'query'), ctrl.getProducts);
router.post('/',   authorize('products:create'), validate(createProductSchema), ctrl.createProduct);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *   patch:
 *     summary: Update product catalog details (stock is managed through Inventory)
 *     tags: [Products]
 *   delete:
 *     summary: Deactivate (soft-delete) a product
 *     tags: [Products]
 */
router.get('/:id',    authorize('products:read'),   ctrl.getProductById);
router.patch('/:id',  authorize('products:update'), validate(updateProductSchema), ctrl.updateProduct);
router.put('/:id',    authorize('products:update'), validate(updateProductSchema), ctrl.updateProduct);
router.delete('/:id', authorize('products:delete'), ctrl.deleteProduct);

module.exports = router;
