const request = require('supertest');
const app = require('../app');
const Category = require('../modules/categories/category.model');
const Product = require('../modules/products/product.model');
const { connectTestDB, disconnectTestDB } = require('./setup');
const { createRoles, createUsers, loginUser } = require('./helpers');

let adminToken;
let staffToken;

beforeAll(async () => {
  await connectTestDB();
  const roles = await createRoles();
  await createUsers(roles);
  adminToken = await loginUser('admin@test.com', 'Admin@1234!');
  staffToken = await loginUser('staff@test.com', 'Staff@1234!');
});

afterEach(async () => {
  await Promise.all([Product.deleteMany({}), Category.deleteMany({})]);
});

afterAll(disconnectTestDB);

const createViaApi = (token, body) => request(app)
  .post('/api/v1/categories')
  .set('Authorization', `Bearer ${token}`)
  .send(body);

const createProductFor = (category) => Product.create({
  name: 'Category product',
  sku: `CAT-${category._id.toString().slice(-8)}`,
  category: category._id,
  price: 20,
  cost: 10,
  stock: 4,
});

describe('Categories management API', () => {
  it('creates normalized categories and returns product counts in list and stats', async () => {
    const created = await createViaApi(adminToken, {
      name: '  Home   Audio ',
      description: 'Speakers and headphones',
      imageUrl: 'https://example.com/audio.jpg',
    });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      name: 'Home Audio',
      slug: 'home-audio',
      isActive: true,
    });

    const duplicateName = await createViaApi(adminToken, { name: 'home audio' });
    expect(duplicateName.status).toBe(409);
    const duplicateSlug = await createViaApi(adminToken, { name: 'Sound Gear', slug: 'HOME-AUDIO' });
    expect(duplicateSlug.status).toBe(409);
    expect((await createViaApi(adminToken, {})).status).toBe(422);

    await createProductFor(created.body.data);
    const list = await request(app)
      .get('/api/v1/categories?search=speakers&isActive=true&sortBy=name&order=asc&page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data[0].productCount).toBe(1);

    const stats = await request(app).get('/api/v1/categories/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(stats.body.data).toMatchObject({ total: 1, active: 1, inactive: 0, withProducts: 1 });
  });

  it('updates the generated slug without breaking product references and paginates category products', async () => {
    const category = await Category.create({ name: 'Old Name' });
    const product = await createProductFor(category);
    const updated = await request(app)
      .patch(`/api/v1/categories/${category._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Category Name', description: 'Updated' });

    expect(updated.status).toBe(200);
    expect(updated.body.data.slug).toBe('new-category-name');
    expect((await Product.findById(product._id)).category.toString()).toBe(category._id.toString());

    const details = await request(app)
      .get(`/api/v1/categories/${category._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(details.body.data.productCount).toBe(1);

    const products = await request(app)
      .get(`/api/v1/categories/${category._id}/products?page=1&limit=1`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(products.status).toBe(200);
    expect(products.body.data).toHaveLength(1);
    expect(products.body.meta.total).toBe(1);
    expect(products.body.data[0].category.name).toBe('New Category Name');
  });

  it('rejects unsafe deletion and supports explicit product reassignment', async () => {
    const source = await Category.create({ name: 'Source category' });
    const destination = await Category.create({ name: 'Destination category' });
    const product = await createProductFor(source);
    const blocked = await request(app)
      .delete(`/api/v1/categories/${source._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(blocked.status).toBe(409);
    expect(await Category.exists({ _id: source._id })).not.toBeNull();

    const deleted = await request(app)
      .delete(`/api/v1/categories/${source._id}?reassignTo=${destination._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.reassignedProducts).toBe(1);
    expect(await Category.exists({ _id: source._id })).toBeNull();
    expect((await Product.findById(product._id)).category.toString()).toBe(destination._id.toString());
  });

  it('enforces category permissions, active status, and valid identifiers', async () => {
    const category = await Category.create({ name: 'Read only category', isActive: false });
    expect((await createViaApi(staffToken, { name: 'Forbidden category' })).status).toBe(403);
    expect((await request(app).get('/api/v1/categories/not-an-id').set('Authorization', `Bearer ${adminToken}`)).status).toBe(422);
    expect((await request(app).get('/api/v1/categories/64a0000000000000000000ff').set('Authorization', `Bearer ${adminToken}`)).status).toBe(404);
    expect((await request(app).get('/api/v1/categories')).status).toBe(401);

    const source = await Category.create({ name: 'Source category' });
    await createProductFor(source);
    const invalidDestination = await request(app)
      .delete(`/api/v1/categories/${source._id}?reassignTo=${category._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(invalidDestination.status).toBe(400);

    const inactiveAssignment = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Inactive category item', sku: 'INACTIVE-CAT', category: category._id, price: 2, cost: 1, stock: 0 });
    expect(inactiveAssignment.status).toBe(400);

    await request(app)
      .patch(`/api/v1/categories/${source._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    const catalogEdit = await request(app)
      .patch(`/api/v1/products/${(await Product.findOne({ category: source._id }))._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Existing product remains editable', category: source._id });
    expect(catalogEdit.status).toBe(200);
  });
});
