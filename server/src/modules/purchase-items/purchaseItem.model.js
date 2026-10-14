const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema(
  {
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      required: [true, 'Purchase reference is required'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    productName: {
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
    unitCost: {
      // Purchase cost per unit
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative'],
    },
    lineTotal: {
      // unitCost * quantity
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
purchaseItemSchema.index({ purchase: 1 });
purchaseItemSchema.index({ product: 1 });

module.exports = mongoose.model('PurchaseItem', purchaseItemSchema);
