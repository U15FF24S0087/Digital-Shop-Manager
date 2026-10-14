/**
 * Shared test helpers — create seed data and return tokens.
 */

const request = require('supertest');
const app     = require('../app');
const Role    = require('../modules/roles/role.model');
const User    = require('../modules/users/user.model');
const Category  = require('../modules/categories/category.model');
const Supplier  = require('../modules/suppliers/supplier.model');
const Product   = require('../modules/products/product.model');
const Customer  = require('../modules/customers/customer.model');
const { PERMISSIONS } = require('../modules/roles/role.model');

// ── Create roles ──────────────────────────────────────────────────────────────
const createRoles = async () => {
  const admin   = await Role.create({ name: 'Admin',   permissions: PERMISSIONS, isSystem: true });
  const manager = await Role.create({
    name: 'Manager', isSystem: true,
    permissions: ['dashboard:read','products:read','products:create','products:update',
      'categories:read','customers:read','customers:create','suppliers:read',
      'sales:read','sales:create','purchases:read','purchases:create',
      'inventory:read','inventory:adjust','reports:read'],
  });
  const staff   = await Role.create({
    name: 'Staff', isSystem: true,
    permissions: ['dashboard:read','products:read','categories:read',
      'customers:read','customers:create','sales:read','sales:create','inventory:read'],
  });
  return { admin, manager, staff };
};

// ── Create users ──────────────────────────────────────────────────────────────
const createUsers = async (roles) => {
  const adminUser   = await User.create({ name: 'Test Admin',   email: 'admin@test.com',   password: 'Admin@1234!',   role: roles.admin._id });
  const managerUser = await User.create({ name: 'Test Manager', email: 'manager@test.com', password: 'Manager@1234!', role: roles.manager._id });
  const staffUser   = await User.create({ name: 'Test Staff',   email: 'staff@test.com',   password: 'Staff@1234!',   role: roles.staff._id });
  return { adminUser, managerUser, staffUser };
};

// ── Login and get token ───────────────────────────────────────────────────────
const loginUser = async (email, password) => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.data?.accessToken;
};

// ── Create a category ─────────────────────────────────────────────────────────
const createCategory = async (name = 'Test Category') =>
  Category.create({ name, description: 'Test', isActive: true });

// ── Create a supplier ─────────────────────────────────────────────────────────
const createSupplier = async () =>
  Supplier.create({ name: 'Test Supplier', email: 'supplier@test.com', isActive: true });

// ── Create a product ──────────────────────────────────────────────────────────
const createProduct = async (overrides = {}) => {
  const cat = await createCategory('Product Cat ' + Date.now());
  return Product.create({
    name:  'Test Product',
    sku:   'TEST-' + Date.now(),
    category: cat._id,
    price: 50.00,
    cost:  25.00,
    stock: 100,
    lowStockThreshold: 10,
    unit:  'pcs',
    isActive: true,
    ...overrides,
  });
};

// ── Create a customer ─────────────────────────────────────────────────────────
const createCustomer = async () =>
  Customer.create({ name: 'Test Customer', email: `cust${Date.now()}@test.com`, isActive: true });

module.exports = {
  createRoles,
  createUsers,
  loginUser,
  createCategory,
  createSupplier,
  createProduct,
  createCustomer,
};
