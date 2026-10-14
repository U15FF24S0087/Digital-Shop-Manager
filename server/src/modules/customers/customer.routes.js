/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer profile and purchase history management
 */

const express      = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const validate     = require('../../middleware/validate');
const { createCustomerSchema, updateCustomerSchema } = require('./customer.validators');
const ctrl         = require('./customer.controller');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /customers/all:
 *   get:
 *     summary: Get all active customers (no pagination — for dropdowns)
 *     tags: [Customers]
 */
router.get('/all', authorize('customers:read'), ctrl.getAllActiveCustomers);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: List customers (paginated, searchable)
 *     tags: [Customers]
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 */
router.get('/',    authorize('customers:read'),   ctrl.getCustomers);
router.post('/',   authorize('customers:create'), validate(createCustomerSchema), ctrl.createCustomer);

/**
 * @swagger
 * /customers/{id}/purchase-history:
 *   get:
 *     summary: Get full purchase history for a customer
 *     tags: [Customers]
 */
router.get('/:id/purchase-history', authorize('customers:read'), ctrl.getCustomerPurchaseHistory);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get a customer by ID
 *     tags: [Customers]
 *   put:
 *     summary: Update a customer
 *     tags: [Customers]
 *   delete:
 *     summary: Deactivate (soft-delete) a customer
 *     tags: [Customers]
 */
router.get('/:id',    authorize('customers:read'),   ctrl.getCustomerById);
router.put('/:id',    authorize('customers:update'), validate(updateCustomerSchema), ctrl.updateCustomer);
router.delete('/:id', authorize('customers:delete'), ctrl.deleteCustomer);

module.exports = router;
