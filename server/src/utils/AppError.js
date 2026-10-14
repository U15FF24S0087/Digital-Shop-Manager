/**
 * Custom application error class.
 * Carries an HTTP status code so the global error handler can respond correctly.
 */
class AppError extends Error {
  /**
   * @param {string} message   - Human-readable error message
   * @param {number} statusCode - HTTP status code (default 500)
   * @param {any}    errors    - Optional validation errors array / object
   */
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Distinguish from unexpected programmer errors
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
