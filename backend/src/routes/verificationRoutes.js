const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/authMiddleware');
const verificationController = require('../controllers/verificationController');

// Memory storage for verification uploads (no need to persist)
const verifyUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 52428800 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  }
});

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
 * POST /api/verification/verify-uploaded
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

// POST /api/verification/verify-uploaded
// Upload a PDF and verify its embedded SigniStruct signatures
router.post(
  '/verify-uploaded',
  verifyUpload.single('document'),
  verificationController.verifyUploadedDocument
);

module.exports = router;
