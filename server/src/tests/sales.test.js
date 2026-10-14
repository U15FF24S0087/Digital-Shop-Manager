/**
 * Sales Integration Tests
 * ========================
 * Verifies the full transactional sale flow:
 *   - Stock is decremented correctly
 *   - Insufficient stock rejects the entire sale
 *   - Failed sale leaves no partial DB changes (transaction rollback)
 *   - Totals are computed server-side
 *   - Unauthorized users cannot create sales
 */

const request  = require('supertest');
const app      = require('../app');
const Product  = require('../modules/products/product.model');
const SaleItem = require('../modules/sale-items/saleItem.model');
const Sale     = require('../modules/sales/sale.model');
const InventoryMovement = require('../modules/inventory/inventoryMovement.model');
const { connectTestDB, clearDB, disconnectTestDB } = require('./setup');
const { createRoles, createUsers, loginUser, createProduct, createCustomer } = require('./helpers');

let adminToken, staffToken, prod1, prod2;

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

beforeEach(async () => {
  await clearDB();
  const roles = await createRoles();
  await createUsers(roles);
  adminToken = await loginUser('admin@test.com', 'Admin@1234!');
  staffToken = await loginUser('staff@test.com',  'Staff@1234!');

  prod1 = await createProduct({ sku: 'SALE-PROD-1', stock: 10, price: 50, cost: 20 });
  prod2 = await createProduct({ sku: 'SALE-PROD-2', stock: 5,  price: 30, cost: 12 });
});

describe('Sales — create sale (transactional)', () => {
  it('creates sale, decrements stock and records movement', async () => {
    const res = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        paymentMethod: 'cash',
        taxRate: 10,
        items: [
          { product: prod1._id.toString(), quantity: 3 },
          { product: prod2._id.toString(), quantity: 2 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const saleId = res.body.data.sale._id;

    // Stock should be reduced
    const updatedProd1 = await Product.findById(prod1._id);
    const updatedProd2 = await Product.findById(prod2._id);
    expect(updatedProd1.stock).toBe(7);  // 10 - 3
    expect(updatedProd2.stock).toBe(3);  // 5 - 2

    // SaleItems created
    const items = await SaleItem.find({ sale: saleId });
    expect(items).toHaveLength(2);

    // InventoryMovements recorded
    const movements = await InventoryMovement.find({ reference: saleId });
    expect(movements).toHaveLength(2);
    const m1 = movements.find((m) => m.product.toString() === prod1._id.toString());
    expect(m1.quantityChange).toBe(-3);
    expect(m1.type).toBe('sale');
  });

  it('server calculates correct total (subtotal + tax)', async () => {
    const res = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        taxRate: 10,
        items: [{ product: prod1._id.toString(), quantity: 2 }],
      });

    expect(res.status).toBe(201);
    const sale = res.body.data.sale;
    // subtotal = 50 * 2 = 100, taxAmount = 10, totalAmount = 110
    expect(sale.subtotal).toBe(100);
    expect(sale.taxAmount).toBe(10);
    expect(sale.totalAmount).toBe(110);
  });

  it('rejects sale when stock is insufficient (422)', async () => {
    const res = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [{ product: prod2._id.toString(), quantity: 99 }], // only 5 in stock
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);

    // Stock must be unchanged after failed attempt
    const unchanged = await Product.findById(prod2._id);
    expect(unchanged.stock).toBe(5);
  });

  it('transaction rollback — no partial data on failure', async () => {
    // Prod2 has stock=5. Order: prod1=2 (ok), prod2=99 (fail → rollback prod1 too)
    const salesBefore     = await Sale.countDocuments();
    const saleItemsBefore = await SaleItem.countDocuments();
    const movBefore       = await InventoryMovement.countDocuments();

    const res = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [
          { product: prod1._id.toString(), quantity: 2  },
          { product: prod2._id.toString(), quantity: 99 },
        ],
      });

    expect(res.status).toBe(422);

    // Nothing should have been persisted
    expect(await Sale.countDocuments()).toBe(salesBefore);
    expect(await SaleItem.countDocuments()).toBe(saleItemsBefore);
    expect(await InventoryMovement.countDocuments()).toBe(movBefore);

    // prod1 stock must still be 10
    const p1 = await Product.findById(prod1._id);
    expect(p1.stock).toBe(10);
  });

  it('staff can create a sale', async () => {
    const res = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ items: [{ product: prod1._id.toString(), quantity: 1 }] });

    expect(res.status).toBe(201);
  });

  it('unauthenticated request returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/sales')
      .send({ items: [{ product: prod1._id.toString(), quantity: 1 }] });
    expect(res.status).toBe(401);
  });

  it('rejects empty items array with 422', async () => {
    const res = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ items: [] });
    expect(res.status).toBe(422);
  });

  it('rejects quantity < 1 with 422', async () => {
    const res = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ items: [{ product: prod1._id.toString(), quantity: 0 }] });
    expect(res.status).toBe(422);
  });
});

describe('Sales — list and retrieve', () => {
  it('returns paginated list of sales', async () => {
    await request(app).post('/api/v1/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ items: [{ product: prod1._id.toString(), quantity: 1 }] });

    const res = await request(app)
      .get('/api/v1/sales?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.meta.total).toBe(1);
  });

  it('returns sale by ID including items', async () => {
    const createRes = await request(app).post('/api/v1/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ items: [{ product: prod1._id.toString(), quantity: 1 }] });

    const saleId = createRes.body.data.sale._id;
    const res = await request(app)
      .get(`/api/v1/sales/${saleId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('items');
    expect(res.body.data.items).toHaveLength(1);
  });
});
