const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [50, 'SKU cannot exceed 50 characters'],
    },
    barcode: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Barcode cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2048, 'Image URL cannot exceed 2048 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    price: {
      // Selling price
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    cost: {
      // Purchase cost (used for profit calculations)
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative'],
    },
    unit: {
      type: String,
      trim: true,
      default: 'pcs',
      maxlength: [20, 'Unit cannot exceed 20 characters'],
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// sku has unique:true on the field — index already created automatically
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ barcode: 1 }, { sparse: true });
// Text search index
productSchema.index({ name: 'text', description: 'text', sku: 'text' });

// ── Virtual: isLowStock ───────────────────────────────────────────────────────
productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockThreshold;
});

module.exports = mongoose.model('Product', productSchema);
