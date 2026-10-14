/**
 * Dashboard Service
 * =================
 * Aggregates dashboard metrics from the same records used by the shop modules.
 */

const Sale = require('../sales/sale.model');
const SaleItem = require('../sale-items/saleItem.model');
const Purchase = require('../purchases/purchase.model');
const Product = require('../products/product.model');
const Category = require('../categories/category.model');
const Customer = require('../customers/customer.model');
const Supplier = require('../suppliers/supplier.model');

const startOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const shiftUtcDay = (date, days) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const getDailyTotals = (records, start, numberOfDays) => {
  const totalsByDate = new Map(records.map((record) => [record._id, record]));

  return Array.from({ length: numberOfDays }, (_value, index) => {
    const date = shiftUtcDay(start, index).toISOString().slice(0, 10);
    const record = totalsByDate.get(date);
    return {
      date,
      revenue: record?.revenue ?? 0,
      count: record?.count ?? 0,
    };
  });
};

const aggregateDailySales = (start, end) =>
  Sale.aggregate([
    { $match: { status: 'completed', saleDate: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate', timezone: 'UTC' } },
        revenue: { $sum: '$totalAmount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

const aggregateDailyPurchases = (start, end) =>
  Purchase.aggregate([
    { $match: { status: 'received', purchaseDate: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$purchaseDate', timezone: 'UTC' } },
        amount: { $sum: '$totalAmount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

const getSummary = async ({ permissions = [], isAdmin = false } = {}) => {
  const canRead = (permission) => isAdmin || permissions.includes(permission);
  const canReadProducts = canRead('products:read');
  const canReadSales = canRead('sales:read');
  const canReadPurchases = canRead('purchases:read');
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const tomorrowStart = shiftUtcDay(todayStart, 1);
  const thirtyDaysStart = shiftUtcDay(todayStart, -29);

  const [
    totalProducts,
    categoryStats,
    totalCustomers,
    totalSuppliers,
    lowStockProducts,
    salesLast30Raw,
    purchasesLast30Raw,
    recentSales,
    recentPurchases,
    topSellingProducts,
  ] = await Promise.all([
    canReadProducts ? Product.countDocuments({ isActive: true }) : null,
    canRead('categories:read')
      ? Promise.all([
        Category.countDocuments(),
        Category.countDocuments({ isActive: false }),
        Product.distinct('category'),
      ]).then(([total, inactive, withProducts]) => ({
        total,
        active: total - inactive,
        inactive,
        withProducts: withProducts.length,
      }))
      : null,
    canRead('customers:read') ? Customer.countDocuments({ isActive: true }) : null,
    canRead('suppliers:read') ? Supplier.countDocuments({ isActive: true }) : null,
    canReadProducts
      ? Product.find({
        isActive: true,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      })
        .select('name sku stock lowStockThreshold unit')
        .sort({ stock: 1, name: 1 })
      : [],
    canReadSales ? aggregateDailySales(thirtyDaysStart, tomorrowStart) : [],
    canReadPurchases ? aggregateDailyPurchases(thirtyDaysStart, tomorrowStart) : [],
    canReadSales
      ? Sale.find()
        .sort({ saleDate: -1 })
        .limit(10)
        .populate('customer', 'name')
        .select('saleNumber totalAmount saleDate customer status paymentMethod')
        .lean()
      : [],
    canReadPurchases
      ? Purchase.find()
        .sort({ purchaseDate: -1 })
        .limit(10)
        .populate('supplier', 'name')
        .select('purchaseNumber totalAmount purchaseDate supplier status')
        .lean()
      : [],
    canReadSales && canReadProducts
      ? SaleItem.aggregate([
        {
          $lookup: {
            from: 'sales',
            localField: 'sale',
            foreignField: '_id',
            as: 'saleInfo',
          },
        },
        { $unwind: '$saleInfo' },
        {
          $match: {
            'saleInfo.status': 'completed',
            'saleInfo.saleDate': { $gte: thirtyDaysStart, $lt: tomorrowStart },
          },
        },
        {
          $group: {
            _id: '$product',
            productName: { $first: '$productName' },
            productSku: { $first: '$productSku' },
            totalQty: { $sum: '$quantity' },
            totalRevenue: { $sum: '$lineTotal' },
          },
        },
        { $sort: { totalQty: -1, productName: 1 } },
        { $limit: 5 },
      ])
      : [],
  ]);

  const salesLast30Days = getDailyTotals(salesLast30Raw, thirtyDaysStart, 30);
  const purchasesByDate = new Map(purchasesLast30Raw.map((record) => [record._id, record]));
  const salesByDate = new Map(salesLast30Days.map((record) => [record.date, record]));
  const salesVsPurchases = Array.from({ length: 30 }, (_value, index) => {
    const date = shiftUtcDay(thirtyDaysStart, index).toISOString().slice(0, 10);
    return {
      date,
      sales: salesByDate.get(date)?.revenue ?? 0,
      purchases: purchasesByDate.get(date)?.amount ?? 0,
    };
  });
  const todaySales = salesByDate.get(todayStart.toISOString().slice(0, 10));
  const salesLast7Days = getDailyTotals(
    salesLast30Raw.filter((record) => record._id >= shiftUtcDay(todayStart, -6).toISOString().slice(0, 10)),
    shiftUtcDay(todayStart, -6),
    7,
  );

  return {
    period: { startDate: thirtyDaysStart, endDate: now, label: 'Last 30 days' },
    counts: {
      products: totalProducts,
      categories: categoryStats?.active ?? null,
      customers: totalCustomers,
      suppliers: totalSuppliers,
      lowStock: canReadProducts ? lowStockProducts.length : null,
    },
    categoryStats,
    today: {
      sales: todaySales?.revenue ?? 0,
      salesCount: todaySales?.count ?? 0,
    },
    periodPurchases: {
      amount: purchasesLast30Raw.reduce((sum, record) => sum + record.amount, 0),
      count: purchasesLast30Raw.reduce((sum, record) => sum + record.count, 0),
    },
    salesLast7Days,
    salesLast30Days,
    salesVsPurchases,
    bestSellingProducts: topSellingProducts,
    recentSales,
    recentPurchases,
    lowStockProducts,
  };
};

module.exports = { getSummary };
