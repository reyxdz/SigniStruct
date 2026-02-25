import api from './api';

/**
 * Document Signing Service
 * Handles all API calls for document signing and verification
 */

class DocumentSigningService {
  /**
   * Sign a document with user's digital signature
   * POST /api/documents/:documentId/sign
   * 
   * @param {string} documentId - Document to sign
   * @param {string} userSignatureId - User's saved signature ID
   * @param {Object} placement - Signature placement coordinates
   * @returns {Promise<Object>} Signature details
   */
  static async signDocument(documentId, userSignatureId, placement) {
    try {
      const response = await api.post(`/documents/${documentId}/sign`, {
        userSignatureId,
        placement
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all signatures on a document
   * GET /api/documents/:documentId/signatures
   * 
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Signatures and statistics
   */
  static async getDocumentSignatures(documentId) {
    try {
      const response = await api.get(`/documents/${documentId}/signatures`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get details of a specific signature
   * GET /api/documents/:documentId/signatures/:signatureId
   * 
   * @param {string} documentId - Document ID
   * @param {string} signatureId - Signature ID
   * @returns {Promise<Object>} Signature details
   */
  static async getSignatureDetails(documentId, signatureId) {
    try {
      const response = await api.get(
        `/documents/${documentId}/signatures/${signatureId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify all signatures on a document
   * POST /api/documents/:documentId/verify
   * 
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Verification results
   */
  static async verifyDocument(documentId) {
    try {
      const response = await api.post(`/documents/${documentId}/verify`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Revoke a signature
   * POST /api/documents/:documentId/signatures/:signatureId/revoke
   * 
   * @param {string} documentId - Document ID
   * @param {string} signatureId - Signature ID
   * @returns {Promise<Object>} Revocation result
   */
  static async revokeSignature(documentId, signatureId) {
    try {
      const response = await api.post(
        `/documents/${documentId}/signatures/${signatureId}/revoke`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default DocumentSigningService;
