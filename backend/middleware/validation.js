const Joi = require('joi');

// Validation schemas
const schemas = {
  person: Joi.object({
    first_name: Joi.string().min(1).max(100).required(),
    last_name: Joi.string().max(100).allow(''),
    email: Joi.string().email().required(),
    dob: Joi.date().allow(null),
    anniversary_date: Joi.date().allow(null),
    timezone: Joi.string().default('UTC'),
    consent_email: Joi.boolean().default(false),
    tags: Joi.array().items(Joi.string()).default([])
  }),

  template: Joi.object({
    name: Joi.string().min(1).max(150).required(),
    type: Joi.string().valid('birthday', 'anniversary', 'greeting', 'invitation').required(),
    age_group: Joi.string().valid('8_15', '15_18', '18_plus', 'na').default('na'),
    html: Joi.string().required(),
    preview_url: Joi.string().uri().allow(''),
    is_active: Joi.boolean().default(true)
  }),

  campaign: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    type: Joi.string().valid('birthday', 'anniversary', 'greeting', 'invitation').required(),
    template_id: Joi.string().uuid().required(),
    audience_query: Joi.object().default({}),
    channel: Joi.string().valid('app', 'gmail', 'both').default('gmail'),
    scheduled_at: Joi.date().allow(null),
    created_by: Joi.string().uuid().allow(null)
  })
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }
    req.body = value;
    next();
  };
};

module.exports = {
  schemas,
  validate
};
