const mongoose = require('mongoose');

const SALE_STATUSES = ['pending', 'completed', 'cancelled', 'refunded'];
const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'other'];

const saleSchema = new mongoose.Schema(
  {
    saleNumber: {
      type: String,
      unique: true,
      // Auto-generated in the service layer: SALE-YYYYMMDD-XXXXX
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null, // walk-in customer allowed
    },
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sales person is required'],
    },
    status: {
      type: String,
      enum: { values: SALE_STATUSES, message: 'Invalid status: {VALUE}' },
      default: 'completed',
    },
    paymentMethod: {
      type: String,
      enum: { values: PAYMENT_METHODS, message: 'Invalid payment method: {VALUE}' },
      default: 'cash',
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxRate: {
      // Percentage, e.g. 8.5 means 8.5%
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    saleDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// saleNumber has unique:true on the field — index already created automatically
saleSchema.index({ customer: 1 });
saleSchema.index({ soldBy: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ saleDate: -1 });
saleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Sale', saleSchema);
module.exports.SALE_STATUSES   = SALE_STATUSES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
