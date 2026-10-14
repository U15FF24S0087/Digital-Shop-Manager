const AppError = require('../utils/AppError');

/**
 * Express middleware that validates req.body against a Joi schema.
 * On failure it collects all error messages and throws a 422 AppError.
 *
 * @param {import('joi').ObjectSchema} schema
 * @param {'body'|'query'|'params'} source  Which part of req to validate (default: 'body')
 */
const validate = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,     // collect all errors
    allowUnknown: false,   // strip unknown keys
    stripUnknown: true,    // remove extra fields
  });

  if (error) {
    const messages = error.details.map((d) => d.message.replace(/['"]/g, ''));
    return next(new AppError('Validation failed', 422, messages));
  }

  // Express exposes req.query through a getter, so define the validated value
  // explicitly to preserve Joi coercions such as boolean filters.
  Object.defineProperty(req, source, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
  next();
};

module.exports = validate;
