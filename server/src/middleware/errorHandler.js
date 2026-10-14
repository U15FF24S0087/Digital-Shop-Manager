const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * Convert known Mongoose / JWT errors to AppError instances so the handler
 * below can respond with the right HTTP status.
 */
const normalizeError = (err) => {
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return new AppError(`Duplicate value for field: ${field}`, 409);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return new AppError('Validation failed', 422, messages);
  }

  // JWT errors are already handled in jwtHelper — keep as-is
  return err;
};

/**
 * Global error-handling middleware (must have 4 parameters).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  const normalized = normalizeError(err);

  const statusCode = normalized.statusCode || 500;
  const message    = normalized.message    || 'Internal server error';
  const errors     = normalized.errors     || null;

  // Log unexpected server errors
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} — ${message}`, { stack: err.stack });
  }

  const body = {
    success: false,
    message,
    ...(errors && { errors }),
  };

  // Expose stack trace only in development
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
