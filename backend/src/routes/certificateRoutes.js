const express = require('express');
const router = express.Router();
const {
  generateCertificate,
  getUserCertificate,
  verifyCertificate,
  revokeCertificate,
  getAllUserCertificates,
  downloadCertificate,
  getCertificateExpiryStatus,
  renewCertificate,
  getCertificateAuditHistory
} = require('../controllers/certificateController');
const { verifyToken } = require('../middleware/authMiddleware');
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
  verifyToken,
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
  verifyToken,
  validateUserId,
  getUserCertificate
);

/**
 * GET /api/certificates/my-certificate
 * Retrieve the current user's active certificate
 * Convenience endpoint for authenticated users
 * @access Private
 */
router.get(
  '/my-certificate',
  verifyToken,
  (req, res, next) => {
    // Set userId to current user and pass to getUserCertificate
    req.params.userId = req.user.id;
    next();
  },
  getUserCertificate
);

/**
 * GET /api/certificates/user/:userId/all
 * Retrieve all certificates (active and revoked) for a user
 * @access Private
 */
router.get(
  '/user/:userId/all',
  verifyToken,
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
  verifyToken,
  validateRevokeCertificate,
  revokeCertificate
);

/**
 * GET /api/certificates/:certificateId/download
 * Download certificate in PEM format
 * @access Private
 */
router.get(
  '/:certificateId/download',
  verifyToken,
  downloadCertificate
);

/**
 * GET /api/certificates/:certificateId/expiry-status
 * Get certificate expiry status and days remaining
 * @access Private
 */
router.get(
  '/:certificateId/expiry-status',
  verifyToken,
  getCertificateExpiryStatus
);

/**
 * POST /api/certificates/:certificateId/renew
 * Renew a certificate with new keys or same keys
 * @access Private
 */
router.post(
  '/:certificateId/renew',
  verifyToken,
  renewCertificate
);

/**
 * GET /api/certificates/:certificateId/audit-history
 * Get audit history of certificate operations
 * @access Private
 */
router.get(
  '/:certificateId/audit-history',
  verifyToken,
  getCertificateAuditHistory
);

module.exports = router;

