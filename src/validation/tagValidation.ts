import Joi from 'joi';

export const createTagSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Tag name is required',
      'string.max': 'Tag name must not exceed 100 characters',
      'any.required': 'Tag name is required'
    }),

  color: Joi.string()
    .pattern(/^#[0-9A-F]{6}$/i)
    .optional()
    .messages({
      'string.pattern.base': 'Color must be a valid hex color code'
    })
});

export const updateTagSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Tag name cannot be empty',
      'string.max': 'Tag name must not exceed 100 characters'
    }),

  color: Joi.string()
    .pattern(/^#[0-9A-F]{6}$/i)
    .optional()
    .messages({
      'string.pattern.base': 'Color must be a valid hex color code'
    })
});