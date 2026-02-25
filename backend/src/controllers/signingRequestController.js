const signingRequestService = require('../services/signingRequestService');
const Document = require('../models/Document');

class SigningRequestController {
  /**
   * Create a new signing request
   * POST /api/signing-requests/documents/:documentId
   */
  async createSigningRequest(req, res) {
    try {
      const { documentId } = req.params;
      const { recipient_email, expiration_date, message } = req.body;
      const senderId = req.user.id;

      // Validation
      if (!recipient_email || !recipient_email.trim()) {
        return res.status(400).json({ 
          error: 'INVALID_EMAIL', 
          message: 'Recipient email is required' 
        });
      }

      if (!expiration_date) {
        return res.status(400).json({ 
          error: 'INVALID_EXPIRATION', 
          message: 'Expiration date is required' 
        });
      }

      const expiryDate = new Date(expiration_date);
      if (expiryDate <= new Date()) {
        return res.status(400).json({ 
          error: 'INVALID_EXPIRATION', 
          message: 'Expiration date must be in the future' 
        });
      }

      // Create request
      const metadata = {
        sent_from_ip: req.ip,
        user_agent: req.get('user-agent')
      };

      const signingRequest = await signingRequestService.createSigningRequest(
        documentId,
        senderId,
        recipient_email.toLowerCase(),
        expiryDate,
        message || '',
        metadata
      );

      return res.status(201).json({
        success: true,
        message: 'Signing request created successfully',
        data: {
          request_id: signingRequest._id,
          recipient_email: signingRequest.recipient_email,
          status: signingRequest.status,
          expiration_date: signingRequest.expiration_date,
          share_link: `/sign/${signingRequest.share_token}`
        }
      });
    } catch (error) {
      console.error('Error creating signing request:', error);
      return res.status(500).json({ 
        error: 'CREATION_FAILED', 
        message: error.message 
      });
    }
  }

