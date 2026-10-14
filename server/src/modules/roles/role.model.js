const mongoose = require('mongoose');

/**
 * All granular permission strings used across the application.
 * Controllers reference these constants via authorize() middleware.
 */
const PERMISSIONS = [
  // Users
  'users:read', 'users:create', 'users:update', 'users:delete',
  // Roles
  'roles:read', 'roles:create', 'roles:update', 'roles:delete',
  // Dashboard
  'dashboard:read',
  // Products
  'products:read', 'products:create', 'products:update', 'products:delete',
  // Categories
  'categories:read', 'categories:create', 'categories:update', 'categories:delete',
  // Customers
  'customers:read', 'customers:create', 'customers:update', 'customers:delete',
  // Suppliers
  'suppliers:read', 'suppliers:create', 'suppliers:update', 'suppliers:delete',
  // Sales
  'sales:read', 'sales:create', 'sales:update', 'sales:delete',
  // Purchases
  'purchases:read', 'purchases:create', 'purchases:update', 'purchases:delete',
  // Inventory
  'inventory:read', 'inventory:adjust',
  // Reports
  'reports:read',
];

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Role name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    permissions: {
      type: [String],
      enum: {
        values: PERMISSIONS,
        message: 'Permission {VALUE} is not a valid permission',
      },
      default: [],
    },
    isSystem: {
      // System roles (Admin, Manager, Staff) cannot be deleted
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  },
);

// name has unique:true on the field — index already created automatically

module.exports = mongoose.model('Role', roleSchema);
module.exports.PERMISSIONS = PERMISSIONS;
