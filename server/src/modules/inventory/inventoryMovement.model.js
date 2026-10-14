const mongoose = require('mongoose');

/**
 * Movement types:
 *   sale          – stock reduced by a sale
 *   purchase      – stock increased by a purchase
 *   adjustment    – manual stock correction
 *   return_in     – stock returned from customer
 *   return_out    – stock returned to supplier
 *   damage        – stock written off as damaged
 */
const MOVEMENT_TYPES = [
  'sale',
  'purchase',
  'adjustment',
  'return_in',
  'return_out',
  'damage',
];

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    type: {
      type: String,
      enum: { values: MOVEMENT_TYPES, message: 'Invalid movement type: {VALUE}' },
      required: [true, 'Movement type is required'],
    },
    quantityChange: {
      // Positive = stock in, Negative = stock out
      type: Number,
      required: [true, 'Quantity change is required'],
    },
    quantityBefore: {
      type: Number,
      required: true,
    },
    quantityAfter: {
      type: Number,
      required: true,
    },
    reference: {
      // ID of the related Sale or Purchase document
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referenceModel: {
      type: String,
      enum: ['Sale', 'Purchase', null],
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performed-by user is required'],
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
inventoryMovementSchema.index({ product: 1, createdAt: -1 });
inventoryMovementSchema.index({ type: 1 });
inventoryMovementSchema.index({ reference: 1 });
inventoryMovementSchema.index({ performedBy: 1 });
inventoryMovementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
module.exports.MOVEMENT_TYPES = MOVEMENT_TYPES;
