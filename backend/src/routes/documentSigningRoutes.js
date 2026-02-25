const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  signDocument,
  getDocumentSignatures,
  verifyDocument,
  getSignatureDetails,
  revokeSignature
} = require('../controllers/documentController');
const {
  validateSignDocument,
  validateDocumentId
} = require('../middleware/documentValidation');

/**
 * Document Signing Routes
 * All routes require authentication
 */

/**
 * POST /api/documents/:documentId/sign
 * Sign a document with user's digital signature
 * 
 * @body {
 *   userSignatureId: ObjectId,
 *   placement: {
 *     x: number,
 *     y: number,
 *     width: number,
 *     height: number,
 *     page: number
 *   }
 * }
 * 
 * @response {
 *   success: boolean,
 *   message: string,
 *   signature: {
 *     _id: ObjectId,
 *     document_id: ObjectId,
 *     signer_id: ObjectId,
 *     signer_name: string,
 *     signer_email: string,
 *     is_valid: boolean,
 *     verification_timestamp: Date,
 *     placement: object
 *   }
 * }
 * 
 * @access Private
 */
router.post(
  '/:documentId/sign',
  authMiddleware,
  validateDocumentId,
  validateSignDocument,
  signDocument
);

/**
 * GET /api/documents/:documentId/signatures
 * Retrieve all signatures on a document
 * Returns signature details with signer information and statistics
 * 
 * @response {
 *   success: boolean,
 *   document: {
 *     _id: ObjectId,
 *     title: string,
 *     status: string,
 *     created_at: Date
 *   },
 *   signatures: [
 *     {
 *       _id: ObjectId,
 *       signer: { _id, name, email },
 *       is_valid: boolean,
 *       verification_timestamp: Date,
 *       placement: object,
 *       created_at: Date
 *     }
 *   ],
 *   statistics: {
 *     total_signatures: number,
 *     valid_signatures: number,
 *     required_signers: number,
 *     signing_complete: boolean
 *   }
 * }
 * 
 * @access Private
 */
router.get(
  '/:documentId/signatures',
  authMiddleware,
  validateDocumentId,
  getDocumentSignatures
);

/**
 * GET /api/documents/:documentId/signatures/:signatureId
 * Get detailed information about a specific signature
 * 
 * @response {
 *   success: boolean,
 *   signature: {
 *     _id: ObjectId,
 *     document_id: ObjectId,
 *     signer: { _id, name, email },
 *     certificate_id: ObjectId,
 *     certificate_valid_from: Date,
 *     certificate_valid_to: Date,
 *     is_valid: boolean,
 *     verification_timestamp: Date,
 *     placement: object,
 *     created_at: Date
 *   }
 * }
 * 
 * @access Private
 */
router.get(
  '/:documentId/signatures/:signatureId',
  authMiddleware,
  validateDocumentId,
  getSignatureDetails
);

/**
 * POST /api/documents/:documentId/verify
 * Verify all signatures on a document
 * Checks signature validity and certificate status
 * 
 * @response {
 *   success: boolean,
 *   verification: {
 *     document_id: ObjectId,
 *     document_title: string,
 *     is_valid: boolean,
 *     total_signatures: number,
 *     valid_signatures: number,
 *     verification_timestamp: Date,
 *     message: string,
 *     signatures: [
 *       {
 *         signature_id: ObjectId,
 *         signer_id: ObjectId,
 *         is_valid: boolean,
 *         signature_valid: boolean,
 *         certificate_valid: boolean,
 *         certificate_status: string
 *       }
 *     ]
 *   }
 * }
 * 
 * @access Private
 */
router.post(
  '/:documentId/verify',
  authMiddleware,
  validateDocumentId,
  verifyDocument
);

/**
 * POST /api/documents/:documentId/signatures/:signatureId/revoke
 * Revoke a signature (mark as invalid)
 * Only the document owner can revoke signatures
 * 
 * @response {
 *   success: boolean,
 *   message: string,
 *   signature: {
 *     _id: ObjectId,
 *     is_valid: boolean,
 *     verification_timestamp: Date
 *   }
 * }
 * 
 * @access Private (document owner only)
 */
router.post(
  '/:documentId/signatures/:signatureId/revoke',
  authMiddleware,
  validateDocumentId,
  revokeSignature
);

module.exports = router;
