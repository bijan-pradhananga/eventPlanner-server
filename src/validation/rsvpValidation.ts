import Joi from 'joi';

export const rsvpSchema = Joi.object({
  status: Joi.string()
    .valid('yes', 'no', 'maybe')
    .required()
    .messages({
      'any.only': 'Status must be one of: yes, no, maybe',
      'any.required': 'RSVP status is required',
    }),
});
