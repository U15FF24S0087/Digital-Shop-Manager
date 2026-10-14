/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Stock levels, manual adjustments and movement history
 */

const express      = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const validate     = require('../../middleware/validate');
const { adjustStockSchema } = require('./inventory.validators');
const ctrl         = require('./inventory.controller');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Stock summary — all active products with current stock levels
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: lowStock
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 */
router.get('/', authorize('inventory:read'), ctrl.getStockSummary);

/**
 * @swagger
 * /inventory/low-stock:
 *   get:
 *     summary: Products at or below their low-stock threshold
 *     tags: [Inventory]
 */
router.get('/low-stock', authorize('inventory:read'), ctrl.getLowStockAlerts);

/**
 * @swagger
 * /inventory/movements:
 *   get:
 *     summary: All inventory movements (paginated, filterable)
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: product
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [sale, purchase, adjustment, return_in, return_out, damage] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 */
router.get('/movements', authorize('inventory:read'), ctrl.getMovements);

/**
 * @swagger
 * /inventory/adjust:
 *   post:
 *     summary: Manually adjust stock for a product (transactional)
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product, type, quantityChange]
 *             properties:
 *               product:        { type: string, description: "Product ObjectId" }
 *               type:           { type: string, enum: [adjustment, return_in, return_out, damage] }
 *               quantityChange: { type: integer, description: "Positive = add, Negative = remove" }
 *               notes:          { type: string }
 */
router.post('/adjust', authorize('inventory:adjust'), validate(adjustStockSchema), ctrl.adjustStock);

/**
 * @swagger
 * /inventory/products/{productId}/movements:
 *   get:
 *     summary: Movement history for a specific product
 *     tags: [Inventory]
 */
router.get('/products/:productId/movements', authorize('inventory:read'), ctrl.getMovementsByProduct);

module.exports = router;
