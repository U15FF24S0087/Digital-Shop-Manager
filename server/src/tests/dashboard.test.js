const request = require('supertest');
const app = require('../app');
const Category = require('../modules/categories/category.model');
const Purchase = require('../modules/purchases/purchase.model');
const Role = require('../modules/roles/role.model');
const Sale = require('../modules/sales/sale.model');
const SaleItem = require('../modules/sale-items/saleItem.model');
const User = require('../modules/users/user.model');
const { connectTestDB, clearDB, disconnectTestDB } = require('./setup');
const {
  createCustomer,
  createProduct,
  createRoles,
  createSupplier,
  createUsers,
  loginUser,
} = require('./helpers');

let adminToken;
let staffToken;
let adminUser;

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

beforeEach(async () => {
  await clearDB();
  const roles = await createRoles();
  ({ adminUser } = await createUsers(roles));
  adminToken = await loginUser('admin@test.com', 'Admin@1234!');
  staffToken = await loginUser('staff@test.com', 'Staff@1234!');
});

describe('Dashboard summary', () => {
  it('returns database totals, chart series, and recent transactions', async () => {
    const product = await createProduct({
      name: 'Low stock product',
      sku: 'DASHBOARD-LOW',
      stock: 2,
      lowStockThreshold: 5,
    });
    await Category.create({ name: 'Inactive category', isActive: false });
    const customer = await createCustomer();
    const supplier = await createSupplier();
    const saleDate = new Date();
    const purchaseDate = new Date();

    await Sale.create({
      saleNumber: 'SALE-DASHBOARD-1',
      customer: customer._id,
      soldBy: adminUser._id,
      status: 'completed',
      subtotal: 120,
      totalAmount: 120,
      saleDate,
    }).then((sale) => SaleItem.create({
      sale: sale._id,
      product: product._id,
      productName: product.name,
      productSku: product.sku,
      quantity: 3,
      unitPrice: 40,
      costPrice: 20,
      lineTotal: 120,
    }));
    await Purchase.create({
      purchaseNumber: 'PO-DASHBOARD-1',
      supplier: supplier._id,
      purchasedBy: adminUser._id,
      status: 'received',
      subtotal: 80,
      totalAmount: 80,
      purchaseDate,
    });

    const response = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    const { data } = response.body;
    expect(data.counts).toMatchObject({
      products: 1,
      categories: 1,
      customers: 1,
      suppliers: 1,
      lowStock: 1,
    });
    expect(data.categoryStats).toMatchObject({ total: 2, active: 1, inactive: 1, withProducts: 1 });
    expect(data.today).toMatchObject({ sales: 120, salesCount: 1 });
    expect(data.periodPurchases.amount).toBe(80);
    expect(data.periodPurchases.count).toBe(1);
    expect(data.salesLast7Days).toHaveLength(7);
    expect(data.salesLast30Days).toHaveLength(30);
    expect(data.salesVsPurchases).toHaveLength(30);
    expect(data.bestSellingProducts[0]).toMatchObject({
      productName: 'Low stock product',
      totalQty: 3,
    });
    expect(data.recentSales[0].customer.name).toBe('Test Customer');
    expect(data.recentPurchases[0].supplier.name).toBe('Test Supplier');
    expect(data.lowStockProducts[0]).toMatchObject({
      name: 'Low stock product',
      sku: 'DASHBOARD-LOW',
      stock: 2,
      lowStockThreshold: 5,
    });
  });

  it('returns empty chart series and zero metrics when there are no transactions', async () => {
    const response = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.counts).toMatchObject({
      products: 0,
      categories: 0,
      customers: 0,
      suppliers: 0,
      lowStock: 0,
    });
    expect(response.body.data.categoryStats).toMatchObject({ total: 0, active: 0, inactive: 0, withProducts: 0 });
    expect(response.body.data.today).toMatchObject({ sales: 0, salesCount: 0 });
    expect(response.body.data.periodPurchases).toMatchObject({ amount: 0, count: 0 });
    expect(response.body.data.salesLast30Days.every((day) => day.revenue === 0)).toBe(true);
    expect(response.body.data.recentSales).toEqual([]);
    expect(response.body.data.recentPurchases).toEqual([]);
  });

  it('does not expose data for modules the logged-in role cannot read', async () => {
    const response = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.counts.suppliers).toBeNull();
    expect(response.body.data.categoryStats).toBeDefined();
    expect(response.body.data.periodPurchases).toMatchObject({ amount: 0, count: 0 });
    expect(response.body.data.recentPurchases).toEqual([]);
    expect(response.body.data.salesLast30Days).toHaveLength(30);
  });

  it('requires authentication and dashboard permission', async () => {
    const unauthenticated = await request(app).get('/api/v1/dashboard/summary');
    expect(unauthenticated.status).toBe(401);

    const role = await Role.create({ name: 'No Dashboard Access', permissions: [] });
    await User.create({
      name: 'Dashboard Restricted',
      email: 'restricted@test.com',
      password: 'Restricted@1234!',
      role: role._id,
    });
    const restrictedToken = await loginUser('restricted@test.com', 'Restricted@1234!');
    const forbidden = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${restrictedToken}`);
    expect(forbidden.status).toBe(403);
  });
});
