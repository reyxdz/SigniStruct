const emailService = require('./emailService');
const emailTemplates = require('./emailTemplates');
const Document = require('../models/Document');
const User = require('../models/User');
const SigningRequest = require('../models/SigningRequest');
const SignatureAuditLog = require('../models/SignatureAuditLog');

class NotificationService {
  /**
   * Send signing request invitation email
   * @param {string} requestId - Signing request ID
   */
  async sendSigningRequestEmail(requestId) {
    try {
      const request = await SigningRequest.findById(requestId)
        .populate('document_id', 'title')
        .populate('sender_id', 'email full_name');

      if (!request) {
        throw new Error('Signing request not found');
      }

      const sender = request.sender_id;
      const document = request.document_id;
      const appUrl = process.env.APP_URL || 'https://signistruct.com';
      const shareLink = `${appUrl}/share/${request.share_token}`;

      const { html, text } = emailTemplates.signingRequestInvitation({
        recipientName: request.recipient_email.split('@')[0],
        senderName: sender.full_name || sender.email,
        senderEmail: sender.email,
        documentTitle: document.title,
        message: request.message,
        shareLink,
        expirationDate: request.expiration_date,
        companyName: process.env.COMPANY_NAME || 'SigniStruct'
      });

      await emailService.sendHtmlEmail(
        request.recipient_email,
        `📝 You've been requested to sign: ${document.title}`,
        html,
        text
      );

      // Log email notification
      await this._logNotification(sender._id, requestId, 'signing_request_sent', {
        recipient: request.recipient_email,
        document: document.title
      });

      return { success: true, message: 'Signing request email sent' };
    } catch (error) {
      console.error('Failed to send signing request email:', error.message);
      throw error;
    }
  }

  /**
   * Send reminder email for pending request
   * @param {string} requestId - Signing request ID
   */
  async sendReminderEmail(requestId) {
    try {
      const request = await SigningRequest.findById(requestId)
        .populate('document_id', 'title owner_id')
        .populate('sender_id', 'email full_name');

      if (!request) {
        throw new Error('Signing request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Can only send reminders for pending requests');
      }

      const sender = request.sender_id;
      const document = request.document_id;
      const appUrl = process.env.APP_URL || 'https://signistruct.com';
      const shareLink = `${appUrl}/share/${request.share_token}`;

      const { html, text } = emailTemplates.reminderEmail({
        recipientName: request.recipient_email.split('@')[0],
        senderName: sender.full_name || sender.email,
        senderEmail: sender.email,
        documentTitle: document.title,
        shareLink,
        expirationDate: request.expiration_date,
        reminderCount: request.reminder_sent_count + 1,
        companyName: process.env.COMPANY_NAME || 'SigniStruct'
      });

      await emailService.sendHtmlEmail(
        request.recipient_email,
        `⏰ Reminder: Sign ${document.title}`,
        html,
        text
      );

      // Log email notification
      await this._logNotification(sender._id, requestId, 'reminder_sent', {
        recipient: request.recipient_email,
        reminder_count: request.reminder_sent_count + 1
      });

      return { success: true, message: 'Reminder email sent' };
    } catch (error) {
      console.error('Failed to send reminder email:', error.message);
      throw error;
    }
  }

