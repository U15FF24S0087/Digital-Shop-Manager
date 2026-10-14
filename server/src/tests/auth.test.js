const request = require('supertest');
const app     = require('../app');
const { connectTestDB, clearDB, disconnectTestDB } = require('./setup');
const { createRoles, loginUser } = require('./helpers');

beforeAll(connectTestDB);
afterEach(clearDB);
afterAll(disconnectTestDB);

describe('Auth — POST /api/v1/auth/register', () => {
  beforeEach(() => createRoles());

  it('registers a new user and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'Alice@1234!' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('rejects duplicate email with 409', async () => {
    await request(app).post('/api/v1/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'Alice@1234!' });

    const res = await request(app).post('/api/v1/auth/register')
      .send({ name: 'Alice2', email: 'alice@test.com', password: 'Alice@1234!' });

    expect(res.status).toBe(409);
  });

  it('rejects weak password with 422', async () => {
    const res = await request(app).post('/api/v1/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'weakpassword' });
    expect(res.status).toBe(422);
  });

  it('rejects missing name with 422', async () => {
    const res = await request(app).post('/api/v1/auth/register')
      .send({ email: 'x@test.com', password: 'Strong@1234!' });
    expect(res.status).toBe(422);
  });
});

describe('Auth — POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await createRoles();
    await request(app).post('/api/v1/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'Alice@1234!' });
  });

  it('returns tokens on valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login')
      .send({ email: 'alice@test.com', password: 'Alice@1234!' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user.email).toBe('alice@test.com');
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login')
      .send({ email: 'alice@test.com', password: 'Wrong@1234!' });
    expect(res.status).toBe(401);
  });

  it('returns 401 on unknown email', async () => {
    const res = await request(app).post('/api/v1/auth/login')
      .send({ email: 'nobody@test.com', password: 'Alice@1234!' });
    expect(res.status).toBe(401);
  });
});

describe('Auth — GET /api/v1/auth/me', () => {
  beforeEach(() => createRoles());

  it('returns profile with valid token', async () => {
    await request(app).post('/api/v1/auth/register')
      .send({ name: 'Carol', email: 'carol@test.com', password: 'Carol@1234!' });
    const token = await loginUser('carol@test.com', 'Carol@1234!');

    const res = await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('carol@test.com');
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app).get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not.a.valid.token');
    expect(res.status).toBe(401);
  });
});
