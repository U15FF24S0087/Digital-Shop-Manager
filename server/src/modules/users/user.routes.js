/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (Admin only)
 */

const express      = require('express');
const authenticate = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const validate     = require('../../middleware/validate');
const { createUserSchema, updateUserSchema, adminResetPasswordSchema } = require('./user.validators');
const ctrl         = require('./user.controller');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users (paginated)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 */
router.get('/',    authorize('users:read'),   ctrl.getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 */
router.get('/:id', authorize('users:read'),   ctrl.getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 */
router.post('/',   authorize('users:create'), validate(createUserSchema), ctrl.createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 */
router.put('/:id', authorize('users:update'), validate(updateUserSchema), ctrl.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 */
router.delete('/:id', authorize('users:delete'), ctrl.deleteUser);

/**
 * @swagger
 * /users/{id}/reset-password:
 *   patch:
 *     summary: Admin reset a user's password
 *     tags: [Users]
 */
router.patch('/:id/reset-password', authorize('users:update'), validate(adminResetPasswordSchema), ctrl.adminResetPassword);

/**
 * @swagger
 * /users/{id}/toggle-status:
 *   patch:
 *     summary: Toggle a user's active status
 *     tags: [Users]
 */
router.patch('/:id/toggle-status', authorize('users:update'), ctrl.toggleUserStatus);

module.exports = router;
