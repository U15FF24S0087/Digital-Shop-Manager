const AppError = require('../utils/AppError');

/**
 * Middleware factory: restrict access to users whose role has ALL of the
 * listed permissions.
 *
 * Usage:  authorize('products:create', 'products:read')
 *
 * @param {...string} permissions  One or more permission strings required.
 */
const authorize = (...permissions) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  // Admin role bypasses all permission checks
  if (req.user.role && req.user.role.name === 'Admin') {
    return next();
  }

  const userPermissions = (req.user.role && req.user.role.permissions) || [];

  const hasAll = permissions.every((p) => userPermissions.includes(p));
  if (!hasAll) {
    return next(
      new AppError(
        `You do not have permission to perform this action. Required: ${permissions.join(', ')}`,
        403,
      ),
    );
  }

  next();
};

/**
 * Restrict to specific role names.
 * Usage: restrictTo('Admin', 'Manager')
 */
const restrictTo = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  const roleName = req.user.role && req.user.role.name;
  if (!roles.includes(roleName)) {
    return next(
      new AppError('You do not have permission to perform this action', 403),
    );
  }

  next();
};

module.exports = { authorize, restrictTo };
