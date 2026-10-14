const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      street:  { type: String, trim: true, default: '' },
      city:    { type: String, trim: true, default: '' },
      state:   { type: String, trim: true, default: '' },
      zip:     { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: '' },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
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
      transform(_doc, ret) {
        ret.fullAddress = [
          ret.address.street,
          ret.address.city,
          ret.address.state,
          ret.address.zip,
          ret.address.country,
        ]
          .filter(Boolean)
          .join(', ');
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// email has unique:true on the field — index already created automatically
// Text search covers name, email, phone
customerSchema.index({ name: 'text', email: 'text', phone: 'text' });
customerSchema.index({ isActive: 1 });

module.exports = mongoose.model('Customer', customerSchema);
