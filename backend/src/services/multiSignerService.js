const Document = require('../models/Document');
const DocumentSigner = require('../models/DocumentSigner');
const DocumentSignature = require('../models/DocumentSignature');
const User = require('../models/User');
const SignatureAuditLog = require('../models/SignatureAuditLog');

/**
 * Multi-Signer Service
 * Orchestrates complex multi-signer workflows with sequential/parallel signing
 * - Add signers to documents
 * - Manage signing order and deadlines
 * - Track signer status and progress
 * - Handle signing workflow transitions
 * - Send reminders and notifications
 */

class MultiSignerService {
  /**
   * Add signers to a document
   * @param {string} documentId - MongoDB ObjectId of document
   * @param {array} signers - Array of signer objects
   * @param {object} options - Configuration options
   * @returns {object} Result with created signers
   */
  async addSignersToDocument(documentId, signers, options = {}) {
    const {
      signingMethod = 'sequential', // 'sequential' or 'parallel'
      requireAll = true, // If true, all must sign to complete
      startDate = new Date(),
      deadline = null,
      requestId = null,
      ipAddress = null,
      userAgent = null
    } = options;

    try {
      // Verify document exists
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Sort signers by order if method is sequential
      let processedSigners = signers;
      if (signingMethod === 'sequential') {
        processedSigners = signers.map((signer, index) => ({
          ...signer,
          signing_order: index
        }));
      } else {
        // For parallel, all have order 0
        processedSigners = signers.map(signer => ({
          ...signer,
          signing_order: 0
        }));
      }

      // Create DocumentSigner entries
      const createdSigners = [];
      for (let i = 0; i < processedSigners.length; i++) {
        const signer = processedSigners[i];

        // Verify signer user exists
        let signerUser;
        if (signer.user_id) {
          signerUser = await User.findById(signer.user_id);
        } else if (signer.email) {
          signerUser = await User.findOne({ email: signer.email });
        } else {
          throw new Error(`Invalid signer at index ${i}: must provide user_id or email`);
        }

        if (!signerUser) {
          throw new Error(`Unable to find user for signer at index ${i}`);
        }

        // Calculate available_from (when signer can start signing)
        let availableFrom = startDate;
        if (signingMethod === 'sequential' && i > 0) {
          // Sequential: next signer available after previous signs
          availableFrom = null; // Will be updated when previous signs
        }

        // Calculate deadline
        let signerDeadline = deadline;
        if (deadline && signingMethod === 'sequential') {
          // For sequential, adjust deadline per signer
          // Each signer gets full deadline from when they can start
          signerDeadline = null; // Use document deadline, will be checked at signing time
        }

        const documentSigner = new DocumentSigner({
          document_id: documentId,
          signer_id: signerUser._id,
          signer_email: signerUser.email,
          signer_name: signerUser.name,
          signing_order: signer.signing_order || (signingMethod === 'sequential' ? i : 0),
          status: 'pending',
          available_from: availableFrom,
          signing_deadline: signerDeadline,
          signing_method: signingMethod,
          can_comment: signer.can_comment !== false // Default: true
        });

        await documentSigner.save();
        createdSigners.push(documentSigner);
      }

      // Update document status
      document.signers = createdSigners.map(s => ({
        signer_id: s.signer_id,
        status: 'pending'
      }));
      document.signing_method = signingMethod;
      document.require_all_signatures = requireAll;
      if (deadline) {
        document.signing_deadline = deadline;
      }
      await document.save();

      // Create audit log
      await SignatureAuditLog.create({
        action: 'MULTI_SIGNER_SETUP',
        user_id: null,
        document_id: documentId,
        status: 'SUCCESS',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          signer_count: createdSigners.length,
          signing_method: signingMethod,
          require_all: requireAll,
          request_id: requestId
        }
      });

      return {
        success: true,
        document_id: documentId,
        signers_added: createdSigners.length,
        signers: createdSigners.map(s => ({
          _id: s._id,
          signer_email: s.signer_email,
          signer_name: s.signer_name,
          status: s.status,
          signing_order: s.signing_order
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get signing workflow status for a document
   * @param {string} documentId - MongoDB ObjectId of document
   * @returns {object} Workflow status with all signer statuses
   */
  async getSigningWorkflowStatus(documentId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      const signers = await DocumentSigner.find({ document_id: documentId })
        .populate('signer_id', 'email name')
        .populate('signature_id', 'signature_hash signed_at')
        .sort({ signing_order: 1 });

      // Calculate overall status
      const pendingCount = signers.filter(s => s.status === 'pending').length;
      const signedCount = signers.filter(s => s.status === 'signed').length;
      const declinedCount = signers.filter(s => s.status === 'declined').length;

      let overallStatus = 'in_progress';
      if (pendingCount === 0 && declinedCount === 0) {
        overallStatus = 'completed';
      } else if (declinedCount > 0) {
        overallStatus = 'declined';
      }

      // Check for expired signers
      const now = new Date();
      const expiredSigners = signers.filter(
        s => s.status === 'pending' && s.signing_deadline && s.signing_deadline < now
      );

      return {
        document_id: documentId,
        overall_status: overallStatus,
        signing_method: document.signing_method || 'sequential',
        total_signers: signers.length,
        signed_count: signedCount,
        pending_count: pendingCount,
        declined_count: declinedCount,
        expired_count: expiredSigners.length,
        signers: signers.map(s => ({
          _id: s._id,
          signer_id: s.signer_id._id,
          signer_email: s.signer_email,
          signer_name: s.signer_name,
          status: s.status,
          signing_order: s.signing_order,
          can_sign: this._canSignNow(s, signers),
          signed_at: s.signed_at,
          is_expired: s.signing_deadline && s.signing_deadline < now,
          deadline: s.signing_deadline,
          reminder_count: s.reminder_count,
          comments_count: s.comments.length
        })),
        completion_percentage: Math.round((signedCount / signers.length) * 100)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a signer can sign now (used internally)
   * @private
   */
  _canSignNow(signer, allSigners) {
    // Already signed or declined
    if (signer.status !== 'pending') {
      return false;
    }

    // Check if available_from has passed
    if (signer.available_from && signer.available_from > new Date()) {
      return false;
    }

    // For sequential: check if previous signers have signed
    if (signer.signing_method === 'sequential' && signer.signing_order > 0) {
      const previousSigners = allSigners.filter(
        s => s.signing_order < signer.signing_order
      );
      const allPreviousSigned = previousSigners.every(s => s.status === 'signed');
      if (!allPreviousSigned) {
        return false;
      }
    }

    // Check deadline
    if (signer.signing_deadline && signer.signing_deadline < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Record a signer's signature
   * @param {string} documentId - MongoDB ObjectId of document
   * @param {string} signerId - MongoDB ObjectId of signer
   * @param {string} signatureId - MongoDB ObjectId of signature
   * @param {object} options - Additional options (ip, userAgent, etc)
   * @returns {object} Updated signer status
   */
  async recordSignature(documentId, signerId, signatureId, options = {}) {
    try {
      const { ipAddress, userAgent, requestId } = options;

      // Find and update DocumentSigner
      const documentSigner = await DocumentSigner.findOne({
        document_id: documentId,
        signer_id: signerId
      });

      if (!documentSigner) {
        throw new Error('Signer not found for this document');
      }

      if (documentSigner.status !== 'pending') {
        throw new Error(`Cannot sign: signer status is ${documentSigner.status}`);
      }

      // Update signer record
      documentSigner.status = 'signed';
      documentSigner.signed_at = new Date();
      documentSigner.signature_id = signatureId;
      documentSigner.signed_from_ip = ipAddress;
      documentSigner.signed_from_user_agent = userAgent;

      await documentSigner.save();

      // If sequential, unlock next signer
      if (documentSigner.signing_method === 'sequential') {
        const nextSigner = await DocumentSigner.findOne({
          document_id: documentId,
          signing_order: documentSigner.signing_order + 1,
          status: 'pending'
        });

        if (nextSigner) {
          nextSigner.available_from = new Date();
          await nextSigner.save();
        }
      }

      // Check if all signers have signed
      const allSigners = await DocumentSigner.find({ document_id: documentId });
      const allSigned = allSigners.every(s => s.status === 'signed');

      // Update document if completed
      if (allSigned) {
        const document = await Document.findById(documentId);
        document.status = 'fully_signed';
        await document.save();
      }

      // Create audit log
      await SignatureAuditLog.create({
        action: 'MULTI_SIGNER_SIGNATURE_RECORDED',
        user_id: signerId,
        document_id: documentId,
        status: 'SUCCESS',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          signature_id: signatureId,
          signer_order: documentSigner.signing_order,
          all_signed: allSigned,
          request_id: requestId
        }
      });

      return {
        success: true,
        document_id: documentId,
        signer_id: signerId,
        signed_at: documentSigner.signed_at,
        all_signatures_complete: allSigned
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Decline signing by a signer
   * @param {string} documentId - MongoDB ObjectId of document
   * @param {string} signerId - MongoDB ObjectId of signer
   * @param {string} reason - Reason for declining
   * @param {object} options - Additional options
   * @returns {object} Update result
   */
  async declineSignature(documentId, signerId, reason, options = {}) {
    try {
      const { ipAddress, userAgent, requestId } = options;

      const documentSigner = await DocumentSigner.findOne({
        document_id: documentId,
        signer_id: signerId
      });

      if (!documentSigner) {
        throw new Error('Signer not found for this document');
      }

      if (documentSigner.status !== 'pending') {
        throw new Error(`Cannot decline: signer status is ${documentSigner.status}`);
      }

      documentSigner.status = 'declined';
      documentSigner.decline_reason = reason;
      documentSigner.declined_at = new Date();

      await documentSigner.save();

      // Update document status
      const document = await Document.findById(documentId);
      document.status = 'signing_declined';
      await document.save();

      // Create audit log
      await SignatureAuditLog.create({
        action: 'MULTI_SIGNER_DECLINED',
        user_id: signerId,
        document_id: documentId,
        status: 'SUCCESS',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          reason: reason,
          signer_order: documentSigner.signing_order,
          request_id: requestId
        }
      });

      return {
        success: true,
        document_id: documentId,
        signer_id: signerId,
        declined_at: documentSigner.declined_at
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add comment from signer
   * @param {string} documentId - MongoDB ObjectId of document
   * @param {string} signerId - MongoDB ObjectId of signer
   * @param {string} message - Comment message
   * @param {boolean} isRequest - If true, this is a change request
   * @returns {object} Updated comments
   */
  async addSignerComment(documentId, signerId, message, isRequest = false) {
    try {
      const documentSigner = await DocumentSigner.findOne({
        document_id: documentId,
        signer_id: signerId
      });

      if (!documentSigner) {
        throw new Error('Signer not found for this document');
      }

      if (!documentSigner.can_comment) {
        throw new Error('This signer is not allowed to add comments');
      }

      documentSigner.comments.push({
        message,
        is_request: isRequest,
        created_at: new Date()
      });

      await documentSigner.save();

      return {
        success: true,
        comment_id: documentSigner.comments[documentSigner.comments.length - 1]._id,
        comments_count: documentSigner.comments.length
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all comments for a document
   * @param {string} documentId - MongoDB ObjectId of document
   * @returns {array} All comments from all signers
   */
  async getDocumentComments(documentId) {
    try {
      const signers = await DocumentSigner.find({ document_id: documentId })
        .populate('signer_id', 'email name');

      const allComments = [];
      signers.forEach(signer => {
        signer.comments.forEach(comment => {
          allComments.push({
            _id: comment._id,
            signer_id: signer.signer_id._id,
            signer_email: signer.signer_email,
            signer_name: signer.signer_name,
            message: comment.message,
            is_request: comment.is_request,
            created_at: comment.created_at
          });
        });
      });

      // Sort by creation time
      allComments.sort((a, b) => b.created_at - a.created_at);

      return allComments;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send reminder to pending signers
   * @param {string} documentId - MongoDB ObjectId of document
   * @returns {object} Reminder sending results
   */
  async sendReminders(documentId) {
    try {
      const signers = await DocumentSigner.find({
        document_id: documentId,
        status: 'pending'
      }).populate('signer_id', 'email');

      const remindersSent = [];
      for (const signer of signers) {
        // In production, this would send actual emails
        signer.reminder_count += 1;
        signer.last_reminder_sent = new Date();
        await signer.save();

        remindersSent.push({
          signer_id: signer.signer_id._id,
          signer_email: signer.signer_email,
          reminder_count: signer.reminder_count
        });
      }

      // Create audit log
      await SignatureAuditLog.create({
        action: 'REMINDERS_SENT',
        document_id: documentId,
        status: 'SUCCESS',
        metadata: {
          reminders_sent: remindersSent.length,
          signers: remindersSent
        }
      });

      return {
        success: true,
        reminders_sent: remindersSent.length,
        signers: remindersSent
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check and expire signatures past deadline
   * @param {string} documentId - MongoDB ObjectId of document
   * @returns {object} Expired signatures
   */
  async expireOverdueSignatures(documentId) {
    try {
      const now = new Date();
      const expiredSigners = await DocumentSigner.updateMany(
        {
          document_id: documentId,
          status: 'pending',
          signing_deadline: { $lt: now }
        },
        {
          status: 'expired',
          $set: { updated_at: now }
        }
      );

      // Update document if all are now expired/declined/signed
      const allSigners = await DocumentSigner.find({ document_id: documentId });
      const allComplete = allSigners.every(
        s => s.status !== 'pending'
      );

      if (allComplete) {
        const document = await Document.findById(documentId);
        document.status = 'signing_expired';
        await document.save();
      }

      return {
        success: true,
        expired_count: expiredSigners.modifiedCount
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new MultiSignerService();
