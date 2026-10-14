/**
 * Seed Script
 * ===========
 * Run with:  npm run seed          (adds data if DB is empty)
 *            npm run seed:fresh     (drops all collections first)
 *
 * Uses ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from .env.
 * Requires MongoDB running as a replica set for transactions.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { config, validateEnv } = require('../config/env');

// Models
const Role              = require('../modules/roles/role.model');
const User              = require('../modules/users/user.model');
const Category          = require('../modules/categories/category.model');
const Supplier          = require('../modules/suppliers/supplier.model');
const Customer          = require('../modules/customers/customer.model');
const Product           = require('../modules/products/product.model');
const Sale              = require('../modules/sales/sale.model');
const SaleItem          = require('../modules/sale-items/saleItem.model');
const Purchase          = require('../modules/purchases/purchase.model');
const PurchaseItem      = require('../modules/purchase-items/purchaseItem.model');
const InventoryMovement = require('../modules/inventory/inventoryMovement.model');

const { PERMISSIONS } = require('../modules/roles/role.model');

// ── Colour helpers for console output ────────────────────────────────────────
const c = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
};

const log  = (msg) => console.log(c.green('✓ ') + msg);
const info = (msg) => console.log(c.cyan('ℹ ') + msg);
const warn = (msg) => console.log(c.yellow('⚠ ') + msg);

// ── Roles seed data ───────────────────────────────────────────────────────────
const ROLES_SEED = [
  {
    name: 'Admin',
    description: 'Full system access',
    permissions: PERMISSIONS,
    isSystem: true,
  },
  {
    name: 'Manager',
    description: 'Manage shop operations and view reports',
    isSystem: true,
    permissions: [
      'dashboard:read',
      'products:read', 'products:create', 'products:update',
      'categories:read', 'categories:create', 'categories:update',
      'customers:read', 'customers:create', 'customers:update',
      'suppliers:read', 'suppliers:create', 'suppliers:update',
      'sales:read', 'sales:create', 'sales:update',
      'purchases:read', 'purchases:create', 'purchases:update',
      'inventory:read', 'inventory:adjust',
      'reports:read',
      'users:read',
    ],
  },
  {
    name: 'Staff',
    description: 'Perform sales and customer service',
    isSystem: true,
    permissions: [
      'dashboard:read',
      'products:read',
      'categories:read',
      'customers:read', 'customers:create', 'customers:update',
      'sales:read', 'sales:create',
      'inventory:read',
    ],
  },
];

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES_SEED = [
  { name: 'Electronics',    description: 'Electronic devices and accessories' },
  { name: 'Clothing',       description: 'Apparel and fashion items' },
  { name: 'Food & Drinks',  description: 'Consumable food and beverages' },
  { name: 'Office Supplies',description: 'Stationery and office equipment' },
  { name: 'Health & Beauty',description: 'Personal care and health products' },
];

// ── Suppliers ─────────────────────────────────────────────────────────────────
const SUPPLIERS_SEED = [
  {
    name: 'TechZone Distributors',
    email: 'orders@techzone.example.com',
    phone: '+1-800-555-0101',
    contactPerson: 'Alice Carter',
    address: { street: '100 Silicon Way', city: 'San Jose', state: 'CA', zip: '95101', country: 'USA' },
  },
  {
    name: 'FashionLine Wholesale',
    email: 'supply@fashionline.example.com',
    phone: '+1-800-555-0202',
    contactPerson: 'Bob Martinez',
    address: { street: '250 Garment Ave', city: 'New York', state: 'NY', zip: '10001', country: 'USA' },
  },
  {
    name: 'Global Foods Co.',
    email: 'info@globalfoods.example.com',
    phone: '+1-800-555-0303',
    contactPerson: 'Carol Lee',
    address: { street: '5 Harvest Blvd', city: 'Chicago', state: 'IL', zip: '60601', country: 'USA' },
  },
  {
    name: 'OfficeMax Supplies',
    email: 'trade@officemax.example.com',
    phone: '+1-800-555-0404',
    contactPerson: 'David Kim',
    address: { street: '88 Paper St', city: 'Austin', state: 'TX', zip: '73301', country: 'USA' },
  },
];

// ── Customers ─────────────────────────────────────────────────────────────────
const CUSTOMERS_SEED = [
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1-555-1001',
    address: { street: '12 Oak Lane', city: 'Boston', state: 'MA', zip: '02101', country: 'USA' },
  },
  {
    name: 'Emily Johnson',
    email: 'emily.j@example.com',
    phone: '+1-555-1002',
    address: { city: 'Seattle', state: 'WA', country: 'USA' },
  },
  {
    name: 'Carlos Rivera',
    email: 'carlos.r@example.com',
    phone: '+1-555-1003',
    address: { city: 'Miami', state: 'FL', country: 'USA' },
  },
  {
    name: 'Sarah O\'Brien',
    email: 'sarah.ob@example.com',
    phone: '+1-555-1004',
    address: { city: 'Denver', state: 'CO', country: 'USA' },
  },
  {
    name: 'Walk-in Customer',
    email: null,
    phone: '',
    notes: 'Generic walk-in customer for anonymous sales',
  },
];

// ── Products (built dynamically after categories/suppliers are created) ───────
const buildProducts = (cats, sups) => {
  const electronics   = cats.find((c) => c.name === 'Electronics')._id;
  const clothing      = cats.find((c) => c.name === 'Clothing')._id;
  const food          = cats.find((c) => c.name === 'Food & Drinks')._id;
  const office        = cats.find((c) => c.name === 'Office Supplies')._id;
  const health        = cats.find((c) => c.name === 'Health & Beauty')._id;

  const techSup    = sups.find((s) => s.name === 'TechZone Distributors')._id;
  const fashionSup = sups.find((s) => s.name === 'FashionLine Wholesale')._id;
  const foodSup    = sups.find((s) => s.name === 'Global Foods Co.')._id;
  const officeSup  = sups.find((s) => s.name === 'OfficeMax Supplies')._id;

  return [
    { name: 'Wireless Bluetooth Headphones', sku: 'ELEC-001', category: electronics, supplier: techSup,    price: 79.99,  cost: 42.00, stock: 50,  lowStockThreshold: 10, unit: 'pcs', description: 'High-quality wireless headphones with noise cancellation' },
    { name: 'USB-C Charging Cable (1m)',      sku: 'ELEC-002', category: electronics, supplier: techSup,    price: 12.99,  cost: 4.50,  stock: 200, lowStockThreshold: 30, unit: 'pcs', description: 'Durable braided USB-C cable' },
    { name: 'Mechanical Keyboard',            sku: 'ELEC-003', category: electronics, supplier: techSup,    price: 129.99, cost: 75.00, stock: 30,  lowStockThreshold: 5,  unit: 'pcs', description: 'Tactile mechanical keyboard with RGB backlight' },
    { name: 'Laptop Stand Adjustable',        sku: 'ELEC-004', category: electronics, supplier: techSup,    price: 49.99,  cost: 22.00, stock: 8,   lowStockThreshold: 10, unit: 'pcs', description: 'Ergonomic aluminum laptop stand' },
    { name: 'Men\'s Classic T-Shirt',         sku: 'CLTH-001', category: clothing,    supplier: fashionSup, price: 24.99,  cost: 9.00,  stock: 120, lowStockThreshold: 20, unit: 'pcs', description: 'Cotton crew-neck t-shirt' },
    { name: 'Women\'s Yoga Pants',            sku: 'CLTH-002', category: clothing,    supplier: fashionSup, price: 39.99,  cost: 16.00, stock: 80,  lowStockThreshold: 15, unit: 'pcs', description: 'High-waist stretch yoga pants' },
    { name: 'Unisex Hoodie',                  sku: 'CLTH-003', category: clothing,    supplier: fashionSup, price: 54.99,  cost: 22.00, stock: 5,   lowStockThreshold: 10, unit: 'pcs', description: 'Pullover hoodie with kangaroo pocket' },
    { name: 'Organic Green Tea (50 bags)',     sku: 'FOOD-001', category: food,        supplier: foodSup,    price: 8.99,   cost: 3.50,  stock: 150, lowStockThreshold: 25, unit: 'box', description: 'Premium organic green tea bags' },
    { name: 'Ground Coffee 500g',             sku: 'FOOD-002', category: food,        supplier: foodSup,    price: 14.99,  cost: 7.00,  stock: 90,  lowStockThreshold: 20, unit: 'bag', description: 'Medium roast ground coffee' },
    { name: 'Sparkling Water 12-pack',        sku: 'FOOD-003', category: food,        supplier: foodSup,    price: 9.99,   cost: 5.00,  stock: 200, lowStockThreshold: 40, unit: 'pack', description: 'Mineral sparkling water cans' },
    { name: 'Ballpoint Pens (10-pack)',       sku: 'OFFI-001', category: office,      supplier: officeSup,  price: 5.99,   cost: 1.80,  stock: 300, lowStockThreshold: 50, unit: 'pack', description: 'Smooth-writing blue ballpoint pens' },
    { name: 'A4 Printer Paper (500 sheets)',  sku: 'OFFI-002', category: office,      supplier: officeSup,  price: 11.99,  cost: 5.50,  stock: 7,   lowStockThreshold: 15, unit: 'ream', description: '80gsm white printer paper' },
    { name: 'Sticky Notes 3x3 (12-pack)',     sku: 'OFFI-003', category: office,      supplier: officeSup,  price: 7.49,   cost: 2.50,  stock: 180, lowStockThreshold: 30, unit: 'pack', description: 'Repositionable adhesive notes' },
    { name: 'Daily Vitamin C Supplement',     sku: 'HLTH-001', category: health,      supplier: null,       price: 18.99,  cost: 8.00,  stock: 60,  lowStockThreshold: 12, unit: 'btl',  description: '60 tablets of Vitamin C 1000mg' },
    { name: 'Hand Sanitizer 250ml',           sku: 'HLTH-002', category: health,      supplier: null,       price: 5.49,   cost: 1.90,  stock: 250, lowStockThreshold: 50, unit: 'btl',  description: '70% alcohol gel hand sanitizer' },
  ];
};

// ── Main seed function ────────────────────────────────────────────────────────

async function seed() {
  validateEnv();

  const isFresh = process.argv.includes('--fresh');
  info(`Seed mode: ${isFresh ? c.yellow('FRESH (will drop collections)') : 'incremental'}`);
  info(`Connecting to: ${config.mongo.uri}`);

  await mongoose.connect(config.mongo.uri);
  info('Connected to MongoDB');

  if (isFresh) {
    warn('Dropping all collections...');
    const collections = [
      Role, User, Category, Supplier, Customer, Product,
      Sale, SaleItem, Purchase, PurchaseItem, InventoryMovement,
    ];
    await Promise.all(collections.map((M) => M.deleteMany({})));
    log('All collections cleared');
  }

  // ── 1. Roles ──────────────────────────────────────────────────────────────
  let roles = await Role.find({ isSystem: true });
  if (roles.length < 3) {
    for (const roleData of ROLES_SEED) {
      await Role.findOneAndUpdate(
        { name: roleData.name },
        { $setOnInsert: roleData },
        { upsert: true, new: true },
      );
    }
    roles = await Role.find({ isSystem: true });
    log(`Roles seeded: ${roles.map((r) => r.name).join(', ')}`);
  } else {
    info('Roles already exist — skipping');
  }

  const adminRole   = roles.find((r) => r.name === 'Admin');
  const managerRole = roles.find((r) => r.name === 'Manager');
  const staffRole   = roles.find((r) => r.name === 'Staff');

  // ── 2. Admin user ─────────────────────────────────────────────────────────
  const existingAdmin = await User.findOne({ email: config.admin.email });
  let adminUser;
  if (!existingAdmin) {
    adminUser = await User.create({
      name:     config.admin.name,
      email:    config.admin.email,
      password: config.admin.password, // hashed by pre-save hook
      role:     adminRole._id,
      isActive: true,
    });
    log(`Admin user created: ${config.admin.email}`);
  } else {
    adminUser = existingAdmin;
    info(`Admin user already exists: ${config.admin.email}`);
  }

  // ── 3. Extra demo users ────────────────────────────────────────────────────
  const demoUsers = [
    { name: 'Maria Manager', email: 'manager@digitalshop.com', password: 'Manager@1234!', role: managerRole._id },
    { name: 'Steve Staff',   email: 'staff@digitalshop.com',   password: 'Staff@1234!',   role: staffRole._id   },
  ];
  for (const u of demoUsers) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      await User.create(u);
      log(`Demo user created: ${u.email}`);
    } else {
      info(`Demo user exists: ${u.email}`);
    }
  }

  // ── 4. Categories ─────────────────────────────────────────────────────────
  let categories = await Category.find();
  if (categories.length === 0) {
    categories = await Category.insertMany(CATEGORIES_SEED);
    log(`Categories seeded: ${categories.length}`);
  } else {
    info(`Categories already exist (${categories.length}) — skipping`);
  }

  // ── 5. Suppliers ──────────────────────────────────────────────────────────
  let suppliers = await Supplier.find();
  if (suppliers.length === 0) {
    suppliers = await Supplier.insertMany(SUPPLIERS_SEED);
    log(`Suppliers seeded: ${suppliers.length}`);
  } else {
    info(`Suppliers already exist (${suppliers.length}) — skipping`);
  }

  // ── 6. Customers ──────────────────────────────────────────────────────────
  let customers = await Customer.find();
  if (customers.length === 0) {
    customers = await Customer.insertMany(CUSTOMERS_SEED);
    log(`Customers seeded: ${customers.length}`);
  } else {
    info(`Customers already exist (${customers.length}) — skipping`);
  }

  // ── 7. Products ───────────────────────────────────────────────────────────
  let products = await Product.find();
  if (products.length === 0) {
    const productData = buildProducts(categories, suppliers);
    products = await Product.insertMany(productData);
    log(`Products seeded: ${products.length}`);
  } else {
    info(`Products already exist (${products.length}) — skipping`);
    products = await Product.find();
  }

  // ── 8. Sample sales (last 30 days, skip if sales exist) ───────────────────
  const saleCount = await Sale.countDocuments();
  if (saleCount === 0) {
    const customer1 = customers.find((c) => c.name === 'John Smith');
    const customer2 = customers.find((c) => c.name === 'Emily Johnson');
    const prod1 = products.find((p) => p.sku === 'ELEC-001');
    const prod2 = products.find((p) => p.sku === 'ELEC-002');
    const prod3 = products.find((p) => p.sku === 'CLTH-001');
    const prod4 = products.find((p) => p.sku === 'FOOD-001');

    const salesData = [
      {
        saleNumber: 'SALE-SEED-00001',
        customer: customer1._id, soldBy: adminUser._id, status: 'completed',
        paymentMethod: 'card',
        subtotal: 172.97, discountAmount: 0, taxRate: 8.5, taxAmount: 14.70, totalAmount: 187.67,
        saleDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        items: [
          { product: prod1._id, productName: prod1.name, productSku: prod1.sku, quantity: 2, unitPrice: prod1.price, costPrice: prod1.cost, discountPercent: 0, discountAmount: 0, lineTotal: prod1.price * 2 },
          { product: prod2._id, productName: prod2.name, productSku: prod2.sku, quantity: 1, unitPrice: prod2.price, costPrice: prod2.cost, discountPercent: 0, discountAmount: 0, lineTotal: prod2.price },
        ],
        stockChanges: [
          { product: prod1._id, qty: 2 },
          { product: prod2._id, qty: 1 },
        ],
      },
      {
        saleNumber: 'SALE-SEED-00002',
        customer: customer2._id, soldBy: adminUser._id, status: 'completed',
        paymentMethod: 'cash',
        subtotal: prod3.price * 3 + prod4.price * 2,
        discountAmount: 0, taxRate: 0, taxAmount: 0,
        totalAmount: prod3.price * 3 + prod4.price * 2,
        saleDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        items: [
          { product: prod3._id, productName: prod3.name, productSku: prod3.sku, quantity: 3, unitPrice: prod3.price, costPrice: prod3.cost, discountPercent: 0, discountAmount: 0, lineTotal: prod3.price * 3 },
          { product: prod4._id, productName: prod4.name, productSku: prod4.sku, quantity: 2, unitPrice: prod4.price, costPrice: prod4.cost, discountPercent: 0, discountAmount: 0, lineTotal: prod4.price * 2 },
        ],
        stockChanges: [
          { product: prod3._id, qty: 3 },
          { product: prod4._id, qty: 2 },
        ],
      },
    ];

    for (const saleData of salesData) {
      const { items, stockChanges, ...saleFields } = saleData;
      const sale = await Sale.create(saleFields);
      const saleItems = items.map((i) => ({ ...i, sale: sale._id }));
      await SaleItem.insertMany(saleItems);

      // Decrement stock + record movements
      for (const sc of stockChanges) {
        const prod = products.find((p) => p._id.toString() === sc.product.toString());
        const before = prod.stock;
        await Product.findByIdAndUpdate(sc.product, { $inc: { stock: -sc.qty } });
        prod.stock -= sc.qty; // update local cache
        await InventoryMovement.create({
          product: sc.product, type: 'sale', quantityChange: -sc.qty,
          quantityBefore: before, quantityAfter: prod.stock,
          reference: sale._id, referenceModel: 'Sale',
          notes: `Seed sale ${sale.saleNumber}`, performedBy: adminUser._id,
        });
      }
    }
    log('Sample sales seeded: 2');
  } else {
    info(`Sales already exist (${saleCount}) — skipping`);
  }

  // ── 9. Sample purchase ─────────────────────────────────────────────────────
  const purchaseCount = await Purchase.countDocuments();
  if (purchaseCount === 0) {
    const techSup = suppliers.find((s) => s.name === 'TechZone Distributors');
    const prod1   = products.find((p) => p.sku === 'ELEC-001');
    const prod2   = products.find((p) => p.sku === 'ELEC-002');

    const purchase = await Purchase.create({
      purchaseNumber: 'PO-SEED-00001',
      supplier: techSup._id, purchasedBy: adminUser._id,
      status: 'received', paymentMethod: 'bank_transfer',
      subtotal: prod1.cost * 10 + prod2.cost * 20,
      discountAmount: 0, taxAmount: 0,
      totalAmount: prod1.cost * 10 + prod2.cost * 20,
      purchaseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });

    const purchaseItems = [
      { purchase: purchase._id, product: prod1._id, productName: prod1.name, productSku: prod1.sku, quantity: 10, unitCost: prod1.cost, lineTotal: prod1.cost * 10 },
      { purchase: purchase._id, product: prod2._id, productName: prod2.name, productSku: prod2.sku, quantity: 20, unitCost: prod2.cost, lineTotal: prod2.cost * 20 },
    ];
    await PurchaseItem.insertMany(purchaseItems);

    // Increase stock + record movements
    for (const item of purchaseItems) {
      const prod = products.find((p) => p._id.toString() === item.product.toString());
      const before = prod.stock;
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      prod.stock += item.quantity;
      await InventoryMovement.create({
        product: item.product, type: 'purchase', quantityChange: item.quantity,
        quantityBefore: before, quantityAfter: prod.stock,
        reference: purchase._id, referenceModel: 'Purchase',
        notes: `Seed purchase ${purchase.purchaseNumber}`, performedBy: adminUser._id,
      });
    }
    log('Sample purchase seeded: 1');
  } else {
    info(`Purchases already exist (${purchaseCount}) — skipping`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('');
  console.log(c.bold('══════════════════════════════════════════'));
  console.log(c.bold('  Seed completed successfully!'));
  console.log(c.bold('══════════════════════════════════════════'));
  console.log(`  Admin:   ${c.cyan(config.admin.email)}`);
  console.log(`  Pass:    ${c.cyan(config.admin.password)}`);
  console.log(`  Manager: ${c.cyan('manager@digitalshop.com')} / Manager@1234!`);
  console.log(`  Staff:   ${c.cyan('staff@digitalshop.com')} / Staff@1234!`);
  console.log(c.bold('══════════════════════════════════════════'));
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(c.red(`\nSeed failed: ${err.message}`));
  console.error(err.stack);
  mongoose.disconnect().finally(() => process.exit(1));
});
