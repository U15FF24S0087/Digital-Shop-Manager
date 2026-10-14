const Joi = require('joi');
const { SALE_STATUSES, PAYMENT_METHODS } = require('./sale.model');

const saleItemSchema = Joi.object({
  product:         Joi.string().hex().length(24).required(),
  quantity:        Joi.number().integer().min(1).required(),
  unitPrice:       Joi.number().min(0).optional(), // if omitted, server uses product.price
  discountPercent: Joi.number().min(0).max(100).default(0),
});

const createSaleSchema = Joi.object({
  customer:      Joi.string().hex().length(24).allow(null, '').optional(),
  paymentMethod: Joi.string().valid(...PAYMENT_METHODS).default('cash'),
  taxRate:       Joi.number().min(0).max(100).default(0),
  notes:         Joi.string().trim().max(500).allow('').optional(),
  saleDate:      Joi.date().iso().optional(),
  items:         Joi.array().items(saleItemSchema).min(1).required(),
});

const updateSaleStatusSchema = Joi.object({
  status: Joi.string().valid(...SALE_STATUSES).required(),
  notes:  Joi.string().trim().max(500).allow('').optional(),
});

module.exports = { createSaleSchema, updateSaleStatusSchema };
