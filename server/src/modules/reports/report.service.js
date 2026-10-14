/**
 * Reports Service
 * ===============
 * All reports support date-range filtering via startDate / endDate query params.
 * Aggregation pipelines are used for performance — no in-memory processing.
 */

const Sale     = require('../sales/sale.model');
const SaleItem = require('../sale-items/saleItem.model');
const Purchase = require('../purchases/purchase.model');
const PurchaseItem = require('../purchase-items/purchaseItem.model');
const Product  = require('../products/product.model');
const InventoryMovement = require('../inventory/inventoryMovement.model');

// ── Helper ────────────────────────────────────────────────────────────────────
const buildDateFilter = (field, startDate, endDate) => {
  const f = {};
  if (startDate) f.$gte = new Date(startDate);
  if (endDate)   f.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  return Object.keys(f).length ? { [field]: f } : {};
};

// ── Sales report ──────────────────────────────────────────────────────────────

const getSalesReport = async ({ startDate, endDate, groupBy = 'day' }) => {
  const dateFilter = buildDateFilter('saleDate', startDate, endDate);
  const matchStage = { status: 'completed', ...dateFilter };

  // Format string for grouping
  const fmtMap = { day: '%Y-%m-%d', week: '%Y-W%V', month: '%Y-%m', year: '%Y' };
  const fmt = fmtMap[groupBy] || '%Y-%m-%d';

  const [summary, byPeriod, byPaymentMethod, byCustomer] = await Promise.all([
    // Overall totals
    Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:            null,
          totalRevenue:   { $sum: '$totalAmount' },
          totalDiscount:  { $sum: '$discountAmount' },
          totalTax:       { $sum: '$taxAmount' },
          totalSales:     { $sum: 1 },
          avgOrderValue:  { $avg: '$totalAmount' },
        },
      },
    ]),

    // Grouped by time period
    Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:          { $dateToString: { format: fmt, date: '$saleDate' } },
          revenue:      { $sum: '$totalAmount' },
          count:        { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // By payment method
    Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:     '$paymentMethod',
          revenue: { $sum: '$totalAmount' },
          count:   { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]),

    // Top 10 customers by spend
    Sale.aggregate([
      { $match: { ...matchStage, customer: { $ne: null } } },
      {
        $group: {
          _id:        '$customer',
          totalSpend: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpend: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from:         'customers',
          localField:   '_id',
          foreignField: '_id',
          as:           'customer',
        },
      },
      { $unwind: { path: '$customer', preserveNullAndEmpty: true } },
      {
        $project: {
          customerName:  '$customer.name',
          customerEmail: '$customer.email',
          totalSpend:    1,
          orderCount:    1,
        },
      },
    ]),
  ]);

  return {
    summary: summary[0] ?? {
      totalRevenue: 0, totalDiscount: 0, totalTax: 0, totalSales: 0, avgOrderValue: 0,
    },
    byPeriod,
    byPaymentMethod,
    topCustomers: byCustomer,
  };
};

// ── Purchases report ──────────────────────────────────────────────────────────

const getPurchasesReport = async ({ startDate, endDate, groupBy = 'day' }) => {
  const dateFilter = buildDateFilter('purchaseDate', startDate, endDate);
  const matchStage = { status: 'received', ...dateFilter };

  const fmtMap = { day: '%Y-%m-%d', week: '%Y-W%V', month: '%Y-%m', year: '%Y' };
  const fmt = fmtMap[groupBy] || '%Y-%m-%d';

  const [summary, byPeriod, bySupplier] = await Promise.all([
    Purchase.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:           null,
          totalCost:     { $sum: '$totalAmount' },
          totalDiscount: { $sum: '$discountAmount' },
          totalTax:      { $sum: '$taxAmount' },
          totalOrders:   { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
    ]),

    Purchase.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:     { $dateToString: { format: fmt, date: '$purchaseDate' } },
          cost:    { $sum: '$totalAmount' },
          count:   { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Top 10 suppliers by purchase value
    Purchase.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:        '$supplier',
          totalSpend: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpend: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from:         'suppliers',
          localField:   '_id',
          foreignField: '_id',
          as:           'supplier',
        },
      },
      { $unwind: { path: '$supplier', preserveNullAndEmpty: true } },
      {
        $project: {
          supplierName: '$supplier.name',
          totalSpend:   1,
          orderCount:   1,
        },
      },
    ]),
  ]);

  return {
    summary: summary[0] ?? {
      totalCost: 0, totalDiscount: 0, totalTax: 0, totalOrders: 0, avgOrderValue: 0,
    },
    byPeriod,
    topSuppliers: bySupplier,
  };
};

// ── Profit report ─────────────────────────────────────────────────────────────

