const express = require('express');
const router = express.Router();
const signingRequestController = require('../controllers/signingRequestController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route - get signing request by share token (no auth required)
router.get('/share/:token', signingRequestController.getRequestByToken.bind(signingRequestController));

// Protected routes - require authentication
router.use(authMiddleware);

/**
 * POST /api/signing-requests/documents/:documentId
 * Create a new signing request for a document
 * Body: { recipient_email, expiration_date, message? }
 * Returns: { request_id, recipient_email, status, expiration_date, share_link }
 */
router.post(
  '/documents/:documentId',
  signingRequestController.createSigningRequest.bind(signingRequestController)
);

/**
 * GET /api/signing-requests/documents/:documentId
 * Get all signing requests for a document (owner only)
 * Returns: { requests: [], total }
 */
router.get(
  '/documents/:documentId',
  signingRequestController.getDocumentRequests.bind(signingRequestController)
);

/**
 * GET /api/signing-requests/documents/:documentId/stats
 * Get request statistics for a document (owner only)
 * Returns: { total, pending, accepted, declined, expired, revoked, completion_percentage }
 */
router.get(
  '/documents/:documentId/stats',
  signingRequestController.getStatistics.bind(signingRequestController)
);

/**
 * GET /api/signing-requests/my-requests
 * Get all signing requests for authenticated user (as recipient)
 * Returns: { requests: [], total }
 */
router.get(
  '/my-requests',
  signingRequestController.getRecipientRequests.bind(signingRequestController)
);

/**
 * POST /api/signing-requests/:requestId/accept
 * Accept a signing request
 * Returns: { request_id, status, accepted_at, document_id }
 */
router.post(
  '/:requestId/accept',
  signingRequestController.acceptRequest.bind(signingRequestController)
);

/**
 * POST /api/signing-requests/:requestId/decline
 * Decline a signing request
 * Body: { reason? }
 * Returns: { request_id, status, declined_at, reason }
 */
router.post(
  '/:requestId/decline',
  signingRequestController.declineRequest.bind(signingRequestController)
);

/**
 * POST /api/signing-requests/:requestId/revoke
 * Revoke a signing request (sender only)
 * Returns: { request_id, status, recipient_email }
 */
router.post(
  '/:requestId/revoke',
  signingRequestController.revokeRequest.bind(signingRequestController)
);

/**
 * POST /api/signing-requests/:requestId/remind
 * Send reminder for pending signing request (sender only)
 * Returns: { request_id, reminder_count, last_sent_at, recipient_email }
 */
router.post(
  '/:requestId/remind',
  signingRequestController.sendReminder.bind(signingRequestController)
);

module.exports = router;
