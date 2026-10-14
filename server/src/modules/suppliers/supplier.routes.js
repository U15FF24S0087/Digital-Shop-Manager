/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Supplier management and purchase history
 */

const express      = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const validate     = require('../../middleware/validate');
const { createSupplierSchema, updateSupplierSchema } = require('./supplier.validators');
const ctrl         = require('./supplier.controller');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /suppliers/all:
 *   get:
 *     summary: Get all active suppliers (no pagination — for dropdowns)
 *     tags: [Suppliers]
 */
router.get('/all', authorize('suppliers:read'), ctrl.getAllActiveSuppliers);

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: List suppliers (paginated, searchable)
 *     tags: [Suppliers]
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
 */
router.get('/',    authorize('suppliers:read'),   ctrl.getSuppliers);
router.post('/',   authorize('suppliers:create'), validate(createSupplierSchema), ctrl.createSupplier);

/**
 * @swagger
 * /suppliers/{id}/purchase-history:
 *   get:
 *     summary: Get full purchase history for a supplier
 *     tags: [Suppliers]
 */
router.get('/:id/purchase-history', authorize('suppliers:read'), ctrl.getSupplierPurchaseHistory);

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     summary: Get a supplier by ID
 *     tags: [Suppliers]
 *   put:
 *     summary: Update a supplier
 *     tags: [Suppliers]
 *   delete:
 *     summary: Deactivate (soft-delete) a supplier
 *     tags: [Suppliers]
 */
router.get('/:id',    authorize('suppliers:read'),   ctrl.getSupplierById);
router.put('/:id',    authorize('suppliers:update'), validate(updateSupplierSchema), ctrl.updateSupplier);
router.delete('/:id', authorize('suppliers:delete'), ctrl.deleteSupplier);

module.exports = router;