  /**
   * Get all signing requests for a document
   * GET /api/signing-requests/documents/:documentId
   */
  async getDocumentRequests(req, res) {
    try {
      const { documentId } = req.params;
      const userId = req.user.id;

      const requests = await signingRequestService.getDocumentSigningRequests(documentId, userId);

      return res.status(200).json({
        success: true,
        message: 'Signing requests retrieved successfully',
        data: {
          requests,
          total: requests.length
        }
      });
    } catch (error) {
      console.error('Error getting document requests:', error);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ 
          error: 'FORBIDDEN', 
          message: 'You do not have permission to view these requests' 
        });
      }
      return res.status(500).json({ 
        error: 'RETRIEVAL_FAILED', 
        message: error.message 
      });
    }
  }

  /**
   * Get signing requests for authenticated user (as recipient)
   * GET /api/signing-requests/my-requests
   */
  async getRecipientRequests(req, res) {
    try {
      const userEmail = req.user.email;

      const requests = await signingRequestService.getRecipientSigningRequests(userEmail);

      return res.status(200).json({
        success: true,
        message: 'Your signing requests retrieved successfully',
        data: {
          requests,
          total: requests.length
        }
      });
    } catch (error) {
      console.error('Error getting recipient requests:', error);
      return res.status(500).json({ 
        error: 'RETRIEVAL_FAILED', 
        message: error.message 
      });
    }
  }

  /**
   * Get signing request by share token
   * GET /api/signing-requests/share/:token
   */
  async getRequestByToken(req, res) {
    try {
      const { token } = req.params;

      const request = await signingRequestService.getSigningRequestByToken(token);

      return res.status(200).json({
        success: true,
        message: 'Signing request retrieved successfully',
        data: {
          request_id: request._id,
          document_id: request.document_id,
          document_title: request.document_id.title,
          sender: {
            name: request.sender_id.full_name || request.sender_id.email,
            email: request.sender_id.email
          },
          recipient_email: request.recipient_email,
          status: request.status,
          message: request.message,
          expiration_date: request.expiration_date,
          document_snapshot: request.document_snapshot
        }
      });
    } catch (error) {
      console.error('Error getting request by token:', error);
      if (error.message.includes('Invalid or expired') || error.message.includes('expired')) {
        return res.status(404).json({ 
          error: 'NOT_FOUND', 
          message: error.message 
        });
      }
      return res.status(500).json({ 
        error: 'RETRIEVAL_FAILED', 
        message: error.message 
      });
    }
  }

  /**
   * Accept a signing request
   * POST /api/signing-requests/:requestId/accept
   */
  async acceptRequest(req, res) {
    try {
      const { requestId } = req.params;
      const userId = req.user.id;

      const request = await signingRequestService.acceptSigningRequest(requestId, userId);

      return res.status(200).json({
        success: true,
        message: 'Signing request accepted successfully',
        data: {
          request_id: request._id,
          status: request.status,
          accepted_at: request.accepted_at,
          document_id: request.document_id
        }
      });
    } catch (error) {
      console.error('Error accepting signing request:', error);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ 
          error: 'FORBIDDEN', 
          message: 'You do not have permission to accept this request' 
        });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          error: 'NOT_FOUND', 
          message: error.message 
        });
      }
      if (error.message.includes('expired')) {
        return res.status(400).json({ 
          error: 'REQUEST_EXPIRED', 
          message: error.message 
        });
      }
      return res.status(400).json({ 
        error: 'OPERATION_FAILED', 
        message: error.message 
      });
    }
  }

  /**
   * Decline a signing request
   * POST /api/signing-requests/:requestId/decline
   */
  async declineRequest(req, res) {
    try {
      const { requestId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const request = await signingRequestService.declineSigningRequest(
        requestId,
        userId,
        reason || ''
      );

      return res.status(200).json({
        success: true,
        message: 'Signing request declined successfully',
        data: {
          request_id: request._id,
          status: request.status,
          declined_at: request.declined_at,
          reason: request.decline_reason
        }
      });
    } catch (error) {
      console.error('Error declining signing request:', error);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ 
          error: 'FORBIDDEN', 
          message: 'You do not have permission to decline this request' 
        });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          error: 'NOT_FOUND', 
          message: error.message 
        });
      }
      return res.status(400).json({ 
        error: 'OPERATION_FAILED', 
        message: error.message 
      });
    }
  }

  /**
   * Revoke a signing request
   * POST /api/signing-requests/:requestId/revoke
   */
  async revokeRequest(req, res) {
    try {
      const { requestId } = req.params;
      const userId = req.user.id;

      const request = await signingRequestService.revokeSigningRequest(requestId, userId);

      return res.status(200).json({
        success: true,
        message: 'Signing request revoked successfully',
        data: {
          request_id: request._id,
          status: request.status,
          recipient_email: request.recipient_email
        }
      });
    } catch (error) {
      console.error('Error revoking signing request:', error);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ 
          error: 'FORBIDDEN', 
          message: 'You do not have permission to revoke this request' 
        });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          error: 'NOT_FOUND', 
          message: error.message 
        });
      }
      return res.status(400).json({ 
        error: 'OPERATION_FAILED', 
        message: error.message 
      });
    }
  }

  /**
   * Send reminder for pending request
   * POST /api/signing-requests/:requestId/remind
   */
  async sendReminder(req, res) {
    try {
      const { requestId } = req.params;
      const userId = req.user.id;

      const request = await signingRequestService.sendReminder(requestId, userId);

      return res.status(200).json({
        success: true,
        message: 'Reminder sent successfully',
        data: {
          request_id: request._id,
          reminder_count: request.reminder_sent_count,
          last_sent_at: request.last_reminder_sent_at,
          recipient_email: request.recipient_email
        }
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ 
          error: 'FORBIDDEN', 
          message: 'You do not have permission to send reminders' 
        });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          error: 'NOT_FOUND', 
          message: error.message 
        });
      }
      if (error.message.includes('expired')) {
        return res.status(400).json({ 
          error: 'REQUEST_EXPIRED', 
          message: error.message 
        });
      }
      return res.status(400).json({ 
        error: 'OPERATION_FAILED', 
        message: error.message 
      });
    }
  }

  /**
   * Get document request statistics
   * GET /api/signing-requests/documents/:documentId/stats
   */
  async getStatistics(req, res) {
    try {
      const { documentId } = req.params;
      const userId = req.user.id;

      // Verify document ownership
      const document = await Document.findById(documentId);
      if (!document || document.owner_id.toString() !== userId.toString()) {
        return res.status(403).json({ 
          error: 'FORBIDDEN', 
          message: 'Only document owner can view statistics' 
        });
      }

      const stats = await signingRequestService.getDocumentStatistics(documentId);

      return res.status(200).json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error getting statistics:', error);
      return res.status(500).json({ 
        error: 'RETRIEVAL_FAILED', 
        message: error.message 
      });
    }
  }
}

module.exports = new SigningRequestController();
