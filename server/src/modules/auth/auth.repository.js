const User = require('../users/user.model');
const Role = require('../roles/role.model');

/**
 * Find a role by name.
 * @param {string} name
 */
const findRoleByName = (name) => Role.findOne({ name });

/**
 * Find a role by its ObjectId.
 * @param {string} id
 */
const findRoleById = (id) => Role.findById(id);

/**
 * Find a user by email, including the password field (needed for login).
 * @param {string} email
 */
const findUserByEmailWithPassword = (email) =>
  User.findOne({ email }).select('+password').populate('role', 'name permissions');

/**
 * Find a user by id, without password.
 * @param {string} id
 */
const findUserById = (id) =>
  User.findById(id).populate('role', 'name permissions');

/**
 * Create and persist a new user document.
 * @param {object} data
 */
const createUser = (data) => User.create(data);

/**
 * Update a user document by id and return the updated document.
 * @param {string} id
 * @param {object} updates
 */
const updateUserById = (id, updates) =>
  User.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate('role', 'name permissions');

/**
 * Find a user by id including password (for change-password flow).
 * @param {string} id
 */
const findUserByIdWithPassword = (id) =>
  User.findById(id).select('+password').populate('role', 'name permissions');

module.exports = {
  findRoleByName,
  findRoleById,
  findUserByEmailWithPassword,
  findUserById,
  createUser,
  updateUserById,
  findUserByIdWithPassword,
};
