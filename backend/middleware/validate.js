const { validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

// Runs after express-validator chains; short-circuits with a 400 listing
// every field-level validation failure.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(
      400,
      'Validation failed',
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  next();
};

module.exports = validate;