const getProfitReport = async ({ startDate, endDate, groupBy = 'month' }) => {
  const salesFilter    = buildDateFilter('saleDate',     startDate, endDate);
  const purchFilter    = buildDateFilter('purchaseDate', startDate, endDate);

  const fmtMap = { day: '%Y-%m-%d', week: '%Y-W%V', month: '%Y-%m', year: '%Y' };
  const fmt = fmtMap[groupBy] || '%Y-%m';

  // Gross profit from sale items: (unitPrice - costPrice) * quantity - discountAmount
  const [itemProfit, periodProfit, categoryProfit] = await Promise.all([
    // Overall gross profit summary
    SaleItem.aggregate([
      {
        $lookup: {
          from: 'sales', localField: 'sale', foreignField: '_id', as: 'saleDoc',
        },
      },
      { $unwind: '$saleDoc' },
      {
        $match: {
          'saleDoc.status': 'completed',
          ...Object.fromEntries(
            Object.entries(salesFilter).map(([k, v]) => [`saleDoc.${k}`, v])
          ),
        },
      },
      {
        $group: {
          _id:          null,
          totalRevenue: { $sum: '$lineTotal' },
          totalCost:    { $sum: { $multiply: ['$costPrice', '$quantity'] } },
          totalProfit:  {
            $sum: {
              $subtract: [
                '$lineTotal',
                { $multiply: ['$costPrice', '$quantity'] },
              ],
            },
          },
          itemsSold: { $sum: '$quantity' },
        },
      },
      {
        $addFields: {
          profitMargin: {
            $cond: [
              { $gt: ['$totalRevenue', 0] },
              { $multiply: [{ $divide: ['$totalProfit', '$totalRevenue'] }, 100] },
              0,
            ],
          },
        },
      },
    ]),

    // Profit grouped by time period
    SaleItem.aggregate([
      {
        $lookup: {
          from: 'sales', localField: 'sale', foreignField: '_id', as: 'saleDoc',
        },
      },
      { $unwind: '$saleDoc' },
      {
        $match: {
          'saleDoc.status': 'completed',
          ...Object.fromEntries(
            Object.entries(salesFilter).map(([k, v]) => [`saleDoc.${k}`, v])
          ),
        },
      },
      {
        $group: {
          _id:     { $dateToString: { format: fmt, date: '$saleDoc.saleDate' } },
          revenue: { $sum: '$lineTotal' },
          cost:    { $sum: { $multiply: ['$costPrice', '$quantity'] } },
          profit:  {
            $sum: {
              $subtract: ['$lineTotal', { $multiply: ['$costPrice', '$quantity'] }],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Profit by product category
    SaleItem.aggregate([
      {
        $lookup: {
          from: 'sales', localField: 'sale', foreignField: '_id', as: 'saleDoc',
        },
      },
      { $unwind: '$saleDoc' },
      { $match: { 'saleDoc.status': 'completed' } },
      {
        $lookup: {
          from: 'products', localField: 'product', foreignField: '_id', as: 'productDoc',
        },
      },
      { $unwind: '$productDoc' },
      {
        $lookup: {
          from: 'categories', localField: 'productDoc.category', foreignField: '_id', as: 'cat',
        },
      },
      { $unwind: { path: '$cat', preserveNullAndEmpty: true } },
      {
        $group: {
          _id:          '$productDoc.category',
          categoryName: { $first: '$cat.name' },
          revenue:      { $sum: '$lineTotal' },
          cost:         { $sum: { $multiply: ['$costPrice', '$quantity'] } },
          profit:       {
            $sum: {
              $subtract: ['$lineTotal', { $multiply: ['$costPrice', '$quantity'] }],
            },
          },
          itemsSold: { $sum: '$quantity' },
        },
      },
      { $sort: { profit: -1 } },
    ]),
  ]);

  return {
    summary: itemProfit[0] ?? {
      totalRevenue: 0, totalCost: 0, totalProfit: 0, itemsSold: 0, profitMargin: 0,
    },
    byPeriod: periodProfit,
    byCategory: categoryProfit,
  };
};

// ── Inventory report ──────────────────────────────────────────────────────────

const getInventoryReport = async () => {
  const [valueSummary, byCategory, lowStock, movements] = await Promise.all([
    // Total inventory value
    Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id:            null,
          totalProducts:  { $sum: 1 },
          totalStockQty:  { $sum: '$stock' },
          totalCostValue: { $sum: { $multiply: ['$stock', '$cost'] } },
          totalSaleValue: { $sum: { $multiply: ['$stock', '$price'] } },
          lowStockCount:  {
            $sum: {
              $cond: [{ $lte: ['$stock', '$lowStockThreshold'] }, 1, 0],
            },
          },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] },
          },
        },
      },
    ]),

    // By category
    Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id:            '$category',
          totalProducts:  { $sum: 1 },
          totalStockQty:  { $sum: '$stock' },
          totalCostValue: { $sum: { $multiply: ['$stock', '$cost'] } },
          totalSaleValue: { $sum: { $multiply: ['$stock', '$price'] } },
        },
      },
      {
        $lookup: {
          from: 'categories', localField: '_id', foreignField: '_id', as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmpty: true } },
      { $addFields: { categoryName: '$category.name' } },
      { $sort: { totalCostValue: -1 } },
    ]),

    // Low stock products
    Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ stock: 1 })
      .limit(20)
      .select('name sku stock lowStockThreshold unit category supplier'),

    // Movement counts by type (last 30 days)
    InventoryMovement.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id:   '$type',
          count: { $sum: 1 },
          qty:   { $sum: { $abs: '$quantityChange' } },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    summary: valueSummary[0] ?? {
      totalProducts: 0, totalStockQty: 0, totalCostValue: 0,
      totalSaleValue: 0, lowStockCount: 0, outOfStockCount: 0,
    },
    byCategory,
    lowStockProducts: lowStock,
    movementSummaryLast30Days: movements,
  };
};

module.exports = { getSalesReport, getPurchasesReport, getProfitReport, getInventoryReport };
