const AppError = require('../utils/AppError');

/**
 * Catch-all for unmatched routes.
 */
const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = notFound;
