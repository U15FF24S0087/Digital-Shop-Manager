const request  = require('supertest');
const app      = require('../app');
const Product  = require('../modules/products/product.model');
const InventoryMovement = require('../modules/inventory/inventoryMovement.model');
const { connectTestDB, clearDB, disconnectTestDB } = require('./setup');
const { createRoles, createUsers, loginUser, createProduct } = require('./helpers');

let adminToken, staffToken, product;

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

beforeEach(async () => {
  await clearDB();
  const roles = await createRoles();
  await createUsers(roles);
  adminToken = await loginUser('admin@test.com', 'Admin@1234!');
  staffToken = await loginUser('staff@test.com',  'Staff@1234!');
  product    = await createProduct({ sku: 'INV-001', stock: 50, lowStockThreshold: 10 });
});

describe('Inventory — stock summary', () => {
  it('returns paginated stock list', async () => {
    const res = await request(app)
      .get('/api/v1/inventory')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('returns low-stock products', async () => {
    // Set product stock below threshold
    await Product.findByIdAndUpdate(product._id, { stock: 5 });

    const res = await request(app)
      .get('/api/v1/inventory/low-stock')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some((p) => p._id.toString() === product._id.toString())).toBe(true);
  });
});

describe('Inventory — manual adjustment', () => {
  it('adds stock with adjustment type', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product: product._id.toString(), type: 'adjustment', quantityChange: 20, notes: 'Recount' });

    expect(res.status).toBe(201);

    const updated = await Product.findById(product._id);
    expect(updated.stock).toBe(70); // 50 + 20

    const movement = await InventoryMovement.findOne({ product: product._id, type: 'adjustment' });
    expect(movement).not.toBeNull();
    expect(movement.quantityChange).toBe(20);
  });

  it('removes stock with negative quantityChange', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product: product._id.toString(), type: 'damage', quantityChange: -10 });

    expect(res.status).toBe(201);
    const updated = await Product.findById(product._id);
    expect(updated.stock).toBe(40); // 50 - 10
  });

  it('prevents negative stock', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product: product._id.toString(), type: 'damage', quantityChange: -999 });

    expect(res.status).toBe(422);

    const unchanged = await Product.findById(product._id);
    expect(unchanged.stock).toBe(50);
  });

  it('rejects zero quantityChange with 422', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product: product._id.toString(), type: 'adjustment', quantityChange: 0 });
    expect(res.status).toBe(422);
  });

  it('staff cannot adjust inventory (403)', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/adjust')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ product: product._id.toString(), type: 'adjustment', quantityChange: 5 });
    expect(res.status).toBe(403);
  });
});

describe('Inventory — movement history', () => {
  it('returns movements after adjustment', async () => {
    await request(app)
      .post('/api/v1/inventory/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product: product._id.toString(), type: 'adjustment', quantityChange: 5 });

    const res = await request(app)
      .get('/api/v1/inventory/movements')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('filters movements by product', async () => {
    await request(app)
      .post('/api/v1/inventory/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product: product._id.toString(), type: 'adjustment', quantityChange: 3 });

    const res = await request(app)
      .get(`/api/v1/inventory/products/${product._id}/movements`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((m) => m.product._id.toString() === product._id.toString() ||
      m.product.toString() === product._id.toString())).toBe(true);
  });
});
