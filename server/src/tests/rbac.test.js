/**
 * RBAC Tests
 * ==========
 * Ensures role-based permissions are enforced on the backend.
 * No frontend permission checks count — only the API responses matter.
 */

const request = require('supertest');
const app     = require('../app');
const { connectTestDB, clearDB, disconnectTestDB } = require('./setup');
const { createRoles, createUsers, loginUser, createProduct, createCategory } = require('./helpers');

let adminToken, managerToken, staffToken;

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

beforeEach(async () => {
  await clearDB();
  const roles = await createRoles();
  await createUsers(roles);
  adminToken   = await loginUser('admin@test.com',   'Admin@1234!');
  managerToken = await loginUser('manager@test.com', 'Manager@1234!');
  staffToken   = await loginUser('staff@test.com',   'Staff@1234!');
});

describe('RBAC — Users endpoint', () => {
  it('Admin can list users', async () => {
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('Manager cannot list users (403)', async () => {
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(403);
  });

  it('Staff cannot list users (403)', async () => {
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });
});

describe('RBAC — Roles endpoint', () => {
  it('Admin can list roles', async () => {
    const res = await request(app).get('/api/v1/roles').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('Staff cannot list roles (403)', async () => {
    const res = await request(app).get('/api/v1/roles').set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });
});

describe('RBAC — Products endpoint', () => {
  let catId;
  beforeEach(async () => {
    const cat = await createCategory('RBAC Cat');
    catId = cat._id.toString();
  });

  it('Admin can create products', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'A', sku: 'RBAC-P1', category: catId, price: 10, cost: 5, stock: 1 });
    expect(res.status).toBe(201);
  });

  it('Manager can create products', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'B', sku: 'RBAC-P2', category: catId, price: 10, cost: 5, stock: 1 });
    expect(res.status).toBe(201);
  });

  it('Staff cannot create products (403)', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ name: 'C', sku: 'RBAC-P3', category: catId, price: 10, cost: 5, stock: 1 });
    expect(res.status).toBe(403);
  });

  it('Staff can read products', async () => {
    const res = await request(app)
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
  });
});

describe('RBAC — Purchases endpoint', () => {
  it('Staff cannot create purchases (403)', async () => {
    const res = await request(app)
      .post('/api/v1/purchases')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ supplier: '64a0000000000000000000ff', items: [] });
    expect(res.status).toBe(403);
  });
});

describe('RBAC — Reports endpoint', () => {
  it('Admin can view reports', async () => {
    const res = await request(app)
      .get('/api/v1/reports/inventory')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('Manager can view reports', async () => {
    const res = await request(app)
      .get('/api/v1/reports/inventory')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).toBe(200);
  });

  it('Staff cannot view reports (403)', async () => {
    const res = await request(app)
      .get('/api/v1/reports/inventory')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });
});
