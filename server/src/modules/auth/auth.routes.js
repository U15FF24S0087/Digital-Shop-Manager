/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and profile management
 */

const express      = require('express');
const { authLimiter } = require('../../middleware/rateLimiter');
const authenticate = require('../../middleware/authenticate');
const validate     = require('../../middleware/validate');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  refreshTokenSchema,
} = require('./auth.validators');
const ctrl = require('./auth.controller');

const router = express.Router();

// ── Public routes ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: "Jane Doe" }
 *               email:    { type: string, example: "jane@example.com" }
 *               password: { type: string, example: "Secret@123" }
 *               phone:    { type: string, example: "+1-555-0100" }
 *     responses:
 *       201: { description: Registration successful }
 *       409: { description: Email already exists }
 *       422: { description: Validation error }
 */
router.post('/register', authLimiter, validate(registerSchema), ctrl.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in and receive JWT tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful, returns accessToken and refreshToken }
 *       401: { description: Invalid credentials }
 */
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Exchange a refresh token for a new access token
 *     tags: [Auth]
 *     security: []
 */
router.post('/refresh-token', validate(refreshTokenSchema), ctrl.refreshToken);

// ── Protected routes ──────────────────────────────────────────────────────────

router.use(authenticate);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out (client discards token)
 *     tags: [Auth]
 */
router.post('/logout', ctrl.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get authenticated user's profile
 *     tags: [Auth]
 *   patch:
 *     summary: Update authenticated user's profile
 *     tags: [Auth]
 */
router.get('/me',    ctrl.getProfile);
router.patch('/me',  validate(updateProfileSchema), ctrl.updateProfile);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password (requires current password)
 *     tags: [Auth]
 */
router.post('/change-password', validate(changePasswordSchema), ctrl.changePassword);

module.exports = router;
