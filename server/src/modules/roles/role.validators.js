const Joi = require('joi');
const { PERMISSIONS } = require('./role.model');

const createRoleSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(50).required(),
  description: Joi.string().trim().max(200).allow('').optional(),
  permissions: Joi.array()
    .items(Joi.string().valid(...PERMISSIONS))
    .default([]),
});

const updateRoleSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(50).optional(),
  description: Joi.string().trim().max(200).allow('').optional(),
  permissions: Joi.array()
    .items(Joi.string().valid(...PERMISSIONS))
    .optional(),
}).min(1);

module.exports = { createRoleSchema, updateRoleSchema };
