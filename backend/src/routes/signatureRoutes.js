const express = require('express');
const { body } = require('express-validator');
const SignatureController = require('../controllers/signatureController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Signature Routes
 * All routes require authentication
 */

// Middleware: Verify token on all routes
router.use(verifyToken);

/**
 * POST /api/signatures/create
 * Create or upload a new signature
 * Body: { signature_image (Base64), signature_type (handwritten|uploaded|printed) }
 */
router.post(
  '/create',
  [
    body('signature_image')
      .notEmpty()
      .withMessage('Signature image is required')
      .isString()
      .withMessage('Signature image must be a string (Base64)'),
    body('signature_type')
      .notEmpty()
      .withMessage('Signature type is required')
      .isIn(['handwritten', 'uploaded', 'printed'])
      .withMessage('Signature type must be handwritten, uploaded, or printed')
  ],
  SignatureController.createSignature
);

/**
 * GET /api/signatures/user
 * Get all signatures for authenticated user
 */
router.get('/user', SignatureController.getUserSignatures);

/**
 * GET /api/signatures/default
 * Get user's default signature
 */
router.get('/default', SignatureController.getDefaultSignature);

/**
 * GET /api/signatures/:signatureId
 * Get a specific signature
 */
router.get('/:signatureId', SignatureController.getSignatureById);

/**
 * PUT /api/signatures/:signatureId/set-default
 * Set a signature as the default
 */
router.put('/:signatureId/set-default', SignatureController.setDefaultSignature);

/**
 * DELETE /api/signatures/:signatureId
 * Delete a signature
 */
router.delete('/:signatureId', SignatureController.deleteSignature);

module.exports = router;
