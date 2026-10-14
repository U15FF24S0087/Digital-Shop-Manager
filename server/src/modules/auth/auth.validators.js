const Joi = require('joi');

const passwordRules = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+])/)
  .messages({
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
  });

const registerSchema = Joi.object({
  name:     Joi.string().trim().min(2).max(100).required(),
  email:    Joi.string().trim().email().lowercase().required(),
  password: passwordRules.required(),
  phone:    Joi.string().trim().max(30).allow('').optional(),
  role:     Joi.string().hex().length(24).optional(), // ObjectId — only Admins send this
});

const loginSchema = Joi.object({
  email:    Joi.string().trim().email().lowercase().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     passwordRules.required(),
});

const updateProfileSchema = Joi.object({
  name:  Joi.string().trim().min(2).max(100).optional(),
  phone: Joi.string().trim().max(30).allow('').optional(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  refreshTokenSchema,
};
