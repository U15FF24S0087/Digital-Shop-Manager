const mongoose = require('mongoose');

const PURCHASE_STATUSES = ['pending', 'received', 'partial', 'cancelled'];
const PURCHASE_PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'credit', 'other'];

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: {
      type: String,
      unique: true,
      // Auto-generated: PO-YYYYMMDD-XXXXX
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required'],
    },
    purchasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Purchasing user is required'],
    },
    status: {
      type: String,
      enum: { values: PURCHASE_STATUSES, message: 'Invalid status: {VALUE}' },
      default: 'received',
    },
    paymentMethod: {
      type: String,
      enum: { values: PURCHASE_PAYMENT_METHODS, message: 'Invalid payment method: {VALUE}' },
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
    purchaseDate: {
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
// purchaseNumber has unique:true on the field — index already created automatically
purchaseSchema.index({ supplier: 1 });
purchaseSchema.index({ purchasedBy: 1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
module.exports.PURCHASE_STATUSES         = PURCHASE_STATUSES;
module.exports.PURCHASE_PAYMENT_METHODS  = PURCHASE_PAYMENT_METHODS;
