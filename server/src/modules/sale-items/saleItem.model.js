const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: [true, 'Sale reference is required'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    productName: {
      // Snapshot at time of sale so reports stay accurate even if product is deleted
      type: String,
      required: true,
    },
    productSku: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      // Selling price at time of sale
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    costPrice: {
      // Cost at time of sale (for profit calculation)
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lineTotal: {
      // (unitPrice * quantity) - discountAmount
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
saleItemSchema.index({ sale: 1 });
saleItemSchema.index({ product: 1 });

module.exports = mongoose.model('SaleItem', saleItemSchema);
