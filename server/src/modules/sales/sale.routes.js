/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: >
 *     Sale management with transactional inventory deduction.
 *     Creating a sale atomically checks stock, deducts inventory, and records
 *     movements — the entire operation rolls back if anything fails.
 */

const express      = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const validate     = require('../../middleware/validate');
const { createSaleSchema, updateSaleStatusSchema } = require('./sale.validators');
const ctrl         = require('./sale.controller');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: List sales (paginated, filterable by customer/status/date)
 *     tags: [Sales]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: customer
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, completed, cancelled, refunded] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *   post:
 *     summary: >
 *       Create a sale (transactional — validates stock, deducts inventory,
 *       records movements atomically)
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               customer:      { type: string, description: "Customer ObjectId (optional)" }
 *               paymentMethod: { type: string, enum: [cash, card, bank_transfer, other] }
 *               taxRate:       { type: number, example: 8.5 }
 *               notes:         { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product, quantity]
 *                   properties:
 *                     product:         { type: string }
 *                     quantity:        { type: integer, minimum: 1 }
 *                     unitPrice:       { type: number }
 *                     discountPercent: { type: number }
 *     responses:
 *       201: { description: Sale created and inventory deducted }
 *       422: { description: Insufficient stock }
 *       404: { description: Product not found }
 */
router.get('/',   authorize('sales:read'),   ctrl.getSales);
router.post('/',  authorize('sales:create'), validate(createSaleSchema), ctrl.createSale);

/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     summary: Get a sale by ID (includes line items)
 *     tags: [Sales]
 * /sales/{id}/status:
 *   patch:
 *     summary: Update a sale status (cancelled / refunded)
 *     tags: [Sales]
 */
router.get('/:id',          authorize('sales:read'),   ctrl.getSaleById);
router.patch('/:id/status', authorize('sales:update'), validate(updateSaleStatusSchema), ctrl.updateSaleStatus);

module.exports = router;
