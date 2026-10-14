const catchAsync  = require('../../utils/catchAsync');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');
const authService = require('./auth.service');

/**
 * POST /api/v1/auth/register
 * Public — creates a new user (assigned Staff role by default).
 * Admins may POST with a role field to assign any role.
 */
const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body, req.user || null);
  sendCreated(res, {
    message: 'Registration successful',
    data: result,
  });
});

/**
 * POST /api/v1/auth/login
 * Public — returns access + refresh tokens.
 */
const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  sendSuccess(res, {
    message: 'Login successful',
    data: result,
  });
});

/**
 * POST /api/v1/auth/logout
 * Protected — client discards tokens; server logs the event.
 * (Stateless JWT — actual revocation requires a token blacklist or short expiry.)
 */
const logout = catchAsync(async (_req, res) => {
  sendSuccess(res, { message: 'Logged out successfully' });
});

/**
 * GET /api/v1/auth/me
 * Protected — returns the authenticated user's profile.
 */
const getProfile = catchAsync(async (req, res) => {
  const user = await authService.getProfile(req.user._id);
  sendSuccess(res, { data: user });
});

/**
 * PATCH /api/v1/auth/me
 * Protected — update name and phone.
 */
const updateProfile = catchAsync(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  sendSuccess(res, { message: 'Profile updated successfully', data: user });
});

/**
 * POST /api/v1/auth/change-password
 * Protected — change password with current password verification.
 */
const changePassword = catchAsync(async (req, res) => {
  const result = await authService.changePassword(req.user._id, req.body);
  sendSuccess(res, result);
});

/**
 * POST /api/v1/auth/refresh-token
 * Public — exchange a valid refresh token for a new access token.
 */
const refreshToken = catchAsync(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  sendSuccess(res, { message: 'Token refreshed', data: result });
});

module.exports = { register, login, logout, getProfile, updateProfile, changePassword, refreshToken };
