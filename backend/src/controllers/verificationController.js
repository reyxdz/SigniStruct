const VerificationService = require('../services/verificationService');
const Document = require('../models/Document');
const DocumentSignature = require('../models/DocumentSignature');
const SignatureAuditLog = require('../models/SignatureAuditLog');

/**
 * Verification Controller
 * Handles all signature and document verification endpoints
 * - Document verification status and history
 * - Signature verification and audit trails
 * - Compliance reporting
 */

// GET /api/verification/documents/:documentId/status
// Verify all signatures on a document and return overall status
// Phase 8.1.1 Implementation
exports.getDocumentVerificationStatus = async (req, res) => {
  const startTime = Date.now();
  const requestId = req.requestId || `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    console.log(`[${requestId}] Starting document verification for ${documentId}`);

    // Step 1: Validate document exists
    const document = await Document.findById(documentId);
    if (!document) {
      console.warn(`[${requestId}] Document not found: ${documentId}`);
      return res.status(404).json({
        success: false,
        message: 'Document not found',
        code: 'DOCUMENT_NOT_FOUND',
        requestId
      });
    }

    // Step 2: Verify user has permission to verify this document
    // Owner, admin, or assigned recipients can verify documents
    const isOwner = document.owner_id.toString() === userId;
    const isAdmin = req.user.isAdmin || false;
    
    // Check if user is a recipient assigned to any field in this document
    let isRecipient = false;
    if (document.fields && Array.isArray(document.fields)) {
      isRecipient = document.fields.some(field => {
        if (field.assignedRecipients && Array.isArray(field.assignedRecipients)) {
          console.log(`[${requestId}] Checking ${field.assignedRecipients.length} recipients for field: ${field.label}`);
          return field.assignedRecipients.some(recipient => {
            // Check by recipientId (ObjectId) or recipientEmail
            const matches = 
              (recipient.recipientId && recipient.recipientId.toString() === userId) || 
              (recipient.recipientEmail && recipient.recipientEmail === req.user.email);
            if (matches) {
              console.log(`[${requestId}] ✓ Found matching recipient: ${recipient.recipientEmail || recipient.recipientId}`);
            }
            return matches;
          });
        }
        return false;
      });
    }
    
    console.log(`[${requestId}] Authorization check: isOwner=${isOwner}, isAdmin=${isAdmin}, isRecipient=${isRecipient}`);

    if (!isOwner && !isAdmin && !isRecipient) {
      console.warn(`[${requestId}] Unauthorized verification attempt - User ${userId} (${req.user.email}) tried to verify document ${documentId}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to verify this document',
        code: 'UNAUTHORIZED',
        requestId
      });
    }

    // Step 3: Prepare metadata for verification
    const metadata = {
      requestId,
      userId,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      timestamp: new Date()
    };

    console.log(`[${requestId}] Verification metadata prepared for ${documentId}`);

    // Step 4: Execute document verification using VerificationService
    console.log(`[${requestId}] Calling VerificationService.verifyDocument()`);
    const verificationResult = await VerificationService.verifyDocument(
      documentId,
      metadata
    );

    // Step 5: Calculate verification duration
    const verificationDuration = Date.now() - startTime;

    // Step 6: Enhance response with metadata
    const response = {
      success: true,
      data: {
        ...verificationResult,
        requestId,
        verificationDuration: `${verificationDuration}ms`,
        verifiedAt: new Date().toISOString(),
        verifiedBy: userId
      }
    };

    // Step 7: Log successful verification
    console.log(`[${requestId}] Document verification completed successfully`);
    console.log(`[${requestId}]   - Total Signatures: ${verificationResult.signature_count}`);
    console.log(`[${requestId}]   - Valid Signatures: ${verificationResult.verified_count}`);
    console.log(`[${requestId}]   - Overall Status: ${verificationResult.status}`);
    console.log(`[${requestId}]   - Duration: ${verificationDuration}ms`);

    res.status(200).json(response);

  } catch (error) {
    const verificationDuration = Date.now() - startTime;
    
    console.error(`[${requestId}] Document verification error after ${verificationDuration}ms:`, error);
    console.error(`[${requestId}] Error details:`, {
      message: error.message,
      stack: error.stack.split('\n')[0]
    });

    // Determine appropriate HTTP status code
    let statusCode = 500;
    let errorCode = 'VERIFICATION_ERROR';

    if (error.message.includes('not found')) {
      statusCode = 404;
      errorCode = 'NOT_FOUND';
    } else if (error.message.includes('Unauthorized')) {
      statusCode = 403;
      errorCode = 'UNAUTHORIZED';
    }

    res.status(statusCode).json({
      success: false,
      message: 'Error verifying document',
      code: errorCode,
      requestId,
      verificationDuration: `${verificationDuration}ms`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/verification/documents/:documentId/verify-all
// Trigger full verification and store results
// Phase 8.1.2 Implementation
exports.verifyAllSignatures = async (req, res) => {
  const startTime = Date.now();
  const requestId = req.requestId || `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    console.log(`[${requestId}] Starting full verification for document ${documentId}`);

    // Step 1: Validate document exists and user has permission
    const document = await Document.findById(documentId);
    if (!document) {
      console.warn(`[${requestId}] Document not found: ${documentId}`);
      return res.status(404).json({
        success: false,
        message: 'Document not found',
        code: 'DOCUMENT_NOT_FOUND',
        requestId
      });
    }

    const isOwner = document.owner_id.toString() === userId;
    const isAdmin = req.user.isAdmin || false;
    
    // Check if user is a recipient assigned to any field in this document
    let isRecipient = false;
    if (document.fields && Array.isArray(document.fields)) {
      isRecipient = document.fields.some(field => {
        if (field.assignedRecipients && Array.isArray(field.assignedRecipients)) {
          return field.assignedRecipients.some(recipient => 
            (recipient.recipientId && recipient.recipientId.toString() === userId) || 
            (recipient.recipientEmail && recipient.recipientEmail === req.user.email)
          );
        }
        return false;
      });
    }

    if (!isOwner && !isAdmin && !isRecipient) {
      console.warn(`[${requestId}] Unauthorized - User ${userId} tried to verify document ${documentId}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to verify this document',
        code: 'UNAUTHORIZED',
        requestId
      });
    }

    // Step 2: Prepare metadata
    const metadata = {
      requestId,
      userId,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      timestamp: new Date()
    };

    console.log(`[${requestId}] Full verification started`);

    // Step 3: Run comprehensive document verification
    const verificationResult = await VerificationService.verifyDocument(
      documentId,
      metadata
    );

    console.log(`[${requestId}] Core verification completed`);

    // Step 4: Check for tampering (additional check)
    let tamperingCheck = { tampered: false, details: [] };
    try {
      if (VerificationService.detectTampering) {
        tamperingCheck = await VerificationService.detectTampering(documentId);
        console.log(`[${requestId}] Tampering check completed - Tampered: ${tamperingCheck.tampered}`);
      }
    } catch (tamperError) {
      console.warn(`[${requestId}] Tampering detection not available:`, tamperError.message);
    }

    // Step 5: Create verification record with additional details
    const verificationDuration = Date.now() - startTime;
    
    // Step 6: Log the comprehensive verification
    try {
      await VerificationService.generateAuditLog(
        'DOCUMENT_VERIFIED',
        userId,
        {
          documentId,
          documentTitle: document.title,
          totalSignatures: verificationResult.signature_count,
          validSignatures: verificationResult.verified_count,
          overallResult: verificationResult.is_valid ? 'VALID' : 'INVALID',
          tamperingDetected: tamperingCheck.tampered,
          verificationDuration,
          timestamp: new Date().toISOString()
        },
        metadata
      );
      console.log(`[${requestId}] Audit log created successfully`);
    } catch (logError) {
      console.warn(`[${requestId}] Failed to create audit log:`, logError.message);
      // Continue even if audit log fails
    }

    // Step 7: Prepare comprehensive response
    const response = {
      success: true,
      data: {
        verification: verificationResult,
        tampering: tamperingCheck,
        summary: {
          documentId,
          documentTitle: document.title,
          verifiedAt: new Date().toISOString(),
          verifiedBy: userId,
          totalSignatures: verificationResult.signature_count,
          validSignatures: verificationResult.verified_count,
          overallStatus: verificationResult.is_valid ? 'VERIFIED' : 'VERIFICATION_FAILED',
          tamperingDetected: tamperingCheck.tampered,
          verificationDuration: `${verificationDuration}ms`,
          requestId
        }
      }
    };

    console.log(`[${requestId}] Full verification completed successfully in ${verificationDuration}ms`);

    res.status(200).json(response);

  } catch (error) {
    const verificationDuration = Date.now() - startTime;
    
    console.error(`[${requestId}] Full verification error after ${verificationDuration}ms:`, error);
    console.error(`[${requestId}] Error details:`, {
      message: error.message,
      stack: error.stack.split('\n')[0]
    });

    let statusCode = 500;
    let errorCode = 'VERIFICATION_ERROR';

    if (error.message.includes('not found')) {
      statusCode = 404;
      errorCode = 'NOT_FOUND';
    } else if (error.message.includes('Unauthorized')) {
      statusCode = 403;
      errorCode = 'UNAUTHORIZED';
    }

    res.status(statusCode).json({
      success: false,
      message: 'Error performing full verification',
      code: errorCode,
      requestId,
      verificationDuration: `${verificationDuration}ms`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/verification/documents/:documentId/certificate
// Download verification certificate as JSON
// Phase 8.1.3 Implementation
exports.getDocumentVerificationCertificate = async (req, res) => {
  const startTime = Date.now();
  const requestId = req.requestId || `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { documentId } = req.params;
    const userId = req.user.id;
    const format = req.query.format || 'json';

    console.log(`[${requestId}] Requesting verification certificate for document ${documentId} (format: ${format})`);

    // Step 1: Verify document exists and ownership
    const document = await Document.findById(documentId)
      .populate('owner_id', 'email name');

    if (!document) {
      console.warn(`[${requestId}] Document not found: ${documentId}`);
      return res.status(404).json({
        success: false,
        message: 'Document not found',
        code: 'DOCUMENT_NOT_FOUND',
        requestId
      });
    }

    const isOwner = document.owner_id._id.toString() === userId || document.owner_id.toString() === userId;
    const isAdmin = req.user.isAdmin || false;
    
    // Check if user is a recipient assigned to any field in this document
    let isRecipient = false;
    if (document.fields && Array.isArray(document.fields)) {
      isRecipient = document.fields.some(field => {
        if (field.assignedRecipients && Array.isArray(field.assignedRecipients)) {
          return field.assignedRecipients.some(recipient => 
            (recipient.recipientId && recipient.recipientId.toString() === userId) || 
            (recipient.recipientEmail && recipient.recipientEmail === req.user.email)
          );
        }
        return false;
      });
    }

    if (!isOwner && !isAdmin && !isRecipient) {
      console.warn(`[${requestId}] Unauthorized - User ${userId} tried to download certificate for ${documentId}`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this document',
        code: 'UNAUTHORIZED',
        requestId
      });
    }

    // Step 2: Get all signatures for certificate
    const signatures = await DocumentSignature.find({ document_id: documentId })
      .populate('signer_id', 'email name')
      .populate('certificate_id');

    console.log(`[${requestId}] Found ${signatures.length} signatures`);

    // Step 3: Run verification to get current status
    const metadata = {
      requestId,
      userId,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      timestamp: new Date()
    };

    const verificationResult = await VerificationService.verifyDocument(
      documentId,
      { ...metadata, skipAuditLog: true } // Don't double-log
    );

    console.log(`[${requestId}] Verification completed for certificate generation`);

    // Step 4: Generate certificate data
    const certificate = {
      // Certificate metadata
      type: 'DOCUMENT_VERIFICATION_CERTIFICATE',
      version: '1.0',
      issued_at: new Date().toISOString(),
      valid_from: new Date(Date.now() - 60000).toISOString(), // 1 minute ago or actual sign time
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      
      // Document information
      document: {
        id: document._id.toString(),
        title: document.title,
        owner: {
          id: document.owner_id._id.toString(),
          name: document.owner_id.name,
          email: document.owner_id.email
        },
        created_at: document.createdAt,
        updated_at: document.updatedAt
      },

      // Verification results
      verification: {
        status: verificationResult.is_valid ? 'VALID' : 'INVALID',
        verified_at: new Date().toISOString(),
        verified_by: userId,
        total_signatures: verificationResult.signature_count,
        valid_signatures: verificationResult.verified_count,
        details: verificationResult.details
      },

      // Signature details
      signatures: signatures.map(sig => ({
        id: sig._id.toString(),
        signer: {
          id: sig.signer_id._id.toString(),
          name: sig.signer_id.name,
          email: sig.signer_id.email
        },
        signed_at: sig.signed_at || sig.createdAt,
        status: sig.status,
        field_id: sig.field_id,
        // Don't include actual signature data in certificate
      })),

      // Additional context
      request_id: requestId,
      certificate_duration: `${Date.now() - startTime}ms`
    };

    // Step 5: Handle different formats
    if (format === 'pdf') {
      console.log(`[${requestId}] PDF format requested but not yet implemented`);
      return res.status(202).json({
        success: false,
        message: 'PDF export coming soon',
        code: 'PDF_NOT_IMPLEMENTED',
        requestId
      });
    } else {
      // JSON format (default)
      console.log(`[${requestId}] Returning JSON certificate`);
      
      // Log certificate download
      try {
        await VerificationService.generateAuditLog(
          'CERTIFICATE_DOWNLOADED',
          userId,
          {
            documentId,
            format: 'json',
            timestamp: new Date().toISOString()
          },
          metadata
        );
      } catch (logError) {
        console.warn(`[${requestId}] Failed to log certificate download:`, logError.message);
      }

      res.status(200).json({
        success: true,
        data: certificate,
        format: 'json'
      });
    }

  } catch (error) {
    const verificationDuration = Date.now() - startTime;
    
    console.error(`[${requestId}] Certificate generation error after ${verificationDuration}ms:`, error);
    console.error(`[${requestId}] Error details:`, {
      message: error.message,
      stack: error.stack.split('\n')[0]
    });

    let statusCode = 500;
    let errorCode = 'CERTIFICATE_ERROR';

    if (error.message.includes('not found')) {
      statusCode = 404;
      errorCode = 'NOT_FOUND';
    } else if (error.message.includes('Unauthorized')) {
      statusCode = 403;
      errorCode = 'UNAUTHORIZED';
    }

    res.status(statusCode).json({
      success: false,
      message: 'Error generating verification certificate',
      code: errorCode,
      requestId,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/verification/documents/:documentId/history
// Get verification history for a document
exports.getDocumentVerificationHistory = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    // Verify document ownership
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
        code: 'DOCUMENT_NOT_FOUND'
      });
    }

    if (document.owner_id.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this document',
        code: 'UNAUTHORIZED'
      });
    }

    // Get verification history using VerificationService
    const history = await VerificationService.getVerificationHistory(
      documentId,
      {
        limit: Math.min(parseInt(limit), 100),
        offset: Math.max(parseInt(offset), 0)
      }
    );

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get verification history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving verification history',
      code: 'HISTORY_RETRIEVAL_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/verification/signatures/:signatureId/audit-trail
// Get complete audit trail for a signature
exports.getSignatureAuditTrail = async (req, res) => {
  try {
    const { signatureId } = req.params;
    const userId = req.user.id;

    // Verify signature exists and user has access
    const signature = await DocumentSignature.findById(signatureId)
      .populate('document_id')
      .populate('signer_id', 'email');

    if (!signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found',
        code: 'SIGNATURE_NOT_FOUND'
      });
    }

    const document = signature.document_id;
    if (document.owner_id.toString() !== userId && 
        signature.signer_id._id.toString() !== userId && 
        !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this signature',
        code: 'UNAUTHORIZED'
      });
    }

    // Get audit trail using VerificationService
    const auditTrail = await VerificationService.getSignatureAuditTrail(
      signatureId
    );

    res.status(200).json({
      success: true,
      data: auditTrail
    });
  } catch (error) {
    console.error('Get signature audit trail error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving signature audit trail',
      code: 'AUDIT_TRAIL_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/verification/signatures/:signatureId
// Verify a single signature
exports.verifySignature = async (req, res) => {
  try {
    const { signatureId } = req.params;
    const userId = req.user.id;

    // Verify signature exists and user has access
    const signature = await DocumentSignature.findById(signatureId)
      .populate('document_id')
      .populate('signer_id', 'email');

    if (!signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found',
        code: 'SIGNATURE_NOT_FOUND'
      });
    }

    const document = signature.document_id;
    if (document.owner_id.toString() !== userId && 
        signature.signer_id._id.toString() !== userId && 
        !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to verify this signature',
        code: 'UNAUTHORIZED'
      });
    }

    // Verify signature using VerificationService
    const verificationResult = await VerificationService.verifySignature(
      signatureId,
      {
        requestId: req.requestId,
        userAgent: req.get('user-agent'),
        ipAddress: req.ip
      }
    );

    res.status(200).json({
      success: true,
      data: verificationResult
    });
  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying signature',
      code: 'VERIFICATION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/verification/signatures/:signatureId/revoke
// Revoke a certificate for a signature
exports.revokeSignatureCertificate = async (req, res) => {
  try {
    const { signatureId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    // Verify signature exists and user has access
    const signature = await DocumentSignature.findById(signatureId)
      .populate('signer_id', '_id email');

    if (!signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found',
        code: 'SIGNATURE_NOT_FOUND'
      });
    }

    // Only the signer can revoke their own certificate
    if (signature.signer_id._id.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to revoke this certificate',
        code: 'UNAUTHORIZED'
      });
    }

    // Revoke certificate using VerificationService
    const revocationResult = await VerificationService.revokeCertificate(
      signature.certificate_id,
      {
        reason: reason || 'Certificate revoked by user',
        initiatedBy: userId,
        requestId: req.requestId,
        userAgent: req.get('user-agent'),
        ipAddress: req.ip
      }
    );

    res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully',
      data: revocationResult
    });
  } catch (error) {
    console.error('Certificate revocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking certificate',
      code: 'REVOCATION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/verification/verify-uploaded
// Upload a PDF file and verify its embedded SigniStruct signatures
// Accepts multipart/form-data with a PDF file
exports.verifyUploadedDocument = async (req, res) => {
  const requestId = req.requestId || `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Starting uploaded document verification`);

    // 1. Check that a file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded',
        code: 'NO_FILE',
        requestId
      });
    }

    const { PDFDocument } = require('pdf-lib');
    const NodeRSA = require('node-rsa');

    // 2. Load the PDF from the uploaded buffer
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(req.file.buffer);
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PDF file. Could not parse the uploaded document.',
        code: 'INVALID_PDF',
        requestId
      });
    }

    // 3. Extract SigniStruct verification metadata from PDF Subject field
    const subject = pdfDoc.getSubject() || '';
    const prefix = 'SigniStruct-Verification:';

    if (!subject.startsWith(prefix)) {
      return res.status(200).json({
        success: true,
        data: {
          verified: false,
          is_signistruct_document: false,
          message: 'This PDF does not contain SigniStruct verification data. It may not have been signed through SigniStruct, or it was not downloaded using the SigniStruct Download feature.',
          requestId
        }
      });
    }

    // 4. Parse the embedded verification JSON
    let verificationData;
    try {
      const jsonStr = subject.substring(prefix.length);
      verificationData = JSON.parse(jsonStr);
    } catch (jsonErr) {
      return res.status(200).json({
        success: true,
        data: {
          verified: false,
          is_signistruct_document: true,
          message: 'SigniStruct metadata found but could not be parsed. The PDF may have been corrupted.',
          requestId
        }
      });
    }

    console.log(`[${requestId}] Found SigniStruct metadata v${verificationData.signistruct_version}`);
    console.log(`[${requestId}] Document: ${verificationData.document_title} (${verificationData.document_id})`);
    console.log(`[${requestId}] Signatures to verify: ${verificationData.signatures?.length || 0}`);

    // 5. Verify each signature using embedded public keys
    const signatureResults = [];
    let allValid = true;

    for (const sig of (verificationData.signatures || [])) {
      const result = {
        signer_email: sig.signer_email,
        signer_name: sig.signer_name,
        algorithm: sig.algorithm,
        signed_at: sig.signed_at,
        signature_valid: false,
        certificate_valid: false,
        certificate_info: null,
        errors: []
      };

      // Check if we have the crypto data needed for verification
      if (!sig.crypto_signature || !sig.content_hash) {
        result.errors.push('Missing cryptographic signature data (visual-only signature)');
        result.signature_valid = false;
        allValid = false;
        signatureResults.push(result);
        continue;
      }

      // Check certificate
      if (sig.certificate) {
        const cert = sig.certificate;
        result.certificate_info = {
          certificate_id: cert.certificate_id,
          issuer: cert.issuer,
          subject: cert.subject,
          serial_number: cert.serial_number,
          fingerprint_sha256: cert.fingerprint_sha256,
          status: cert.status
        };

        // Check certificate validity dates
        const now = new Date();
        const notBefore = new Date(cert.not_before);
        const notAfter = new Date(cert.not_after);

        if (now < notBefore) {
          result.errors.push('Certificate is not yet valid');
          result.certificate_valid = false;
        } else if (now > notAfter) {
          result.errors.push('Certificate has expired');
          result.certificate_valid = false;
        } else if (cert.status !== 'active') {
          result.errors.push(`Certificate status: ${cert.status}`);
          result.certificate_valid = false;
        } else {
          result.certificate_valid = true;
        }

        // Verify RSA signature using the embedded public key
        if (cert.public_key) {
          try {
            const key = new NodeRSA(cert.public_key);
            const hashBuffer = Buffer.from(sig.content_hash, 'hex');
            const signatureBuffer = Buffer.from(sig.crypto_signature, 'hex');
            const isValid = key.verify(hashBuffer, signatureBuffer, 'hex', 'hex');
            result.signature_valid = isValid;

            if (!isValid) {
              result.errors.push('RSA signature verification failed — content may have been tampered with');
              allValid = false;
            }
          } catch (verifyErr) {
            result.signature_valid = false;
            result.errors.push(`Signature verification error: ${verifyErr.message}`);
            allValid = false;
          }
        } else {
          result.errors.push('No public key available for verification');
          result.signature_valid = false;
          allValid = false;
        }
      } else {
        result.errors.push('No certificate data embedded for this signature');
        allValid = false;
      }

      signatureResults.push(result);
    }

    // 6. Cross-reference with database if possible
    let databaseMatch = null;
    try {
      if (verificationData.document_id) {
        const dbDocument = await Document.findById(verificationData.document_id);
        if (dbDocument) {
          databaseMatch = {
            found: true,
            title: dbDocument.title,
            status: dbDocument.status,
            hash_matches: dbDocument.file_hash_sha256 === verificationData.document_hash
          };
        } else {
          databaseMatch = { found: false };
        }
      }
    } catch (dbErr) {
      console.warn(`[${requestId}] Database cross-reference failed:`, dbErr.message);
      databaseMatch = { found: false, error: 'Could not check database' };
    }

    // 7. Build response
    const verifiedCount = signatureResults.filter(s => s.signature_valid).length;

    console.log(`[${requestId}] Verification complete: ${verifiedCount}/${signatureResults.length} valid`);

    res.status(200).json({
      success: true,
      data: {
        verified: allValid && signatureResults.length > 0,
        is_signistruct_document: true,
        document_info: {
          document_id: verificationData.document_id,
          title: verificationData.document_title,
          document_hash: verificationData.document_hash,
          signed_at: verificationData.signed_at
        },
        summary: {
          total_signatures: signatureResults.length,
          verified_signatures: verifiedCount,
          invalid_signatures: signatureResults.length - verifiedCount,
          all_valid: allValid && signatureResults.length > 0
        },
        signatures: signatureResults,
        database_match: databaseMatch,
        requestId
      }
    });

  } catch (error) {
    console.error(`[${requestId}] Upload verification error:`, error);
    res.status(500).json({
      success: false,
      message: 'Error verifying uploaded document',
      code: 'VERIFICATION_ERROR',
      requestId,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = exports;
