import Joi from 'joi';

export const createEventSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Event title is required',
      'string.max': 'Event title must not exceed 255 characters',
      'any.required': 'Event title is required'
    }),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description must not exceed 2000 characters'
    }),

  event_date: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.base': 'Event date must be a valid date',
      'date.format': 'Event date must be in ISO format',
      'date.min': 'Event date must be in the future',
      'any.required': 'Event date is required'
    }),

  event_end_date: Joi.date()
    .iso()
    .min(Joi.ref('event_date'))
    .optional()
    .messages({
      'date.base': 'Event end date must be a valid date',
      'date.format': 'Event end date must be in ISO format',
      'date.min': 'Event end date must be after the event start date'
    }),

  location: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Location must not exceed 500 characters'
    }),

  event_type: Joi.string()
    .valid('public', 'private')
    .default('public')
    .messages({
      'any.only': 'Event type must be either "public" or "private"'
    }),

  tag_ids: Joi.array()
    .items(Joi.number().integer().positive())
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags can be assigned to an event',
      'number.base': 'Tag ID must be a number',
      'number.integer': 'Tag ID must be an integer',
      'number.positive': 'Tag ID must be a positive number'
    })
});

export const updateEventSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .optional()
    .messages({
      'string.min': 'Event title is required',
      'string.max': 'Event title must not exceed 255 characters'
    }),

  description: Joi.string()
    .trim()
    .max(2000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description must not exceed 2000 characters'
    }),

  event_date: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Event date must be a valid date',
      'date.format': 'Event date must be in ISO format'
    }),

  event_end_date: Joi.date()
    .iso()
    .when('event_date', {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref('event_date')),
      otherwise: Joi.date()
    })
    .optional()
    .messages({
      'date.base': 'Event end date must be a valid date',
      'date.format': 'Event end date must be in ISO format',
      'date.min': 'Event end date must be after the event start date'
    }),

  location: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Location must not exceed 500 characters'
    }),

  event_type: Joi.string()
    .valid('public', 'private')
    .optional()
    .messages({
      'any.only': 'Event type must be either "public" or "private"'
    }),

  tag_ids: Joi.array()
    .items(Joi.number().integer().positive())
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags can be assigned to an event',
      'number.base': 'Tag ID must be a number',
      'number.integer': 'Tag ID must be an integer',
      'number.positive': 'Tag ID must be a positive number'
    })
});

export const eventQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    }),

  search: Joi.string()
    .trim()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Search query must not exceed 255 characters'
    }),

  tag_ids: Joi.string()
    .pattern(/^\d+(,\d+)*$/)
    .optional()
    .messages({
      'string.pattern.base': 'Tag IDs must be comma-separated numbers'
    }),

  event_type: Joi.string()
    .valid('public', 'private')
    .optional()
    .messages({
      'any.only': 'Event type must be either "public" or "private"'
    }),

  upcoming: Joi.boolean()
    .optional(),

  past: Joi.boolean()
    .optional(),

  sort_by: Joi.string()
    .valid('event_date', 'created_at', 'title')
    .optional()
    .messages({
      'any.only': 'Sort by must be one of: event_date, created_at, title'
    }),

  sort_order: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .messages({
      'any.only': 'Sort order must be either "asc" or "desc"'
    })
});