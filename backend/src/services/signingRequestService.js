const SigningRequest = require('../models/SigningRequest');
const Document = require('../models/Document');
const User = require('../models/User');
const SignatureAuditLog = require('../models/SignatureAuditLog');
const notificationService = require('./notificationService');

class SigningRequestService {
  /**
   * Create a new signing request
   * @param {string} documentId - Document ID to share
   * @param {string} senderId - User ID sending the request
   * @param {string} recipientEmail - Email of recipient
   * @param {Date} expirationDate - When request expires
   * @param {string} message - Optional personal message
   * @param {object} metadata - IP and user agent info
   * @returns {object} Created signing request
   */
  async createSigningRequest(documentId, senderId, recipientEmail, expirationDate, message = '', metadata = {}) {
    try {
      // Validate document exists and user owns it
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }
      if (document.owner_id.toString() !== senderId.toString()) {
        throw new Error('Only document owner can create signing requests');
      }

      // Get sender user info for snapshot
      const sender = await User.findById(senderId);
      if (!sender) {
        throw new Error('Sender user not found');
      }

      // Check if request already exists for this recipient
      const existingRequest = await SigningRequest.findOne({
        document_id: documentId,
        recipient_email: recipientEmail.toLowerCase(),
        status: { $in: ['pending', 'accepted'] }
      });

      if (existingRequest) {
        throw new Error('Active request already exists for this recipient');
      }

      // Create document snapshot for email context
      const documentSnapshot = {
        title: document.title,
        owner_name: sender.full_name || sender.email,
        owner_email: sender.email,
        file_hash: document.file_hash_sha256,
        signature_count: document.signatures ? document.signatures.length : 0
      };

      // Create signing request
      const signingRequest = new SigningRequest({
        document_id: documentId,
        recipient_email: recipientEmail.toLowerCase(),
        sender_id: senderId,
        expiration_date: expirationDate,
        message: message,
        document_snapshot: documentSnapshot,
        metadata: metadata
      });

      await signingRequest.save();

      // Log audit trail
      await this._logAudit('signing_request_created', senderId, documentId, {
        recipient_email: recipientEmail,
        request_id: signingRequest._id,
        expires_at: expirationDate
      });

      // Send invitation email (non-blocking)
      try {
        await notificationService.sendSigningRequestEmail(signingRequest._id);
      } catch (emailError) {
        console.warn(`Email notification failed for request ${signingRequest._id}:`, emailError.message);
      }

      return signingRequest;
    } catch (error) {
      throw new Error(`Failed to create signing request: ${error.message}`);
    }
  }

  /**
   * Get all signing requests for a document (owner view)
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID requesting (must be owner)
   * @returns {array} Array of signing requests
   */
  async getDocumentSigningRequests(documentId, userId) {
    try {
      // Verify ownership
      const document = await Document.findById(documentId);
      if (!document || document.owner_id.toString() !== userId.toString()) {
        throw new Error('Unauthorized: Only document owner can view requests');
      }

      const requests = await SigningRequest.find({ document_id: documentId })
        .select('-share_token -metadata')
        .populate('sender_id', 'email full_name')
        .sort({ created_at: -1 });

      // Add virtual is_expired for pending requests
      return requests.map(request => ({
        _id: request._id,
        recipient_email: request.recipient_email,
        sender_id: request.sender_id,
        status: request.status,
        expiration_date: request.expiration_date,
        accepted_at: request.accepted_at,
        declined_at: request.declined_at,
        reminder_sent_count: request.reminder_sent_count,
        is_expired: request.is_expired,
        created_at: request.created_at,
        message: request.message
      }));
    } catch (error) {
      throw new Error(`Failed to get signing requests: ${error.message}`);
    }
  }

  /**
   * Get signing requests for a recipient
   * @param {string} recipientEmail - Email of recipient
   * @returns {array} Array of signing requests
   */
  async getRecipientSigningRequests(recipientEmail) {
    try {
      const requests = await SigningRequest.find({
        recipient_email: recipientEmail.toLowerCase(),
        status: { $in: ['pending', 'accepted', 'declined'] }
      })
        .select('-share_token -metadata')
        .populate('document_id', 'title status owner_id')
        .populate('sender_id', 'email full_name')
        .sort({ created_at: -1 });

      return requests;
    } catch (error) {
      throw new Error(`Failed to get recipient requests: ${error.message}`);
    }
  }

  /**
   * Get signing request by share token
   * @param {string} token - Share token
   * @returns {object} Signing request
   */
  async getSigningRequestByToken(token) {
    try {
      const request = await SigningRequest.findOne({ share_token: token })
        .populate('document_id', 'title file_hash_sha256')
        .populate('sender_id', 'email full_name');

      if (!request) {
        throw new Error('Invalid or expired share link');
      }

      // Check if expired
      if (request.status === 'pending' && new Date() > request.expiration_date) {
        await request.updateOne({ status: 'expired' });
        throw new Error('This signing request has expired');
      }

      return request;
    } catch (error) {
      throw new Error(`Failed to get signing request: ${error.message}`);
    }
  }

  /**
   * Accept a signing request
   * @param {string} requestId - Signing request ID
   * @param {string} recipientId - User ID accepting (must be recipient)
   * @returns {object} Updated signing request
   */
  async acceptSigningRequest(requestId, recipientId) {
    try {
      const request = await SigningRequest.findById(requestId);
      if (!request) {
        throw new Error('Signing request not found');
      }

      // Verify recipient email matches user
      const user = await User.findById(recipientId);
      if (!user || user.email.toLowerCase() !== request.recipient_email.toLowerCase()) {
        throw new Error('Unauthorized: Email does not match request recipient');
      }

      if (request.status !== 'pending') {
        throw new Error(`Cannot accept request with status: ${request.status}`);
      }

      // Check expiration
      if (new Date() > request.expiration_date) {
        await request.updateOne({ status: 'expired' });
        throw new Error('Signing request has expired');
      }

      // Update request
      request.status = 'accepted';
      request.accepted_at = new Date();
      await request.save();

      // Log audit trail
      await this._logAudit('signing_request_accepted', recipientId, request.document_id, {
        request_id: requestId,
        recipient_email: request.recipient_email
      });

      // Send confirmation email (non-blocking)
      try {
        await notificationService.sendSignatureConfirmationEmails(request.document_id, recipientId);
      } catch (emailError) {
        console.warn(`Email notification failed for accepted request ${requestId}:`, emailError.message);
      }

      return request;
    } catch (error) {
      throw new Error(`Failed to accept signing request: ${error.message}`);
    }
  }

  /**
   * Decline a signing request
   * @param {string} requestId - Signing request ID
   * @param {string} recipientId - User ID declining
   * @param {string} reason - Reason for declining
   * @returns {object} Updated signing request
   */
  async declineSigningRequest(requestId, recipientId, reason = '') {
    try {
      const request = await SigningRequest.findById(requestId);
      if (!request) {
        throw new Error('Signing request not found');
      }

      // Verify recipient
      const user = await User.findById(recipientId);
      if (!user || user.email.toLowerCase() !== request.recipient_email.toLowerCase()) {
        throw new Error('Unauthorized: Email does not match request recipient');
      }

      if (request.status !== 'pending' && request.status !== 'accepted') {
        throw new Error(`Cannot decline request with status: ${request.status}`);
      }

      // Update request
      request.status = 'declined';
      request.decline_reason = reason;
      request.declined_at = new Date();
      await request.save();

      // Log audit trail
      await this._logAudit('signing_request_declined', recipientId, request.document_id, {
        request_id: requestId,
        recipient_email: request.recipient_email,
        reason: reason
      });

      // Send decline notification email (non-blocking)
      try {
        await notificationService.sendDeclineNotificationEmail(requestId);
      } catch (emailError) {
        console.warn(`Email notification failed for declined request ${requestId}:`, emailError.message);
      }

      return request;
    } catch (error) {
      throw new Error(`Failed to decline signing request: ${error.message}`);
    }
  }

  /**
   * Revoke a signing request
   * @param {string} requestId - Signing request ID
   * @param {string} senderId - User ID revoking (must be owner)
   * @returns {object} Updated signing request
   */
  async revokeSigningRequest(requestId, senderId) {
    try {
      const request = await SigningRequest.findById(requestId);
      if (!request) {
        throw new Error('Signing request not found');
      }

      // Verify sender is the one who created it
      if (request.sender_id.toString() !== senderId.toString()) {
        throw new Error('Unauthorized: Only request creator can revoke');
      }

      if (request.status === 'accepted' || request.status === 'declined') {
        throw new Error(`Cannot revoke request with status: ${request.status}`);
      }

      request.status = 'revoked';
      await request.save();

      // Log audit trail
      await this._logAudit('signing_request_revoked', senderId, request.document_id, {
        request_id: requestId,
        recipient_email: request.recipient_email
      });

      return request;
    } catch (error) {
      throw new Error(`Failed to revoke signing request: ${error.message}`);
    }
  }

  /**
   * Send reminder for pending request
   * @param {string} requestId - Signing request ID
   * @param {string} senderId - User ID sending reminder
   * @returns {object} Updated signing request
   */
  async sendReminder(requestId, senderId) {
    try {
      const request = await SigningRequest.findById(requestId);
      if (!request) {
        throw new Error('Signing request not found');
      }

      // Verify sender owns the document
      const document = await Document.findById(request.document_id);
      if (!document || document.owner_id.toString() !== senderId.toString()) {
        throw new Error('Unauthorized: Only document owner can send reminders');
      }

      if (request.status !== 'pending') {
        throw new Error(`Cannot send reminder for ${request.status} request`);
      }

      // Check expiration
      if (new Date() > request.expiration_date) {
        await request.updateOne({ status: 'expired' });
        throw new Error('Signing request has expired');
      }

      // Update reminder tracking
      request.reminder_sent_count += 1;
      request.last_reminder_sent_at = new Date();
      await request.save();

      // Log audit trail
      await this._logAudit('signing_request_reminder_sent', senderId, request.document_id, {
        request_id: requestId,
        recipient_email: request.recipient_email,
        reminder_count: request.reminder_sent_count
      });

      return request;
    } catch (error) {
      throw new Error(`Failed to send reminder: ${error.message}`);
    }
  }

  /**
   * Expire overdue signing requests
   * @returns {number} Count of expired requests
   */
  async expireOverdueRequests() {
    try {
      const now = new Date();
      const result = await SigningRequest.updateMany(
        {
          status: 'pending',
          expiration_date: { $lt: now }
        },
        {
          status: 'expired',
          updated_at: now
        }
      );

      return result.modifiedCount;
    } catch (error) {
      throw new Error(`Failed to expire overdue requests: ${error.message}`);
    }
  }

  /**
   * Get statistics for a document
   * @param {string} documentId - Document ID
   * @returns {object} Request statistics
   */
  async getDocumentStatistics(documentId) {
    try {
      const requests = await SigningRequest.find({ document_id: documentId });

      const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        accepted: requests.filter(r => r.status === 'accepted').length,
        declined: requests.filter(r => r.status === 'declined').length,
        expired: requests.filter(r => r.status === 'expired').length,
        revoked: requests.filter(r => r.status === 'revoked').length
      };

      stats.completion_percentage = stats.total > 0 
        ? Math.round(((stats.accepted + stats.declined) / stats.total) * 100)
        : 0;

      return stats;
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * Internal: Log audit trail
   */
  async _logAudit(action, userId, documentId, details = {}) {
    try {
      await SignatureAuditLog.create({
        action,
        user_id: userId,
        document_id: documentId,
        details,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log audit trail:', error.message);
    }
  }
}

module.exports = new SigningRequestService();
