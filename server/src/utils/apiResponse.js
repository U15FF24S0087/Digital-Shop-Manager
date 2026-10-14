/**
 * Consistent JSON response helpers used by all controllers.
 */

const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};

const sendCreated = (res, { message = 'Resource created successfully', data = null } = {}) =>
  sendSuccess(res, { statusCode: 201, message, data });

const sendError = (res, { statusCode = 500, message = 'Internal server error', errors = null } = {}) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};

const sendPaginated = (res, { data, page, limit, total, message = 'Data retrieved successfully' }) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = { sendSuccess, sendCreated, sendError, sendPaginated };
