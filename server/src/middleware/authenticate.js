const { verifyAccessToken } = require('../utils/jwtHelper');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const User = require('../modules/users/user.model');

/**
 * Middleware: verify Bearer JWT and attach user to req.user.
 * Loads the full user document (without password) including role.
 */
const authenticate = catchAsync(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No authentication token provided', 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  const user = await User.findById(decoded.id)
    .select('-password')
    .populate('role', 'name permissions');

  if (!user) {
    throw new AppError('User belonging to this token no longer exists', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact an administrator.', 403);
  }

  req.user = user;
  next();
});

module.exports = authenticate;
