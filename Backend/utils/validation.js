import Joi from 'joi';

export const validatePaymentData = (req, res, next) => {
  const schema = Joi.object({
    amount: Joi.number().positive().required().messages({
      'number.positive': 'Amount must be a positive number',
      'any.required': 'Amount is required'
    }),
    currency: Joi.string().valid('NGN', 'USD', 'GHS', 'KES').default('NGN'),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    metadata: Joi.object().optional()
  });

  // Configure validation to return all errors
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map(detail => detail.message)
    });
  }

  req.body = value;
  next();
};