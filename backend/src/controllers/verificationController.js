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
exports.getDocumentVerificationStatus = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

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
        message: 'Unauthorized to verify this document',
        code: 'UNAUTHORIZED'
      });
    }

    // Verify document using VerificationService
    const verificationResult = await VerificationService.verifyDocument(
      documentId,
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
    console.error('Document verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying document',
      code: 'VERIFICATION_ERROR',
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

module.exports = exports;
