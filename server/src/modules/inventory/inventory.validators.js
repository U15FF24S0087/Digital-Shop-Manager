const Joi = require('joi');
const { MOVEMENT_TYPES } = require('./inventoryMovement.model');

// Manual stock adjustment types (excludes sale/purchase — those are automatic)
const MANUAL_TYPES = MOVEMENT_TYPES.filter((t) => !['sale', 'purchase'].includes(t));

const adjustStockSchema = Joi.object({
  product:        Joi.string().hex().length(24).required(),
  type:           Joi.string().valid(...MANUAL_TYPES).required(),
  quantityChange: Joi.number().integer().not(0).required()
    .messages({ 'any.invalid': 'quantityChange cannot be zero' }),
  notes:          Joi.string().trim().max(500).allow('').optional(),
});

module.exports = { adjustStockSchema };
