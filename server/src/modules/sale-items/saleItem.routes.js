/**
 * @swagger
 * tags:
 *   name: SaleItems
 *   description: >
 *     Read-only access to individual sale line items.
 *     Items are created automatically when a sale is posted.
 */

const express      = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const catchAsync   = require('../../utils/catchAsync');
const { sendSuccess, sendPaginated } = require('../../utils/apiResponse');
const SaleItem     = require('./saleItem.model');
const { getPagination } = require('../../utils/pagination');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /sale-items:
 *   get:
 *     summary: List sale items (filterable by sale or product)
 *     tags: [SaleItems]
 *     parameters:
 *       - in: query
 *         name: sale
 *         schema: { type: string }
 *       - in: query
 *         name: product
 *         schema: { type: string }
 */
router.get('/', authorize('sales:read'), catchAsync(async (req, res) => {
  const { skip, limit, page, sort } = getPagination(req.query);
  const filter = {};
  if (req.query.sale)    filter.sale    = req.query.sale;
  if (req.query.product) filter.product = req.query.product;

  const [items, total] = await Promise.all([
    SaleItem.find(filter)
      .populate('product', 'name sku')
      .populate('sale',    'saleNumber totalAmount saleDate')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    SaleItem.countDocuments(filter),
  ]);

  sendPaginated(res, { data: items, page, limit, total });
}));

/**
 * @swagger
 * /sale-items/{id}:
 *   get:
 *     summary: Get a single sale item by ID
 *     tags: [SaleItems]
 */
router.get('/:id', authorize('sales:read'), catchAsync(async (req, res) => {
  const item = await SaleItem.findById(req.params.id)
    .populate('product', 'name sku price cost')
    .populate('sale',    'saleNumber totalAmount saleDate customer soldBy');

  if (!item) {
    return res.status(404).json({ success: false, message: 'Sale item not found' });
  }

  sendSuccess(res, { data: item });
}));

module.exports = router;
