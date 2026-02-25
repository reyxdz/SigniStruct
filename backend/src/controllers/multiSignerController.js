const MultiSignerService = require('../services/multiSignerService');
const Document = require('../models/Document');
const DocumentSigner = require('../models/DocumentSigner');

/**
 * Multi-Signer Controller
 * Handles all multi-signer workflow endpoints
 */

// POST /api/multi-signer/documents/:documentId/signers
// Add signers to a document
exports.addSignersToDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { signers, signingMethod = 'sequential', deadline } = req.body;
    const userId = req.user.id;

    // Validate document ownership
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
        message: 'Unauthorized to modify this document',
        code: 'UNAUTHORIZED'
      });
    }

    // Validate signers array
    if (!signers || !Array.isArray(signers) || signers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Signers array is required and must not be empty',
        code: 'INVALID_SIGNERS'
      });
    }

    // Validate signing method
    if (!['sequential', 'parallel'].includes(signingMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signing method. Must be "sequential" or "parallel"',
        code: 'INVALID_SIGNING_METHOD'
      });
    }

    // Call service
    const result = await MultiSignerService.addSignersToDocument(
      documentId,
      signers,
      {
        signingMethod,
        deadline: deadline ? new Date(deadline) : null,
        requestId: req.requestId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Add signers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding signers',
      code: 'ADD_SIGNERS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/multi-signer/documents/:documentId/workflow
// Get current signing workflow status
exports.getSigningWorkflowStatus = async (req, res) => {
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
        message: 'Unauthorized to view this document',
        code: 'UNAUTHORIZED'
      });
    }

    const status = await MultiSignerService.getSigningWorkflowStatus(documentId);

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get workflow status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving workflow status',
      code: 'WORKFLOW_STATUS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/multi-signer/documents/:documentId/signers
// Get all signers for a document
exports.getDocumentSigners = async (req, res) => {
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
        message: 'Unauthorized to view this document',
        code: 'UNAUTHORIZED'
      });
    }

    const signers = await DocumentSigner.find({ document_id: documentId })
      .populate('signer_id', 'email name')
      .populate('signature_id', 'signed_at signature_hash')
      .sort({ signing_order: 1 });

    res.status(200).json({
      success: true,
      data: {
        document_id: documentId,
        signers_count: signers.length,
        signers: signers.map(s => ({
          _id: s._id,
          signer_id: s.signer_id._id,
          signer_email: s.signer_email,
          signer_name: s.signer_name,
          status: s.status,
          signing_order: s.signing_order,
          signed_at: s.signed_at,
          deadline: s.signing_deadline,
          reminder_count: s.reminder_count,
          can_comment: s.can_comment,
          comments_count: s.comments.length
        }))
      }
    });
  } catch (error) {
    console.error('Get signers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving signers',
      code: 'GET_SIGNERS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/multi-signer/documents/:documentId/signers/:signerId/sign
// Record that a signer has signed (called after signature is verified)
exports.recordSignerSignature = async (req, res) => {
  try {
    const { documentId, signerId } = req.params;
    const { signatureId } = req.body;
    const userId = req.user.id;

    // Verify signer is the current user
    if (signerId !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to sign as this user',
        code: 'UNAUTHORIZED'
      });
    }

    // Verify signature ID provided
    if (!signatureId) {
      return res.status(400).json({
        success: false,
        message: 'Signature ID is required',
        code: 'MISSING_SIGNATURE_ID'
      });
    }

    const result = await MultiSignerService.recordSignature(
      documentId,
      signerId,
      signatureId,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.requestId
      }
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Record signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording signature',
      code: 'RECORD_SIGNATURE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/multi-signer/documents/:documentId/signers/:signerId/decline
// Decline to sign
exports.declineSignature = async (req, res) => {
  try {
    const { documentId, signerId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    // Verify signer is the current user
    if (signerId !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to decline as this user',
        code: 'UNAUTHORIZED'
      });
    }

    const result = await MultiSignerService.declineSignature(
      documentId,
      signerId,
      reason || 'No reason provided',
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.requestId
      }
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Decline signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Error declining signature',
      code: 'DECLINE_SIGNATURE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/multi-signer/documents/:documentId/signers/:signerId/comments
// Add comment from signer
exports.addSignerComment = async (req, res) => {
  try {
    const { documentId, signerId } = req.params;
    const { message, isRequest = false } = req.body;
    const userId = req.user.id;

    // Verify signer is the current user
    if (signerId !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to comment as this user',
        code: 'UNAUTHORIZED'
      });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and cannot be empty',
        code: 'EMPTY_MESSAGE'
      });
    }

    const result = await MultiSignerService.addSignerComment(
      documentId,
      signerId,
      message,
      isRequest
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      code: 'ADD_COMMENT_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/multi-signer/documents/:documentId/comments
// Get all comments for a document
exports.getDocumentComments = async (req, res) => {
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
        message: 'Unauthorized to view this document',
        code: 'UNAUTHORIZED'
      });
    }

    const comments = await MultiSignerService.getDocumentComments(documentId);

    res.status(200).json({
      success: true,
      data: {
        document_id: documentId,
        comments_count: comments.length,
        comments
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving comments',
      code: 'GET_COMMENTS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/multi-signer/documents/:documentId/send-reminders
// Send reminders to pending signers
exports.sendReminders = async (req, res) => {
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
        message: 'Unauthorized to modify this document',
        code: 'UNAUTHORIZED'
      });
    }

    const result = await MultiSignerService.sendReminders(documentId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Send reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending reminders',
      code: 'SEND_REMINDERS_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = exports;
