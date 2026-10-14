const request = require('supertest');
const app     = require('../app');
const Product = require('../modules/products/product.model');
const InventoryMovement = require('../modules/inventory/inventoryMovement.model');
const { connectTestDB, clearDB, disconnectTestDB } = require('./setup');
const {
  createRoles,
  createUsers,
  loginUser,
  createCategory,
  createProduct,
} = require('./helpers');

let adminToken, staffToken;

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

beforeEach(async () => {
  await clearDB();
  const roles = await createRoles();
  const users = await createUsers(roles);
  adminToken = await loginUser('admin@test.com', 'Admin@1234!');
  staffToken = await loginUser('staff@test.com',  'Staff@1234!');
});

describe('Products — CRUD', () => {
  let catId;
  beforeEach(async () => {
    const cat = await createCategory('Electronics');
    catId = cat._id.toString();
  });

  it('Admin creates a product', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Headphones', sku: 'HP-001', category: catId, price: 99.99, cost: 50, stock: 20 });

    expect(res.status).toBe(201);
    expect(res.body.data.sku).toBe('HP-001');
    const openingMovement = await InventoryMovement.findOne({ product: res.body.data._id });
    expect(openingMovement).toMatchObject({
      type: 'adjustment',
      quantityChange: 20,
      quantityBefore: 0,
      quantityAfter: 20,
    });
  });

  it('SKU is uppercased automatically', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Cable', sku: 'usb-001', category: catId, price: 10, cost: 4, stock: 50 });

    expect(res.status).toBe(201);
    expect(res.body.data.sku).toBe('USB-001');
  });

  it('Rejects duplicate SKU with 409', async () => {
    await request(app).post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'P1', sku: 'DUP-001', category: catId, price: 10, cost: 4, stock: 5 });

    const res = await request(app).post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'P2', sku: 'DUP-001', category: catId, price: 10, cost: 4, stock: 5 });

    expect(res.status).toBe(409);
  });

  it('Staff cannot create products (403)', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ name: 'X', sku: 'X-001', category: catId, price: 10, cost: 4, stock: 5 });

    expect(res.status).toBe(403);
  });

  it('Returns paginated product list', async () => {
    await request(app).post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'PA', sku: 'PA-001', category: catId, price: 10, cost: 4, stock: 5 });

    const res = await request(app)
      .get('/api/v1/products?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('meta');
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('Filters products by name, SKU, category, and stock state with safe sorting', async () => {
    await Product.create([
      { name: 'Searchable Widget', sku: 'WIDGET-101', category: catId, price: 30, cost: 12, stock: 0, lowStockThreshold: 5 },
      { name: 'Available Widget', sku: 'WIDGET-102', category: catId, price: 60, cost: 20, stock: 20, lowStockThreshold: 5 },
    ]);

    const searchBySku = await request(app)
      .get('/api/v1/products?search=widget-101')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(searchBySku.status).toBe(200);
    expect(searchBySku.body.data).toHaveLength(1);
    expect(searchBySku.body.data[0].sku).toBe('WIDGET-101');

    const lowStock = await request(app)
      .get(`/api/v1/products?category=${catId}&stockStatus=low_stock&sortBy=name&order=asc`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(lowStock.status).toBe(200);
    expect(lowStock.body.data).toHaveLength(1);
    expect(lowStock.body.data[0].stock).toBe(0);
  });

  it('returns product statistics and safely deactivates without deleting history', async () => {
    const product = await createProduct({
      sku: 'STATS-001',
      stock: 0,
      lowStockThreshold: 4,
    });

    const stats = await request(app)
      .get('/api/v1/products/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(stats.status).toBe(200);
    expect(stats.body.data).toMatchObject({
      total: 1,
      active: 1,
      inactive: 0,
      lowStock: 1,
      outOfStock: 1,
    });

    const deactivated = await request(app)
      .delete(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.data.isActive).toBe(false);
    expect(await Product.countDocuments({ _id: product._id })).toBe(1);
  });

  it('patches catalog fields without allowing stock changes', async () => {
    const product = await createProduct({ sku: 'PATCH-001', stock: 11 });
    const updated = await request(app)
      .patch(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated catalog name', price: 32 });

    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe('Updated catalog name');
    expect(updated.body.data.price).toBe(32);
    expect(updated.body.data.stock).toBe(11);

    const stockUpdate = await request(app)
      .patch(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stock: 2 });
    expect(stockUpdate.status).toBe(422);
    expect((await Product.findById(product._id)).stock).toBe(11);

    const invalidPrice = await request(app)
      .patch(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: -1 });
    expect(invalidPrice.status).toBe(422);

    const invalidStock = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Negative stock', sku: 'NEGATIVE-STOCK', category: catId, price: 1, cost: 0, stock: -1 });
    expect(invalidStock.status).toBe(422);
  });

  it('rejects invalid categories, missing products, and unauthorised deletions', async () => {
    const invalidCategory = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Invalid category item', sku: 'INVALID-CAT', category: '64a0000000000000000000ff', price: 1, cost: 0, stock: 0 });
    expect(invalidCategory.status).toBe(404);

    const missing = await request(app)
      .get('/api/v1/products/64a0000000000000000000ff')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(missing.status).toBe(404);

    const unauthorized = await request(app)
      .delete('/api/v1/products/64a0000000000000000000ff')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(unauthorized.status).toBe(403);
  });

  it('Unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(401);
  });
});
