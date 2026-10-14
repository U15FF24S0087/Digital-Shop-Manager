const Joi = require('joi');
const { PURCHASE_STATUSES, PURCHASE_PAYMENT_METHODS } = require('./purchase.model');

const purchaseItemSchema = Joi.object({
  product:  Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).required(),
  unitCost: Joi.number().min(0).required(),
});

const createPurchaseSchema = Joi.object({
  supplier:      Joi.string().hex().length(24).required(),
  paymentMethod: Joi.string().valid(...PURCHASE_PAYMENT_METHODS).default('cash'),
  discountAmount: Joi.number().min(0).default(0),
  taxAmount:      Joi.number().min(0).default(0),
  notes:          Joi.string().trim().max(500).allow('').optional(),
  purchaseDate:   Joi.date().iso().optional(),
  items:          Joi.array().items(purchaseItemSchema).min(1).required(),
});

const updatePurchaseStatusSchema = Joi.object({
  status: Joi.string().valid(...PURCHASE_STATUSES).required(),
  notes:  Joi.string().trim().max(500).allow('').optional(),
});

module.exports = { createPurchaseSchema, updatePurchaseStatusSchema };
