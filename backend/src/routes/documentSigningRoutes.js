const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadPDF } = require('../middleware/pdfUpload');
const {
  signDocument,
  signFieldCryptographic,
  verifySignatureCryptographic,
  getDocumentSignatures,
  verifyDocument,
  getSignatureDetails,
  revokeSignature,
  getUserDocuments,
  getAssignedDocuments,
  uploadDocument,
  getDocument,
  getDocumentPreview,
  getDocumentPreviewForSigning,
  updateFields,
  publishDocument,
  getDocumentForSigning,
  submitSignedField
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
 * GET /api/documents
 * Retrieve all documents for the authenticated user
 * 
 * @response {
 *   success: boolean,
 *   documents: [{
 *     _id: ObjectId,
 *     name: string,
 *     owner_id: ObjectId,
 *     signers: array,
 *     status: string,
 *     created_at: Date,
 *     updated_at: Date
 *   }],
 *   count: number
 * }
 * 
 * @access Private
 */
router.get('/', verifyToken, getUserDocuments);

/**
 * GET /api/documents/assigned
 * Retrieve documents assigned to the current user for signing
 * 
 * @response {
 *   success: boolean,
 *   documents: [{
 *     _id: ObjectId,
 *     title: string,
 *     owner_id: ObjectId,
 *     status: string,
 *     signingStatus: string (pending/signed),
 *     progress: number (0-100),
 *     signedFields: number,
 *     totalFields: number,
 *     created_at: Date,
 *     lastEditedAt: Date
 *   }],
 *   count: number
 * }
 * 
 * @access Private
 */
router.get('/assigned', verifyToken, getAssignedDocuments);

/**
 * POST /api/documents/upload
 * Upload a new document
 * 
 * @body {
 *   document: File (multipart/form-data),
 *   title: string,
 *   description: string (optional)
 * }
 * 
 * @response {
 *   success: boolean,
 *   message: string,
 *   document: {
 *     _id: ObjectId,
 *     name: string,
 *     status: string,
 *     created_at: Date
 *   }
 * }
 * 
 * @access Private
 */
router.post('/upload', verifyToken, uploadPDF.single('document'), uploadDocument);

/**
 * GET /api/documents/:documentId/preview/:signingToken
 * Retrieve document with PDF file data as base64 using signing token
 * Used by PDF viewer to load and display documents for recipients
 * Validates signing token and returns full file data for rendering
 * No ownership check required - uses token-based access control
 * 
 * @params {
 *   documentId: string (ObjectId),
 *   signingToken: string (JWT token)
 * }
 * 
 * @response {
 *   success: boolean,
 *   document: {
 *     _id: ObjectId,
 *     title: string,
 *     description: string,
 *     owner_id: ObjectId,
 *     file_url: string,
 *     fileData: string (base64 encoded PDF),
 *     original_filename: string,
 *     file_type: string,
 *     file_size: number,
 *     status: string,
 *     fields: array,
 *     created_at: Date,
 *     updated_at: Date
 *   }
 * }
 * 
 * @access Public (token-based)
 */
router.get('/:documentId/preview/:signingToken', getDocumentPreviewForSigning);

/**
 * GET /api/documents/:documentId/preview
 * Retrieve document with PDF file data as base64
 * Used by PDF viewer to load and display the document
 * Checks ownership and returns full file data for rendering
 * 
 * @params {
 *   documentId: string (ObjectId)
 * }
 * 
 * @response {
 *   success: boolean,
 *   document: {
 *     _id: ObjectId,
 *     title: string,
 *     description: string,
 *     owner_id: ObjectId,
 *     file_url: string,
 *     fileData: string (base64 encoded PDF),
 *     original_filename: string,
 *     file_type: string,
 *     file_size: number,
 *     status: string,
 *     fields: array,
 *     signers: array,
 *     created_at: Date,
 *     updated_at: Date
 *   }
 * }
 * 
 * @access Private
 * @security Requires document ownership
 */
router.get('/:documentId/preview', verifyToken, getDocumentPreview);

/**
 * GET /api/documents/:documentId
 * Retrieve a single document by ID with full details
 * Checks ownership and returns document metadata and file URL
 * 
 * @params {
 *   documentId: string (ObjectId)
 * }
 * 
 * @response {
 *   success: boolean,
 *   document: {
 *     _id: ObjectId,
 *     title: string,
 *     description: string,
 *     owner_id: ObjectId,
 *     file_url: string,
 *     original_filename: string,
 *     file_type: string,
 *     file_size: number,
 *     status: string,
 *     fields: array,
 *     signers: array,
 *     created_at: Date,
 *     updated_at: Date
 *   }
 * }
 * 
 * @access Private
 * @security Requires document ownership
 */
router.get('/:documentId', verifyToken, getDocument);

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
  verifyToken,
  validateDocumentId,
  validateSignDocument,
  signDocument
);

