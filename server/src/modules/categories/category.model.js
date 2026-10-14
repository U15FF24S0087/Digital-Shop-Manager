const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    nameKey: {
      type: String,
      select: false,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [120, 'Category slug cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2048, 'Image URL cannot exceed 2048 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_document, returned) => {
        delete returned.nameKey;
        return returned;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_document, returned) => {
        delete returned.nameKey;
        return returned;
      },
    },
  },
);

const slugify = (value) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

categorySchema.pre('validate', function normalizeCategory(next) {
  if (this.name) {
    this.name = this.name.trim().replace(/\s+/g, ' ');
    this.nameKey = this.name.toLocaleLowerCase('en-US');
  }
  if (this.slug) this.slug = slugify(this.slug);
  else if (this.isNew || this.isModified('name')) this.slug = slugify(this.name || '');
  next();
});

categorySchema.index({ slug: 1 }, {
  unique: true,
  partialFilterExpression: { slug: { $type: 'string' } },
});
categorySchema.index({ nameKey: 1 }, {
  unique: true,
  partialFilterExpression: { nameKey: { $type: 'string' } },
});

module.exports = mongoose.model('Category', categorySchema);
