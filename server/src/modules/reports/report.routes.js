/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: >
 *     Aggregated reports with date-range filtering.
 *     All endpoints accept optional startDate / endDate query parameters (ISO 8601).
 */

const express      = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const catchAsync   = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/apiResponse');
const reportService = require('./report.service');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /reports/sales:
 *   get:
 *     summary: Sales report — totals, time-series, payment breakdown, top customers
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, enum: [day, week, month, year], default: day }
 */
router.get('/sales', authorize('reports:read'), catchAsync(async (req, res) => {
  const data = await reportService.getSalesReport(req.query);
  sendSuccess(res, { message: 'Sales report generated', data });
}));

/**
 * @swagger
 * /reports/purchases:
 *   get:
 *     summary: Purchases report — totals, time-series, top suppliers
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, enum: [day, week, month, year], default: day }
 */
router.get('/purchases', authorize('reports:read'), catchAsync(async (req, res) => {
  const data = await reportService.getPurchasesReport(req.query);
  sendSuccess(res, { message: 'Purchases report generated', data });
}));

/**
 * @swagger
 * /reports/profit:
 *   get:
 *     summary: Profit summary — gross profit, margin, time-series and by category
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, enum: [day, week, month, year], default: month }
 */
router.get('/profit', authorize('reports:read'), catchAsync(async (req, res) => {
  const data = await reportService.getProfitReport(req.query);
  sendSuccess(res, { message: 'Profit report generated', data });
}));

/**
 * @swagger
 * /reports/inventory:
 *   get:
 *     summary: Inventory valuation report — stock values, low-stock, movement summary
 *     tags: [Reports]
 */
router.get('/inventory', authorize('reports:read'), catchAsync(async (req, res) => {
  const data = await reportService.getInventoryReport();
  sendSuccess(res, { message: 'Inventory report generated', data });
}));

module.exports = router;
