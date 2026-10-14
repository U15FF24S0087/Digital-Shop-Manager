const Joi = require('joi');

const createProductSchema = Joi.object({
  name:              Joi.string().trim().min(2).max(200).required(),
  sku:               Joi.string().trim().min(1).max(50).required(),
  barcode:           Joi.string().trim().max(100).allow('').optional(),
  description:       Joi.string().trim().max(1000).allow('').optional(),
  imageUrl:          Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(2048).allow('').optional(),
  category:          Joi.string().hex().length(24).required(),
  price:             Joi.number().min(0).required(),
  cost:              Joi.number().min(0).required(),
  stock:             Joi.number().integer().min(0).default(0),
  lowStockThreshold: Joi.number().integer().min(0).default(10),
  unit:              Joi.string().trim().max(20).default('pcs'),
  supplier:          Joi.string().hex().length(24).allow(null, '').optional(),
  isActive:          Joi.boolean().optional(),
});

const updateProductSchema = Joi.object({
  name:              Joi.string().trim().min(2).max(200).optional(),
  sku:               Joi.string().trim().min(1).max(50).optional(),
  barcode:           Joi.string().trim().max(100).allow('').optional(),
  description:       Joi.string().trim().max(1000).allow('').optional(),
  imageUrl:          Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(2048).allow('').optional(),
  category:          Joi.string().hex().length(24).optional(),
  price:             Joi.number().min(0).optional(),
  cost:              Joi.number().min(0).optional(),
  lowStockThreshold: Joi.number().integer().min(0).optional(),
  unit:              Joi.string().trim().max(20).optional(),
  supplier:          Joi.string().hex().length(24).allow(null, '').optional(),
  isActive:          Joi.boolean().optional(),
  stock:             Joi.forbidden(),
}).min(1);

const productQuerySchema = Joi.object({
  page:        Joi.number().integer().min(1).default(1),
  limit:       Joi.number().integer().min(1).max(100).default(20),
  search:      Joi.string().trim().allow(''),
  category:    Joi.string().hex().length(24),
  supplier:    Joi.string().hex().length(24),
  isActive:    Joi.boolean(),
  stockStatus: Joi.string().valid('out_of_stock', 'low_stock', 'in_stock'),
  lowStock:    Joi.boolean(),
  minPrice:    Joi.number().min(0),
  maxPrice:    Joi.number().min(0),
  sortBy:      Joi.string().valid('name', 'price', 'cost', 'stock', 'createdAt', 'updatedAt').default('createdAt'),
  order:       Joi.string().valid('asc', 'desc').default('desc'),
});

module.exports = { createProductSchema, updateProductSchema, productQuerySchema };
