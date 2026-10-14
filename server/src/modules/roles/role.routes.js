/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role and permission management (Admin only)
 */

const express      = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const validate     = require('../../middleware/validate');
const { createRoleSchema, updateRoleSchema } = require('./role.validators');
const ctrl         = require('./role.controller');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /roles/permissions:
 *   get:
 *     summary: List all available permission strings
 *     tags: [Roles]
 */
router.get('/permissions', authorize('roles:read'), ctrl.getPermissions);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: List all roles
 *     tags: [Roles]
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 */
router.get('/',    authorize('roles:read'),   ctrl.getRoles);
router.post('/',   authorize('roles:create'), validate(createRoleSchema), ctrl.createRole);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Get a role by ID
 *     tags: [Roles]
 *   put:
 *     summary: Update a role
 *     tags: [Roles]
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
 */
router.get('/:id',    authorize('roles:read'),   ctrl.getRoleById);
router.put('/:id',    authorize('roles:update'), validate(updateRoleSchema), ctrl.updateRole);
router.delete('/:id', authorize('roles:delete'), ctrl.deleteRole);

module.exports = router;
