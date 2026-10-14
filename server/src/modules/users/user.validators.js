const Joi = require('joi');

const passwordRules = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+])/)
  .messages({
    'string.pattern.base':
      'Password must contain uppercase, lowercase, digit and special character',
  });

const createUserSchema = Joi.object({
  name:     Joi.string().trim().min(2).max(100).required(),
  email:    Joi.string().trim().email().lowercase().required(),
  password: passwordRules.required(),
  phone:    Joi.string().trim().max(30).allow('').optional(),
  role:     Joi.string().hex().length(24).required(),
  isActive: Joi.boolean().optional(),
});

const updateUserSchema = Joi.object({
  name:     Joi.string().trim().min(2).max(100).optional(),
  phone:    Joi.string().trim().max(30).allow('').optional(),
  role:     Joi.string().hex().length(24).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const adminResetPasswordSchema = Joi.object({
  newPassword: passwordRules.required(),
});

module.exports = { createUserSchema, updateUserSchema, adminResetPasswordSchema };
