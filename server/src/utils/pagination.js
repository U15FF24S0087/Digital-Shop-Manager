/**
 * Build a Mongoose-compatible pagination object from request query params.
 *
 * @param {object} query   req.query
 * @returns {{ skip, limit, page, sort }}
 */
const getPagination = (query) => {
  const page  = Math.max(parseInt(query.page,  10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100); // cap at 100
  const skip  = (page - 1) * limit;

  // sortBy=price&order=desc  →  { price: -1 }
  const sortField = query.sortBy || 'createdAt';
  const sortOrder = query.order === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortOrder };

  return { skip, limit, page, sort };
};

module.exports = { getPagination };
