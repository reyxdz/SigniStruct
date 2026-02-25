const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const verificationController = require('../controllers/verificationController');

/**
 * Verification Routes
 * All routes require authentication
 * POST /api/verification/documents/:documentId/verify
 * GET  /api/verification/documents/:documentId/status
 * GET  /api/verification/documents/:documentId/history
 * GET  /api/verification/signatures/:signatureId
 * GET  /api/verification/signatures/:signatureId/audit-trail
 * POST /api/verification/signatures/:signatureId/revoke
 */

// Require authentication for all verification routes
router.use(authMiddleware);

// GET /api/verification/documents/:documentId/status
// Get verification status for a document
router.get(
  '/documents/:documentId/status',
  verificationController.getDocumentVerificationStatus
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