  /**
   * Send signature confirmation to all document owners/signers
   * @param {string} documentId - Document ID
   * @param {string} signerId - User who signed
   */
  async sendSignatureConfirmationEmails(documentId, signerId) {
    try {
      const document = await Document.findById(documentId)
        .populate('owner_id', 'email full_name')
        .populate('signatures.signer_id', 'email full_name');

      const signer = await User.findById(signerId);

      if (!document || !signer) {
        throw new Error('Document or signer not found');
      }

      // Find signing request for this signer
      const signingRequest = await SigningRequest.findOne({
        document_id: documentId,
        recipient_email: signer.email,
        status: 'accepted'
      });

      if (!signingRequest) {
        return; // No notification needed if no signing request
      }

      // Get all unique recipients of the document
      const recipients = new Set();
      recipients.add(document.owner_id.email);

      // Add other signers
      if (document.signers && Array.isArray(document.signers)) {
        document.signers.forEach(s => {
          if (s.signer_email && s.signer_email !== signer.email) {
            recipients.add(s.signer_email);
          }
        });
      }

      const appUrl = process.env.APP_URL || 'https://signistruct.com';

      // Send confirmation to each recipient
      for (const recipientEmail of recipients) {
        const recipientUser = recipientEmail === document.owner_id.email 
          ? document.owner_id 
          : await User.findOne({ email: recipientEmail });

        const { html, text } = emailTemplates.signatureConfirmationEmail({
          recipientName: recipientUser?.full_name || recipientEmail.split('@')[0],
          signerName: signer.full_name || signer.email,
          signerEmail: signer.email,
          documentTitle: document.title,
          signedAt: new Date(),
          companyName: process.env.COMPANY_NAME || 'SigniStruct'
        });

        try {
          await emailService.sendHtmlEmail(
            recipientEmail,
            `✓ Document Signed: ${document.title}`,
            html,
            text
          );
        } catch (error) {
          console.error(`Failed to send confirmation to ${recipientEmail}:`, error.message);
        }
      }

      // Log notification
      await this._logNotification(signerId, documentId, 'signature_confirmation_sent', {
        recipients: Array.from(recipients),
        signer_email: signer.email
      });

      return { success: true, message: 'Confirmation emails sent' };
    } catch (error) {
      console.error('Failed to send confirmation emails:', error.message);
      throw error;
    }
  }

  /**
   * Send decline notification to document owner
   * @param {string} requestId - Signing request ID
   */
  async sendDeclineNotificationEmail(requestId) {
    try {
      const request = await SigningRequest.findById(requestId)
        .populate('document_id', 'title owner_id')
        .populate('sender_id', 'email full_name');

      if (!request) {
        throw new Error('Signing request not found');
      }

      const owner = await User.findById(request.document_id.owner_id);
      const sender = request.sender_id;
      const document = request.document_id;

      const { html, text } = emailTemplates.requestDeclinedEmail({
        documentOwnerName: owner.full_name || owner.email,
        recipientName: request.recipient_email.split('@')[0],
        recipientEmail: request.recipient_email,
        documentTitle: document.title,
        reason: request.decline_reason,
        companyName: process.env.COMPANY_NAME || 'SigniStruct'
      });

      await emailService.sendHtmlEmail(
        owner.email,
        `✗ Signing Request Declined: ${document.title}`,
        html,
        text
      );

      // Log notification
      await this._logNotification(owner._id, requestId, 'decline_notified', {
        recipient: request.recipient_email,
        reason: request.decline_reason
      });

      return { success: true, message: 'Decline notification sent' };
    } catch (error) {
      console.error('Failed to send decline notification:', error.message);
      throw error;
    }
  }

  /**
   * Send all pending reminders (batch job)
   * @returns {Promise} Results of reminder sending
   */
  async sendPendingReminders() {
    try {
      const now = new Date();
      
      // Find all pending requests that are due for reminders
      const requestsDueForReminder = await SigningRequest.find({
        status: 'pending',
        $expr: {
          $gte: [
            { $subtract: [now, '$last_reminder_sent_at'] },
            24 * 60 * 60 * 1000 // 24 hours
          ]
        }
      });

      const results = {
        total: requestsDueForReminder.length,
        sent: 0,
        failed: 0,
        errors: []
      };

      for (const request of requestsDueForReminder) {
        try {
          await this.sendReminderEmail(request._id);
          results.sent++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            requestId: request._id,
            recipientEmail: request.recipient_email,
            error: error.message
          });
        }
      }

      console.log(`Reminder job completed: ${results.sent} sent, ${results.failed} failed`);
      return results;
    } catch (error) {
      console.error('Failed to send pending reminders:', error.message);
      throw error;
    }
  }

  /**
   * Internal: Log notification event
   */
  async _logNotification(userId, resourceId, action, details = {}) {
    try {
      await SignatureAuditLog.create({
        action,
        user_id: userId,
        document_id: resourceId,
        details: {
          ...details,
          notification_type: 'email'
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log notification:', error.message);
    }
  }
}

module.exports = new NotificationService();