/**
 * POST /api/documents/:documentId/sign-field
 * Phase 8.3.2: Sign a document field with RSA cryptographic signature
 * 
 * @body {
 *   fieldContent: string (field value to sign),
 *   fieldId: string (field identifier),
 *   password: string (user password for private key decryption)
 * }
 * 
 * @response {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     signature_id: ObjectId,
 *     document_id: ObjectId,
 *     field_id: string,
 *     signer_id: ObjectId,
 *     signer_name: string,
 *     signer_email: string,
 *     algorithm: string ('RSA-SHA256'),
 *     verified: boolean,
 *     content_hash: string (SHA-256),
 *     signature_hash: string (SHA-256),
 *     timestamp: Date
 *   }
 * }
 * 
 * @access Private
 */
router.post(
  '/:documentId/sign-field',
  verifyToken,
  validateDocumentId,
  signFieldCryptographic
);

/**
 * POST /api/documents/:documentId/verify-signature
 * Phase 8.3.2: Verify a cryptographic signature against document content
 * Detects tampering by comparing hashes
 * 
 * @body {
 *   signatureId: string (signature to verify),
 *   fieldContent: string (field content to verify against)
 * }
 * 
 * @response {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     signature_id: ObjectId,
 *     is_valid: boolean (signature is valid AND content matches),
 *     signature_valid: boolean (RSA signature is mathematically valid),
 *     content_matches: boolean (content hash matches),
 *     tampering_detected: boolean (content was modified),
 *     reason: string (explanation),
 *     algorithm: string,
 *     signer_name: string,
 *     signer_email: string,
 *     signed_at: Date,
 *     verified_at: Date
 *   }
 * }
 * 
 * @access Private
 */
router.post(
  '/:documentId/verify-signature',
  verifyToken,
  validateDocumentId,
  verifySignatureCryptographic
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
  verifyToken,
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
  verifyToken,
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
  verifyToken,
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
  verifyToken,
  validateDocumentId,
  revokeSignature
);

/**
 * PUT /api/documents/:documentId/fields
 * Update document fields placement and metadata
 * 
 * @params {
 *   documentId: string (ObjectId)
 * }
 * 
 * @body {
 *   fields: array,
 *   lastEditedAt: Date (optional)
 * }
 * 
 * @response {
 *   success: boolean,
 *   message: string,
 *   document: {
 *     _id: ObjectId,
 *     fields: array,
 *     lastEditedAt: Date
 *   }
 * }
 * 
 * @access Private
 * @security Requires document ownership
 */
router.put(
  '/:documentId/fields',
  verifyToken,
  validateDocumentId,
  updateFields
);

/**
 * POST /api/documents/:documentId/publish
 * Publish document for signing - sends invitations to recipients
 * 
 * @params {
 *   documentId: string (ObjectId)
 * }
 * 
 * @response {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     documentId: ObjectId,
 *     title: string,
 *     status: string,
 *     recipientCount: number,
 *     recipients: array,
 *     emailResults: array,
 *     publishedAt: Date
 *   }
 * }
 * 
 * @access Private
 * @security Requires document ownership
 */
router.post(
  '/:documentId/publish',
  verifyToken,
  validateDocumentId,
  publishDocument
);

/**
 * GET /api/documents/:documentId/sign/:signingToken
 * Get document for signing by recipient using signing token
 * 
 * @params {
 *   documentId: string (ObjectId),
 *   signingToken: string (JWT token)
 * }
 * 
 * @response {
 *   success: boolean,
 *   data: {
 *     document: { ... with filtered fields },
 *     recipient: { email, name },
 *     signingStatus: string,
 *     signingToken: string
 *   }
 * }
 * 
 * @access Public (token-based, no authentication required)
 */
router.get(
  '/:documentId/sign/:signingToken',
  getDocumentForSigning
);

/**
 * POST /api/documents/:documentId/sign/:signingToken
 * Submit a signed field for a document
 * 
 * @params {
 *   documentId: string (ObjectId),
 *   signingToken: string (JWT token)
 * }
 * 
 * @body {
 *   fieldId: string,
 *   fieldValue: string (base64 for images, text for text fields),
 *   allFieldsSigned: boolean
 * }
 * 
 * @response {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     documentId: ObjectId,
 *     fieldId: string,
 *     recipientEmail: string,
 *     status: string,
 *     signingComplete: boolean
 *   }
 * }
 * 
 * @access Public (token-based, no authentication required)
 */
router.post(
  '/:documentId/sign/:signingToken',
  submitSignedField
);

module.exports = router;

