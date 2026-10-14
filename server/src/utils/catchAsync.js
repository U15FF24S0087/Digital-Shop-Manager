/**
 * Wraps an async route handler so any rejected promise is forwarded to
 * Express's next(err) — eliminating try/catch boilerplate in controllers.
 *
 * @param {Function} fn  Async route handler (req, res, next) => Promise
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
