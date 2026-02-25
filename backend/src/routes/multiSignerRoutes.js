const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const multiSignerController = require('../controllers/multiSignerController');

/**
 * Multi-Signer Routes
 * All routes require authentication
 * POST   /api/multi-signer/documents/:documentId/signers
 * GET    /api/multi-signer/documents/:documentId/workflow
 * GET    /api/multi-signer/documents/:documentId/signers
 * POST   /api/multi-signer/documents/:documentId/signers/:signerId/sign
 * POST   /api/multi-signer/documents/:documentId/signers/:signerId/decline
 * POST   /api/multi-signer/documents/:documentId/signers/:signerId/comments
 * GET    /api/multi-signer/documents/:documentId/comments
 * POST   /api/multi-signer/documents/:documentId/send-reminders
 */

// Require authentication for all multi-signer routes
router.use(verifyToken);

// POST /api/multi-signer/documents/:documentId/signers
// Add signers to a document with sequential or parallel signing
router.post(
  '/documents/:documentId/signers',
  multiSignerController.addSignersToDocument
);

// GET /api/multi-signer/documents/:documentId/workflow
// Get current signing workflow status
router.get(
  '/documents/:documentId/workflow',
  multiSignerController.getSigningWorkflowStatus
);

// GET /api/multi-signer/documents/:documentId/signers
// Get all signers for a document
router.get(
  '/documents/:documentId/signers',
  multiSignerController.getDocumentSigners
);

// POST /api/multi-signer/documents/:documentId/signers/:signerId/sign
// Record that a signer has signed
router.post(
  '/documents/:documentId/signers/:signerId/sign',
  multiSignerController.recordSignerSignature
);

// POST /api/multi-signer/documents/:documentId/signers/:signerId/decline
// Decline to sign a document
router.post(
  '/documents/:documentId/signers/:signerId/decline',
  multiSignerController.declineSignature
);

// POST /api/multi-signer/documents/:documentId/signers/:signerId/comments
// Add comment or signing request
router.post(
  '/documents/:documentId/signers/:signerId/comments',
  multiSignerController.addSignerComment
);

// GET /api/multi-signer/documents/:documentId/comments
// Get all comments for a document
router.get(
  '/documents/:documentId/comments',
  multiSignerController.getDocumentComments
);

// POST /api/multi-signer/documents/:documentId/send-reminders
// Send reminders to pending signers
router.post(
  '/documents/:documentId/send-reminders',
  multiSignerController.sendReminders
);

module.exports = router;
