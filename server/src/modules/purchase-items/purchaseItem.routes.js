/**
 * @swagger
 * tags:
 *   name: PurchaseItems
 *   description: >
 *     Read-only access to individual purchase line items.
 *     Items are created automatically when a purchase is posted.
 */

const express      = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const catchAsync   = require('../../utils/catchAsync');
const { sendSuccess, sendPaginated } = require('../../utils/apiResponse');
const PurchaseItem = require('./purchaseItem.model');
const { getPagination } = require('../../utils/pagination');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /purchase-items:
 *   get:
 *     summary: List purchase items (filterable by purchase or product)
 *     tags: [PurchaseItems]
 *     parameters:
 *       - in: query
 *         name: purchase
 *         schema: { type: string }
 *       - in: query
 *         name: product
 *         schema: { type: string }
 */
router.get('/', authorize('purchases:read'), catchAsync(async (req, res) => {
  const { skip, limit, page, sort } = getPagination(req.query);
  const filter = {};
  if (req.query.purchase) filter.purchase = req.query.purchase;
  if (req.query.product)  filter.product  = req.query.product;

  const [items, total] = await Promise.all([
    PurchaseItem.find(filter)
      .populate('product',  'name sku cost')
      .populate('purchase', 'purchaseNumber totalAmount purchaseDate')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    PurchaseItem.countDocuments(filter),
  ]);

  sendPaginated(res, { data: items, page, limit, total });
}));

/**
 * @swagger
 * /purchase-items/{id}:
 *   get:
 *     summary: Get a single purchase item by ID
 *     tags: [PurchaseItems]
 */
router.get('/:id', authorize('purchases:read'), catchAsync(async (req, res) => {
  const item = await PurchaseItem.findById(req.params.id)
    .populate('product',  'name sku cost price')
    .populate('purchase', 'purchaseNumber totalAmount purchaseDate supplier purchasedBy');

  if (!item) {
    return res.status(404).json({ success: false, message: 'Purchase item not found' });
  }

  sendSuccess(res, { data: item });
}));

module.exports = router;
