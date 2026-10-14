const Joi = require('joi');

const addressSchema = Joi.object({
  street:  Joi.string().trim().max(200).allow('').optional(),
  city:    Joi.string().trim().max(100).allow('').optional(),
  state:   Joi.string().trim().max(100).allow('').optional(),
  zip:     Joi.string().trim().max(20).allow('').optional(),
  country: Joi.string().trim().max(100).allow('').optional(),
});

const createCustomerSchema = Joi.object({
  name:     Joi.string().trim().min(2).max(100).required(),
  email:    Joi.string().trim().email().lowercase().allow(null, '').optional(),
  phone:    Joi.string().trim().max(30).allow('').optional(),
  address:  addressSchema.optional(),
  notes:    Joi.string().trim().max(500).allow('').optional(),
  isActive: Joi.boolean().optional(),
});

const updateCustomerSchema = Joi.object({
  name:     Joi.string().trim().min(2).max(100).optional(),
  email:    Joi.string().trim().email().lowercase().allow(null, '').optional(),
  phone:    Joi.string().trim().max(30).allow('').optional(),
  address:  addressSchema.optional(),
  notes:    Joi.string().trim().max(500).allow('').optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { createCustomerSchema, updateCustomerSchema };
