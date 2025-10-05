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

export const validatePaymentId = (req, res, next) => {
  const { id } = req.params;

  if (!id || id.length < 10) {
    return res.status(400).json({
      success: false,
      messages: "Invalid payment ID format"
    })
  }
  next();
}

export const validatePaymentReference = (req, res, next) => {
  const { reference } = req.params;

  if (!reference || !/^[A-Z0-9_-]+$/i.test(reference)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment reference format'
    })
  }
  next();
}