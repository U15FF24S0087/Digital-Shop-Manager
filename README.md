# Digital Shop Manager

A production-style, full-stack **MERN** application for managing a retail or wholesale business. It covers the complete order cycle — from purchasing stock through to selling it — with real-time inventory tracking, role-based access control and comprehensive reporting.

---

## Table of Contents

1. [Features](#features)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [MongoDB Replica Set (Required for Transactions)](#mongodb-replica-set)
6. [Quick Start](#quick-start)
7. [Environment Variables](#environment-variables)
8. [Seed Data](#seed-data)
9. [Running the Application](#running-the-application)
10. [API Documentation (Swagger)](#api-documentation)
11. [Postman Collection](#postman-collection)
12. [Running Tests](#running-tests)
13. [Modules Overview](#modules-overview)
14. [RBAC — Roles and Permissions](#rbac)
15. [Business Logic — Sales Transactions](#sales-transactions)
16. [Business Logic — Purchase Transactions](#purchase-transactions)
17. [Architecture](#architecture)

---

## Features

- **13 full modules**: Auth, Users, Roles, Dashboard, Products, Categories, Customers, Suppliers, Sales, Sale Items, Purchases, Purchase Items, Inventory, Reports
- **JWT authentication** with access + refresh tokens and automatic token rotation
- **Role-Based Access Control** (Admin / Manager / Staff) enforced on the backend
- **MongoDB transactions** for atomic sales and purchases — full rollback on failure
- **Concurrent stock safety** — atomic `findOneAndUpdate` with `$gte` guard prevents negative inventory even under concurrent requests
- **Weighted-average costing** — product cost updates automatically on each purchase
- **Pagination, search, sorting and filtering** on all list endpoints
- **Swagger / OpenAPI** documentation at `/api-docs`
- **Jest + Supertest** integration tests with an in-memory replica set
- **Importable Postman collection** with automated tests
- React frontend with Tailwind CSS, Recharts dashboards, Chart.js reports, protected routes and permission-aware UI

---

## Technology Stack

| Layer          | Technology                                  |
|----------------|---------------------------------------------|
| Frontend       | React 18, Vite 5, React Router 6, Tailwind CSS 3, Recharts, Chart.js |
| HTTP Client    | Axios (with token-refresh interceptor)       |
| Backend        | Node.js 18+, Express 4                      |
| Database       | MongoDB 6+ (replica set required), Mongoose 8 |
| Authentication | JWT (jsonwebtoken), bcryptjs                |
| Validation     | Joi                                          |
| Documentation  | Swagger UI (swagger-jsdoc + swagger-ui-express) |
| Testing        | Jest 29, Supertest 7, mongodb-memory-server 10 |
| Security       | Helmet, express-rate-limit, express-mongo-sanitize, CORS |
| Logging        | Winston, Morgan                              |

---

## Project Structure

```
digital-shop-manager/
├── client/                    # React + Vite frontend
│   └── src/
│       ├── components/        # Reusable UI components (layout, ui/)
│       ├── context/           # AuthContext (JWT state, permissions)
│       ├── hooks/             # useApi, usePagination
│       ├── layouts/           # AppLayout (sidebar + header shell)
│       ├── pages/             # One folder per module
│       ├── routes/            # ProtectedRoute
│       └── services/          # Axios service modules per API resource
├── server/
│   └── src/
│       ├── config/            # db.js, env.js, swagger.js
│       ├── middleware/        # authenticate, authorize, validate, errorHandler
│       ├── modules/           # 13 feature modules (routes/controller/service/repository)
│       │   ├── auth/
│       │   ├── users/
│       │   ├── roles/
│       │   ├── dashboard/
│       │   ├── products/
│       │   ├── categories/
│       │   ├── customers/
│       │   ├── suppliers/
│       │   ├── sales/
│       │   ├── sale-items/
│       │   ├── purchases/
│       │   ├── purchase-items/
│       │   ├── inventory/
│       │   └── reports/
│       ├── scripts/           # seed.js, initReplicaSet.js
│       ├── tests/             # Jest integration tests
│       ├── utils/             # AppError, catchAsync, apiResponse, pagination, jwtHelper, logger
│       ├── app.js             # Express app (routes, middleware, Swagger)
│       └── server.js          # HTTP server entry point
├── postman/
│   ├── collection.json        # Importable Postman collection
│   └── environment.json       # Postman environment variables
├── .env.example               # Root-level env template
└── README.md
```

---

## Prerequisites

- **Node.js** ≥ 18 (`node -v`)
- **npm** ≥ 9 (`npm -v`)
- **MongoDB** ≥ 6, running as a **replica set** (required for transactions)
- **Git**

---

## MongoDB Replica Set

MongoDB multi-document transactions require a replica set or sharded cluster. A standalone `mongod` instance will reject transaction calls.

### Option A — MongoDB Atlas (Recommended, no local setup)

1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user and allow your IP
3. Copy the connection string and set `MONGO_URI` in `server/.env`:

```
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/digital-shop
```

Atlas clusters always run as replica sets — transactions work out of the box.

### Option B — Local Replica Set

**Step 1 — Create a data directory:**

```bash
mkdir -p /data/rs0
```

**Step 2 — Start mongod with a replica set name:**

```bash
mongod --replSet rs0 --port 27017 --dbpath /data/rs0 --bind_ip 127.0.0.1
```

Keep this terminal open.

**Step 3 — Initialise the replica set (run once):**

```bash
cd c:/Digital-Shop-Manager/server
npm run init:replset
```

You should see: `✓ Replica set initiated`. Wait 5 seconds for the primary election to complete.

**Step 4 — Verify:**

```bash
mongosh --eval "rs.status().members[0].stateStr"
# Should print: PRIMARY
```

Your `MONGO_URI` should be:

```
MONGO_URI=mongodb://127.0.0.1:27017/digital-shop?replicaSet=rs0
```

---

## Quick Start

```bash
# 1. Clone or navigate to the project
cd c:/Digital-Shop-Manager

# 2. Install all dependencies (root + server + client)
npm install
cd server && npm install
cd ../client && npm install
cd ..

# 3. Create the server environment file
cp server/.env.example server/.env
# Edit server/.env and set MONGO_URI (and optionally change secrets)

# 4. Start MongoDB replica set (see above), then seed the database
cd server
npm run seed

# 5. Start the backend (port 5000)
npm run dev

# 6. In a second terminal, start the frontend (port 5173)
cd ../client
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in the values:

| Variable                | Description                                             | Example |
|-------------------------|---------------------------------------------------------|---------|
| `NODE_ENV`              | Runtime environment                                     | `development` |
| `PORT`                  | HTTP server port                                        | `5000` |
| `MONGO_URI`             | MongoDB connection string (must include replica set)    | `mongodb://127.0.0.1:27017/digital-shop?replicaSet=rs0` |
| `JWT_SECRET`            | Access token signing secret (min 32 chars)              | `change_me_to_something_long_and_random` |
| `JWT_EXPIRES_IN`        | Access token TTL                                        | `7d` |
| `JWT_REFRESH_SECRET`    | Refresh token signing secret (min 32 chars)             | `different_long_random_string` |
| `JWT_REFRESH_EXPIRES_IN`| Refresh token TTL                                       | `30d` |
| `ADMIN_NAME`            | Default admin display name (used by seed)               | `Administrator` |
| `ADMIN_EMAIL`           | Default admin email (used by seed)                      | `admin@digitalshop.com` |
| `ADMIN_PASSWORD`        | Default admin password (used by seed)                   | `Admin@1234!` |
| `RATE_LIMIT_WINDOW_MS`  | Rate limit window in ms                                 | `900000` |
| `RATE_LIMIT_MAX`        | Max requests per window per IP                          | `100` |
| `CLIENT_URL`            | Frontend URL for CORS allow-list                        | `http://localhost:5173` |
| `LOG_LEVEL`             | Winston log level                                       | `debug` |

**Security note:** Never commit `server/.env` to version control. It is listed in `.gitignore`.

---

## Seed Data

The seed script is idempotent — it skips collections that already have data.

```bash
# Standard seed (skips if data exists)
cd server
npm run seed

# Fresh seed (drops all data first, then re-seeds)
npm run seed:fresh
```

After seeding you will have:

| Role    | Email                         | Password       |
|---------|-------------------------------|----------------|
| Admin   | admin@digitalshop.com         | Admin@1234!    |
| Manager | manager@digitalshop.com       | Manager@1234!  |
| Staff   | staff@digitalshop.com         | Staff@1234!    |

Plus: 5 categories, 4 suppliers, 5 customers, 15 products (some with low stock for demo), 2 sample sales, 1 sample purchase.

---

## Running the Application

### Backend only

```bash
cd server
npm run dev        # nodemon — auto-restarts on file changes
npm start          # production mode
```

### Frontend only

```bash
cd client
npm run dev        # Vite dev server with HMR
npm run build      # Production build → client/dist/
npm run preview    # Preview the production build
```

### Both concurrently (from project root)

```bash
npm run dev        # runs server + client in parallel via concurrently
```

---

## API Documentation

Once the server is running, Swagger UI is available at:

```
http://localhost:5000/api-docs
```

All endpoints are documented with request/response schemas. Use the **Authorize** button to enter your Bearer token after logging in.

---

## Postman Collection

1. Open Postman
2. Click **Import** → drag in both files:
   - `postman/collection.json`
   - `postman/environment.json`
3. Select the **Digital Shop Manager — Local** environment
4. Run **Auth / Login** first — the test script automatically saves `accessToken` and `refreshToken` to the environment
5. All subsequent requests use `{{accessToken}}` automatically

### Key automated tests in the collection

| Request | What is verified |
|---------|-----------------|
| Login | Returns tokens, password not in response |
| Register — Weak Password | Returns 422 |
| Create Sale (valid) | 201, saleNumber present, server-computed totalAmount > 0 |
| Create Sale — Insufficient Stock | 422, message mentions "stock" |
| Create Sale — No Auth | 401 |
| Adjust Stock — Would Go Negative | 422, message mentions "negative" |
| Delete System Role | 400 (system roles cannot be deleted) |
| Reports — Unauthorized | 401 |
| List Users | Password not in any response item |

---

## Running Tests

Tests use `mongodb-memory-server` — no external MongoDB needed.

```bash
cd server

# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode (useful during development)
npm run test:watch
```

### Test suites

| File | Coverage |
|------|----------|
| `auth.test.js` | Register, login, profile, duplicate email, weak password, missing token |
| `dashboard.test.js` | Dashboard totals and chart series, empty database, role-filtered data, authentication |
| `categories.test.js` | Category validation, slug conflicts, statistics, product relationships, safe reassignment, and RBAC |
| `products.test.js` | Product statistics, search/filters/sorting, SKU uniqueness, stock-safe edits, soft deletion, opening-stock movement and RBAC |
| `sales.test.js` | Stock decrement, server-side totals, insufficient stock, **full transaction rollback**, concurrent stock guard |
| `purchases.test.js` | Stock increment, weighted-average cost, **transaction rollback on partial failure**, RBAC |
| `inventory.test.js` | Adjust stock, negative-stock prevention, movement history |
| `rbac.test.js` | Admin / Manager / Staff permissions across users, roles, products, purchases, reports |

---

## Modules Overview

| Module | Endpoint prefix | Description |
|--------|-----------------|-------------|
| Auth | `/api/v1/auth` | Register, login, logout, refresh token, profile |
| Users | `/api/v1/users` | CRUD, toggle status, admin password reset |
| Roles | `/api/v1/roles` | CRUD, permissions list; system roles protected |
| Dashboard | `/api/v1/dashboard/summary` | Permission-filtered KPIs, 7/30-day charts, best sellers, recent transactions, and category totals (`/api/v1/dashboard` remains an alias) |
| Products | `/api/v1/products` | Paginated/searchable catalog, `/stats`, barcode/images, category and stock filters, soft deactivation |
| Categories | `/api/v1/categories` | Searchable/paginated CRUD, generated unique slugs, product counts, statistics, and guarded reassignment/deletion |
| Customers | `/api/v1/customers` | CRUD, purchase history |
| Suppliers | `/api/v1/suppliers` | CRUD, purchase history |
| Sales | `/api/v1/sales` | Transactional sale creation, status updates |
| Sale Items | `/api/v1/sale-items` | Read-only; created atomically with sale |
| Purchases | `/api/v1/purchases` | Transactional purchase recording, status updates |
| Purchase Items | `/api/v1/purchase-items` | Read-only; created atomically with purchase |
| Inventory | `/api/v1/inventory` | Stock summary, low-stock, movements, manual adjustments |
| Reports | `/api/v1/reports` | Sales, purchases, profit (with margin), inventory valuation |

### Products API and inventory

List products with `GET /api/v1/products?page=1&limit=20&search=sku&category=<categoryId>&stockStatus=low_stock&sortBy=createdAt&order=desc`. Supported stock states are `in_stock`, `low_stock`, and `out_of_stock`; sortable fields are `name`, `price`, `cost`, `stock`, `createdAt`, and `updatedAt`. `GET /api/v1/products/stats` returns total, active, inactive, low-stock, and out-of-stock counts.

Create products with `POST /api/v1/products`; update catalog information with `PATCH /api/v1/products/:id`. Stock is not editable through product updates: use the permission-protected Inventory adjustment endpoint instead. Initial stock above zero is recorded as an inventory movement when a product is created. `DELETE /api/v1/products/:id` deactivates the product and keeps historical sales, purchases, and stock movements. Inactive products are already excluded from new sales.

### Categories API and product relationships

`GET /api/v1/categories` supports `page`, `limit`, `search` (name or description), `isActive`, `sortBy=name|createdAt`, and `order=asc|desc`. Each result includes its product count. `GET /api/v1/categories/stats` returns total, active, inactive, and categories-with-products counts. Category names are whitespace-normalized; slugs are generated from names, normalized, and uniquely indexed.

Create categories with `POST /api/v1/categories`; edit them with `PATCH /api/v1/categories/:id`. Renaming updates the slug but keeps all product references intact. `GET /api/v1/categories/:id/products` returns a paginated list and requires `products:read`. Deleting a category with assigned products returns `409`; to explicitly move those products, pass `?reassignTo=<activeCategoryId>` to the delete endpoint. Reassignment and deletion run in a MongoDB transaction when the database topology supports transactions. Deactivating a category is available through its `isActive` field and prevents assignment to new products.

---

## RBAC

Permissions are stored in the `Role` document and checked by the `authorize()` middleware on every protected route. The Admin role bypasses all permission checks.

| Permission string | Admin | Manager | Staff |
|-------------------|-------|---------|-------|
| `dashboard:read`  | ✓ | ✓ | ✓ |
| `products:read`   | ✓ | ✓ | ✓ |
| `products:create` | ✓ | ✓ | ✗ |
| `products:update` | ✓ | ✓ | ✗ |
| `products:delete` | ✓ | ✗ | ✗ |
| `sales:read`      | ✓ | ✓ | ✓ |
| `sales:create`    | ✓ | ✓ | ✓ |
| `sales:update`    | ✓ | ✓ | ✗ |
| `purchases:create`| ✓ | ✓ | ✗ |
| `inventory:adjust`| ✓ | ✓ | ✗ |
| `reports:read`    | ✓ | ✓ | ✗ |
| `users:read`      | ✓ | ✓ | ✗ |
| `users:create/update/delete` | ✓ | ✗ | ✗ |
| `roles:*`         | ✓ | ✗ | ✗ |

---

## Sales Transactions

When `POST /api/v1/sales` is called:

1. Validate request body (Joi) — rejects immediately if malformed
2. Verify every product exists and is active
3. Open a MongoDB session and start a transaction
4. For each item: `findOneAndUpdate({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })` — atomically checks **and** deducts stock. If the document cannot be matched (stock insufficient), the transaction aborts and a 422 is returned
5. Calculate server-side: `lineTotal = unitPrice × qty × (1 - discountPct/100)`, then `subtotal`, `taxAmount`, `totalAmount`
6. Insert `Sale` document
7. Insert all `SaleItem` documents
8. Insert `InventoryMovement` records
9. **Commit** — if anything above threw, the session automatically **aborts**, leaving zero database changes

This means: **partial sales cannot happen**. Either all items are sold and stock is reduced, or nothing changes.

---

## Purchase Transactions

When `POST /api/v1/purchases` is called:

1. Validate supplier and all products exist
2. Compute line totals and purchase total on the server
3. Open MongoDB transaction
4. Insert `Purchase` document
5. Insert `PurchaseItem` documents
6. For each item: `findByIdAndUpdate(productId, { $inc: { stock: qty }, cost: newCost })` where `newCost` is calculated using **weighted-average costing**:

```
newCost = (oldStock × oldCost + qty × unitCost) / (oldStock + qty)
```

7. Insert `InventoryMovement` records
8. **Commit** — if anything fails, the session **aborts** and all changes are rolled back

---

## Architecture

```
React (Vite)
  ↓ Axios (Bearer JWT)
Express Routes  →  Rate Limiter  →  authenticate()  →  authorize()
  ↓
Controllers  →  Services  →  Repositories  →  Mongoose Models  →  MongoDB
  ↓
AppError → errorHandler middleware → JSON response
```

- **Controllers** — thin, delegate to services, call `sendSuccess` / `sendPaginated`
- **Services** — business logic, transactions, validation rules beyond schema level
- **Repositories** — pure database calls, no business logic
- **Models** — Mongoose schemas with indexes, virtuals, pre-save hooks
- **Middleware** — `authenticate` (JWT verify + user load), `authorize` (permission check), `validate` (Joi), `errorHandler` (normalises Mongoose / JWT errors)
