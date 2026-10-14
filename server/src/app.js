const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const compression  = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi    = require('swagger-ui-express');

const { config }      = require('./config/env');
const swaggerSpec     = require('./config/swagger');
const { apiLimiter }  = require('./middleware/rateLimiter');
const notFound        = require('./middleware/notFound');
const errorHandler    = require('./middleware/errorHandler');
const logger          = require('./utils/logger');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes          = require('./modules/auth/auth.routes');
const userRoutes          = require('./modules/users/user.routes');
const roleRoutes          = require('./modules/roles/role.routes');
const dashboardRoutes     = require('./modules/dashboard/dashboard.routes');
const productRoutes       = require('./modules/products/product.routes');
const categoryRoutes      = require('./modules/categories/category.routes');
const customerRoutes      = require('./modules/customers/customer.routes');
const supplierRoutes      = require('./modules/suppliers/supplier.routes');
const saleRoutes          = require('./modules/sales/sale.routes');
const saleItemRoutes      = require('./modules/sale-items/saleItem.routes');
const purchaseRoutes      = require('./modules/purchases/purchase.routes');
const purchaseItemRoutes  = require('./modules/purchase-items/purchaseItem.routes');
const inventoryRoutes     = require('./modules/inventory/inventory.routes');
const reportRoutes        = require('./modules/reports/report.routes');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── Request parsing & compression ────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression());

// ── Data sanitisation (NoSQL injection protection) ────────────────────────────
app.use(mongoSanitize());

// ── Logging ───────────────────────────────────────────────────────────────────
if (config.env !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    }),
  );
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Swagger docs ──────────────────────────────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Digital Shop Manager API',
    customCss: '.swagger-ui .topbar { display: none }',
  }),
);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'API is running', timestamp: new Date() });
});

// ── API routes ────────────────────────────────────────────────────────────────
const BASE = '/api/v1';

app.use(`${BASE}/auth`,           authRoutes);
app.use(`${BASE}/users`,          userRoutes);
app.use(`${BASE}/roles`,          roleRoutes);
app.use(`${BASE}/dashboard`,      dashboardRoutes);
app.use(`${BASE}/products`,       productRoutes);
app.use(`${BASE}/categories`,     categoryRoutes);
app.use(`${BASE}/customers`,      customerRoutes);
app.use(`${BASE}/suppliers`,      supplierRoutes);
app.use(`${BASE}/sales`,          saleRoutes);
app.use(`${BASE}/sale-items`,     saleItemRoutes);
app.use(`${BASE}/purchases`,      purchaseRoutes);
app.use(`${BASE}/purchase-items`, purchaseItemRoutes);
app.use(`${BASE}/inventory`,      inventoryRoutes);
app.use(`${BASE}/reports`,        reportRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use(notFound);

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
