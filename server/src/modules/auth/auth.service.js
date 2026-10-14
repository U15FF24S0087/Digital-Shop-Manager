const AppError  = require('../../utils/AppError');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwtHelper');
const repo = require('./auth.repository');

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildTokenPayload = (user) => ({
  id:    user._id.toString(),
  email: user.email,
  role:  user.role?.name || '',
});

const issueTokens = (user) => ({
  accessToken:  signAccessToken(buildTokenPayload(user)),
  refreshToken: signRefreshToken(buildTokenPayload(user)),
});

const safeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

// ── Service methods ───────────────────────────────────────────────────────────

/**
 * Register a new user.
 * Only Admins may specify a role; everyone else is assigned the default 'Staff' role.
 *
 * @param {object} data          Validated request body
 * @param {object} requestingUser  req.user (null for public registration)
 */
const register = async (data, requestingUser = null) => {
  const { name, email, password, phone, role: roleId } = data;

  // Prevent duplicate email
  const existing = await repo.findUserByEmailWithPassword(email);
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  // Resolve role
  let resolvedRole;
  if (roleId && requestingUser?.role?.name === 'Admin') {
    resolvedRole = await repo.findRoleById(roleId);
    if (!resolvedRole) throw new AppError('Specified role not found', 404);
  } else {
    resolvedRole = await repo.findRoleByName('Staff');
    if (!resolvedRole) {
      throw new AppError('Default Staff role not found. Please run the seed script.', 500);
    }
  }

  const user = await repo.createUser({
    name,
    email,
    password,
    phone: phone || '',
    role: resolvedRole._id,
  });

  // Re-fetch to populate role
  const populated = await repo.findUserById(user._id);
  const tokens    = issueTokens(populated);

  return { user: safeUser(populated), ...tokens };
};

/**
 * Log in a user with email + password.
 */
const login = async ({ email, password }) => {
  const user = await repo.findUserByEmailWithPassword(email);

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact an administrator.', 403);
  }

  // Update lastLogin timestamp (fire-and-forget — don't await)
  repo.updateUserById(user._id, { lastLogin: new Date() }).catch(() => {});

  const tokens = issueTokens(user);
  return { user: safeUser(user), ...tokens };
};

/**
 * Return the currently authenticated user's profile.
 */
const getProfile = async (userId) => {
  const user = await repo.findUserById(userId);
  if (!user) throw new AppError('User not found', 404);
  return safeUser(user);
};

/**
 * Update the authenticated user's own profile (name, phone).
 */
const updateProfile = async (userId, updates) => {
  const user = await repo.updateUserById(userId, updates);
  if (!user) throw new AppError('User not found', 404);
  return safeUser(user);
};

/**
 * Change the authenticated user's password.
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await repo.findUserByIdWithPassword(userId);
  if (!user) throw new AppError('User not found', 404);

  const isCorrect = await user.comparePassword(currentPassword);
  if (!isCorrect) throw new AppError('Current password is incorrect', 401);

  if (currentPassword === newPassword) {
    throw new AppError('New password must differ from the current password', 400);
  }

  user.password = newPassword;
  await user.save();

  return { message: 'Password changed successfully' };
};

/**
 * Refresh the access token using a valid refresh token.
 */
const refreshToken = async (token) => {
  const decoded = verifyRefreshToken(token); // throws on invalid/expired
  const user    = await repo.findUserById(decoded.id);

  if (!user) throw new AppError('User no longer exists', 401);
  if (!user.isActive) throw new AppError('Account deactivated', 403);

  const accessToken = signAccessToken(buildTokenPayload(user));
  return { accessToken };
};

module.exports = { register, login, getProfile, updateProfile, changePassword, refreshToken };
