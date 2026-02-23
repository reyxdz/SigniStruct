const { validationResult, body, param } = require('express-validator');

/**
 * Certificate Validation Middleware
 * Validates certificate-related requests
 */

// Validation rules for certificate generation
exports.validateGenerateCertificate = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must provide a valid email address'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('validityYears')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Validity years must be between 1 and 30'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }
    next();
  }
];

// Validation for user ID parameter
exports.validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }
    next();
  }
];

// Validation for certificate ID parameter
exports.validateCertificateId = [
  param('certificateId')
    .notEmpty()
    .withMessage('Certificate ID is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }
    next();
  }
];

// Validation for certificate revocation
exports.validateRevokeCertificate = [
  body('certificateId')
    .notEmpty()
    .withMessage('Certificate ID is required'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }
    next();
  }
];

// Generic validation error handler
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};
