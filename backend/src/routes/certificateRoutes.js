const express = require('express');
const router = express.Router();
const {
  generateCertificate,
  getUserCertificate,
  verifyCertificate,
  revokeCertificate,
  getAllUserCertificates
} = require('../controllers/certificateController');
const authMiddleware = require('../middleware/authMiddleware');
const {
  validateGenerateCertificate,
  validateUserId,
  validateCertificateId,
  validateRevokeCertificate
} = require('../middleware/certificateValidation');

/**
 * POST /api/certificates/generate
 * Generate a new certificate for the authenticated user
 * @access Private
 */
router.post(
  '/generate',
  authMiddleware,
  validateGenerateCertificate,
  generateCertificate
);

/**
 * GET /api/certificates/user/:userId
 * Retrieve the active certificate for a user
 * @access Private
 */
router.get(
  '/user/:userId',
  authMiddleware,
  validateUserId,
  getUserCertificate
);

/**
 * GET /api/certificates/user/:userId/all
 * Retrieve all certificates (active and revoked) for a user
 * @access Private
 */
router.get(
  '/user/:userId/all',
  authMiddleware,
  validateUserId,
  getAllUserCertificates
);

/**
 * GET /api/certificates/verify/:certificateId
 * Verify a certificate by its ID
 * @access Public
 */
router.get(
  '/verify/:certificateId',
  validateCertificateId,
  verifyCertificate
);

/**
 * POST /api/certificates/revoke
 * Revoke a certificate
 * @access Private
 */
router.post(
  '/revoke',
  authMiddleware,
  validateRevokeCertificate,
  revokeCertificate
);

module.exports = router;
