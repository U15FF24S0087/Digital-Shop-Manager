/**
 * @swagger
 * tags:
 *   name: Purchases
 *   description: >
 *     Purchase management with transactional inventory increase.
 *     Creating a purchase atomically increases stock, applies weighted-average
 *     costing, and records inventory movements — rolls back on any failure.
 */

const express      = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const validate     = require('../../middleware/validate');
const { createPurchaseSchema, updatePurchaseStatusSchema } = require('./purchase.validators');
const ctrl         = require('./purchase.controller');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /purchases:
 *   get:
 *     summary: List purchases (paginated, filterable by supplier/status/date)
 *     tags: [Purchases]
 *     parameters:
 *       - in: query
 *         name: supplier
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, received, partial, cancelled] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *   post:
 *     summary: >
 *       Record a purchase (transactional — validates supplier/products,
 *       increases stock with weighted-average cost update, records movements)
 *     tags: [Purchases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supplier, items]
 *             properties:
 *               supplier:       { type: string }
 *               paymentMethod:  { type: string }
 *               discountAmount: { type: number }
 *               taxAmount:      { type: number }
 *               notes:          { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [product, quantity, unitCost]
 *                   properties:
 *                     product:  { type: string }
 *                     quantity: { type: integer }
 *                     unitCost: { type: number }
 *     responses:
 *       201: { description: Purchase recorded and stock increased }
 *       404: { description: Supplier or product not found }
 */
router.get('/',   authorize('purchases:read'),   ctrl.getPurchases);
router.post('/',  authorize('purchases:create'), validate(createPurchaseSchema), ctrl.createPurchase);

/**
 * @swagger
 * /purchases/{id}:
 *   get:
 *     summary: Get a purchase by ID (includes line items)
 *     tags: [Purchases]
 * /purchases/{id}/status:
 *   patch:
 *     summary: Update a purchase status
 *     tags: [Purchases]
 */
router.get('/:id',          authorize('purchases:read'),   ctrl.getPurchaseById);
router.patch('/:id/status', authorize('purchases:update'), validate(updatePurchaseStatusSchema), ctrl.updatePurchaseStatus);

module.exports = router;
