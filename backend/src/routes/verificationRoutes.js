const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const verificationController = require('../controllers/verificationController');

/**
 * Verification Routes
 * All routes require authentication
 * GET  /api/verification/documents/:documentId/status
 * POST /api/verification/documents/:documentId/verify-all
 * GET  /api/verification/documents/:documentId/certificate
 * GET  /api/verification/documents/:documentId/history
 * GET  /api/verification/signatures/:signatureId
 * GET  /api/verification/signatures/:signatureId/audit-trail
 * POST /api/verification/signatures/:signatureId/revoke
 */

// Require authentication for all verification routes
router.use(verifyToken);

// GET /api/verification/documents/:documentId/status
// Get verification status for a document
router.get(
  '/documents/:documentId/status',
  verificationController.getDocumentVerificationStatus
);

// POST /api/verification/documents/:documentId/verify-all
// Trigger full verification and store results
router.post(
  '/documents/:documentId/verify-all',
  verificationController.verifyAllSignatures
);

// GET /api/verification/documents/:documentId/certificate
// Download verification certificate as JSON
router.get(
  '/documents/:documentId/certificate',
  verificationController.getDocumentVerificationCertificate
);

// GET /api/verification/documents/:documentId/history
// Get verification history for a document
router.get(
  '/documents/:documentId/history',
  verificationController.getDocumentVerificationHistory
);

// GET /api/verification/signatures/:signatureId
// Verify a single signature
router.get(
  '/signatures/:signatureId',
  verificationController.verifySignature
);

// GET /api/verification/signatures/:signatureId/audit-trail
// Get audit trail for a signature
router.get(
  '/signatures/:signatureId/audit-trail',
  verificationController.getSignatureAuditTrail
);

// POST /api/verification/signatures/:signatureId/revoke
// Revoke certificate for a signature
router.post(
  '/signatures/:signatureId/revoke',
  verificationController.revokeSignatureCertificate
);

module.exports = router;
