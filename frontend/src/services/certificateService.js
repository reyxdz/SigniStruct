import api from './api';

/**
 * Certificate Service
 * Handles all certificate-related API calls for Phase 8.4
 */
const CertificateService = {
  /**
   * Get user's active certificate
   */
  async getActiveCertificate() {
    try {
      const response = await api.get('/certificates/my-certificate');
      return response.data.certificate;
    } catch (error) {
      console.error('Error fetching active certificate:', error);
      throw error;
    }
  },

  /**
   * Get all user's certificates (active, revoked, expired, superseded)
   */
  async getAllCertificates(userId) {
    try {
      const response = await api.get(`/certificates/user/${userId}/all`);
      return response.data.certificates;
    } catch (error) {
      console.error('Error fetching all certificates:', error);
      throw error;
    }
  },

  /**
   * Get certificate expiry status
   */
  async getCertificateExpiryStatus(certificateId) {
    try {
      const response = await api.get(`/certificates/${certificateId}/expiry-status`);
      return response.data.expiry_info;
    } catch (error) {
      console.error('Error fetching expiry status:', error);
      throw error;
    }
  },

  /**
   * Download certificate as PEM file
   */
  async downloadCertificate(certificateId) {
    try {
      const response = await api.get(`/certificates/${certificateId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading certificate:', error);
      throw error;
    }
  },

  /**
   * Renew a certificate
   */
  async renewCertificate(certificateId, validityYears = 5, reason = '') {
    try {
      const response = await api.post(`/certificates/${certificateId}/renew`, {
        validityYears,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error renewing certificate:', error);
      throw error;
    }
  },

  /**
   * Get certificate audit history
   */
  async getCertificateAuditHistory(certificateId, limit = 50, skip = 0) {
    try {
      const response = await api.get(`/certificates/${certificateId}/audit-history`, {
        params: { limit, skip }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit history:', error);
      throw error;
    }
  },

  /**
   * Verify a certificate (public, no auth required)
   */
  async verifyCertificate(certificateId) {
    try {
      const response = await api.get(`/certificates/verify/${certificateId}`);
      return response.data.verification_details;
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
  },

  /**
   * Revoke a certificate
   */
  async revokeCertificate(certificateId, reason = '') {
    try {
      const response = await api.post('/certificates/revoke', {
        certificateId,
        revocation_reason: reason
      });
      return response.data;
    } catch (error) {
      console.error('Error revoking certificate:', error);
      throw error;
    }
  },

  /**
   * Format certificate expiry date
   */
  formatExpiryDate(expiryDate) {
    return new Date(expiryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Get days remaining until expiry
   */
  getDaysRemaining(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return daysRemaining;
  },

  /**
   * Check if certificate is expiring soon (within 30 days)
   */
  isExpiringsoon(expiryDate) {
    const daysRemaining = this.getDaysRemaining(expiryDate);
    return daysRemaining <= 30 && daysRemaining > 0;
  },

  /**
   * Check if certificate is expired
   */
  isExpired(expiryDate) {
    return this.getDaysRemaining(expiryDate) <= 0;
  },

  /**
   * Download certificate file helper
   */
  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

export default CertificateService;
