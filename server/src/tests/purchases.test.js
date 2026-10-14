/**
 * Purchases Integration Tests
 * ============================
 * Verifies the transactional purchase flow:
 *   - Stock is incremented correctly
 *   - Failed purchase leaves no partial DB changes
 *   - Weighted-average cost is updated
 *   - Unauthorized users cannot create purchases
 */

const request      = require('supertest');
const app          = require('../app');
const Product      = require('../modules/products/product.model');
const PurchaseItem = require('../modules/purchase-items/purchaseItem.model');
const Purchase     = require('../modules/purchases/purchase.model');
const InventoryMovement = require('../modules/inventory/inventoryMovement.model');
const { connectTestDB, clearDB, disconnectTestDB } = require('./setup');
const { createRoles, createUsers, loginUser, createProduct, createSupplier } = require('./helpers');

let adminToken, staffToken, supplier, prod1, prod2;

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

beforeEach(async () => {
  await clearDB();
  const roles = await createRoles();
  await createUsers(roles);
  adminToken = await loginUser('admin@test.com', 'Admin@1234!');
  staffToken = await loginUser('staff@test.com',  'Staff@1234!');
  supplier   = await createSupplier();
  prod1      = await createProduct({ sku: 'PURCH-P1', stock: 20, cost: 25, price: 50 });
  prod2      = await createProduct({ sku: 'PURCH-P2', stock: 10, cost: 10, price: 20 });
});

describe('Purchases — create (transactional)', () => {
  it('creates purchase, increases stock and records movement', async () => {
    const res = await request(app)
      .post('/api/v1/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        supplier: supplier._id.toString(),
        items: [
          { product: prod1._id.toString(), quantity: 10, unitCost: 24 },
          { product: prod2._id.toString(), quantity: 5,  unitCost: 9  },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const purchaseId = res.body.data.purchase._id;

    // Stock should be increased
    const p1 = await Product.findById(prod1._id);
    const p2 = await Product.findById(prod2._id);
    expect(p1.stock).toBe(30); // 20 + 10
    expect(p2.stock).toBe(15); // 10 + 5

    // PurchaseItems created
    const items = await PurchaseItem.find({ purchase: purchaseId });
    expect(items).toHaveLength(2);

    // InventoryMovements recorded
    const movements = await InventoryMovement.find({ reference: purchaseId });
    expect(movements).toHaveLength(2);
    const m = movements.find((mv) => mv.product.toString() === prod1._id.toString());
    expect(m.quantityChange).toBe(10);
    expect(m.type).toBe('purchase');
  });

  it('applies weighted-average cost update', async () => {
    // prod1: stock=20, cost=25. Buy 10 at 30.
    // newCost = (20*25 + 10*30) / 30 = (500+300)/30 = 800/30 ≈ 26.67
    await request(app)
      .post('/api/v1/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        supplier: supplier._id.toString(),
        items: [{ product: prod1._id.toString(), quantity: 10, unitCost: 30 }],
      });

    const p1 = await Product.findById(prod1._id);
    expect(p1.cost).toBeCloseTo(26.67, 1);
  });

  it('server calculates correct purchase total', async () => {
    const res = await request(app)
      .post('/api/v1/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        supplier: supplier._id.toString(),
        items: [{ product: prod1._id.toString(), quantity: 5, unitCost: 20 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.purchase.subtotal).toBe(100);   // 5 * 20
    expect(res.body.data.purchase.totalAmount).toBe(100);
  });

  it('rejects non-existent supplier with 404', async () => {
    const fakeId = '64a0000000000000000000ff';
    const res = await request(app)
      .post('/api/v1/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        supplier: fakeId,
        items: [{ product: prod1._id.toString(), quantity: 5, unitCost: 20 }],
      });
    expect(res.status).toBe(404);
  });

  it('rejects non-existent product with 404', async () => {
    const fakeId = '64a0000000000000000000ff';
    const res = await request(app)
      .post('/api/v1/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        supplier: supplier._id.toString(),
        items: [{ product: fakeId, quantity: 5, unitCost: 20 }],
      });
    expect(res.status).toBe(404);
  });

  it('partial failure leaves no DB changes (rollback)', async () => {
    const purchasesBefore  = await Purchase.countDocuments();
    const itemsBefore      = await PurchaseItem.countDocuments();
    const movsBefore       = await InventoryMovement.countDocuments();
    const p1StockBefore    = (await Product.findById(prod1._id)).stock;

    // Force a failure by using an invalid product ID in a multi-item request
    const fakeId = '64a0000000000000000000ff';
    const res = await request(app)
      .post('/api/v1/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        supplier: supplier._id.toString(),
        items: [
          { product: prod1._id.toString(), quantity: 5, unitCost: 20 },
          { product: fakeId, quantity: 3, unitCost: 15 },
        ],
      });

    expect(res.status).toBe(404);
    expect(await Purchase.countDocuments()).toBe(purchasesBefore);
    expect(await PurchaseItem.countDocuments()).toBe(itemsBefore);
    expect(await InventoryMovement.countDocuments()).toBe(movsBefore);

    const p1 = await Product.findById(prod1._id);
    expect(p1.stock).toBe(p1StockBefore);
  });

  it('staff cannot create purchases (403)', async () => {
    const res = await request(app)
      .post('/api/v1/purchases')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        supplier: supplier._id.toString(),
        items: [{ product: prod1._id.toString(), quantity: 1, unitCost: 20 }],
      });
    expect(res.status).toBe(403);
  });
});
