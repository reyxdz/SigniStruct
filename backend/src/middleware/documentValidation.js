const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Document Validation Middleware
 * Validates document-related requests (signing, verification)
 */

/**
 * Validate document ID parameter
 * Ensures the documentId is a valid MongoDB ObjectId
 */
exports.validateDocumentId = [
  param('documentId')
    .custom(value => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid document ID format');
      }
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validate sign document request body
 * Ensures:
 * - userSignatureId is a valid ObjectId
 * - placement object has required fields with valid values
 */
exports.validateSignDocument = [
  body('userSignatureId')
    .notEmpty().withMessage('User signature ID is required')
    .custom(value => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user signature ID format');
      }
      return true;
    }),
  
  body('placement')
    .notEmpty().withMessage('Signature placement is required')
    .isObject().withMessage('Placement must be an object'),
  
  body('placement.x')
    .optional({ checkFalsy: false })
    .isInt({ min: 0 }).withMessage('X coordinate must be a non-negative integer'),
  
  body('placement.y')
    .optional({ checkFalsy: false })
    .isInt({ min: 0 }).withMessage('Y coordinate must be a non-negative integer'),
  
  body('placement.width')
    .optional({ checkFalsy: false })
    .isInt({ min: 1 }).withMessage('Width must be a positive integer'),
  
  body('placement.height')
    .optional({ checkFalsy: false })
    .isInt({ min: 1 }).withMessage('Height must be a positive integer'),
  
  body('placement.page')
    .optional({ checkFalsy: false })
    .isInt({ min: 1 }).withMessage('Page number must be a positive integer'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validate signature ID parameter
 * Ensures the signatureId is a valid MongoDB ObjectId
 */
exports.validateSignatureId = [
  param('signatureId')
    .custom(value => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid signature ID format');
      }
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validate verify document request
 * Currently accepts any valid documentId (verified above)
 * Can be extended for additional verification options
 */
exports.validateVerifyDocument = [
  // documentId already validated by validateDocumentId
  (req, res, next) => {
    next();
  }
];
