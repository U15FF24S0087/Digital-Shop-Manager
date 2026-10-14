/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Summary metrics, KPIs and chart data for the main dashboard
 */

const express      = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const catchAsync   = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/apiResponse');
const dashboardService = require('./dashboard.service');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Retrieve permission-filtered dashboard metrics and chart data
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Summary cards, chart series and recent transactions
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Dashboard permission required
 */
const sendDashboardSummary = catchAsync(async (req, res) => {
  const role = req.user.role;
  const data = await dashboardService.getSummary({
    permissions: role?.permissions ?? [],
    isAdmin: role?.name === 'Admin',
  });
  sendSuccess(res, { message: 'Dashboard data retrieved', data });
});

router.get('/summary', authorize('dashboard:read'), sendDashboardSummary);
router.get('/', authorize('dashboard:read'), sendDashboardSummary);

module.exports = router;
