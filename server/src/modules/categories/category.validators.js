const Joi = require('joi');

const imageUrl = Joi.string()
  .trim()
  .uri({ scheme: ['http', 'https'] })
  .max(2048)
  .allow('');

const createCategorySchema = Joi.object({
  name:        Joi.string().trim().min(2).max(100).required(),
  slug:        Joi.string().trim().min(1).max(120).optional(),
  description: Joi.string().trim().max(500).allow('').optional(),
  imageUrl:    imageUrl.optional(),
  isActive:    Joi.boolean().optional(),
});

const updateCategorySchema = Joi.object({
  name:        Joi.string().trim().min(2).max(100).optional(),
  slug:        Joi.string().trim().min(1).max(120).optional(),
  description: Joi.string().trim().max(500).allow('').optional(),
  imageUrl:    imageUrl.optional(),
  isActive:    Joi.boolean().optional(),
}).min(1);

const categoryQuerySchema = Joi.object({
  page:    Joi.number().integer().min(1).default(1),
  limit:   Joi.number().integer().min(1).max(100).default(20),
  search:  Joi.string().trim().allow('').default(''),
  isActive: Joi.boolean(),
  sortBy:  Joi.string().valid('name', 'createdAt').default('name'),
  order:   Joi.string().valid('asc', 'desc').default('asc'),
});

const categoryProductsQuerySchema = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow('').default(''),
  sortBy: Joi.string().valid('name', 'price', 'stock', 'createdAt').default('name'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
});

const categoryIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const deleteCategoryQuerySchema = Joi.object({
  reassignTo: Joi.string().hex().length(24),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
  categoryProductsQuerySchema,
  categoryIdSchema,
  deleteCategoryQuerySchema,
};
