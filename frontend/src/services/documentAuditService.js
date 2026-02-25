/**
 * Document Audit Service
 * 
 * API client for fetching audit logs and verification history
 */

import api from './api';

class DocumentAuditService {
  /**
   * Get verification history for a document
   * 
   * @param {string} documentId - Document to get history for
   * @param {object} options - Query options
   * @returns {Promise<object>} Verification history with pagination
   */
  async getVerificationHistory(documentId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const response = await api.get(
        `/documents/${documentId}/verification-history`,
        {
          params: { limit, offset }
        }
      );

      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Failed to fetch verification history');
    }
  }

  /**
   * Get signature audit trail
   * 
   * @param {string} signatureId - Signature to get audit trail for
   * @returns {Promise<object>} Complete audit trail
   */
  async getSignatureAuditTrail(signatureId) {
    try {
      const response = await api.get(`/signatures/${signatureId}/audit-trail`);
      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Failed to fetch audit trail');
    }
  }

  /**
   * Get all audit logs with optional filters
   * 
   * @param {object} filters - Filter options
   *   - documentId: Filter by document
   *   - userId: Filter by user
   *   - action: Filter by action type
   *   - startDate: Filter by start date
   *   - endDate: Filter by end date
   *   - limit: Results per page (default: 50)
   *   - offset: Pagination offset (default: 0)
   * @returns {Promise<object>} Filtered audit logs
   */
  async getAuditLogs(filters = {}) {
    try {
      const response = await api.get('/audit-logs', {
        params: {
          documentId: filters.documentId,
          userId: filters.userId,
          action: filters.action,
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString(),
          limit: filters.limit || 50,
          offset: filters.offset || 0
        }
      });

      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Failed to fetch audit logs');
    }
  }

  /**
   * Download compliance report
   * 
   * @param {object} filters - Report filters
   *   - startDate: Report period start
   *   - endDate: Report period end
   *   - userId: Filter by user
   *   - action: Filter by action
   * @returns {Promise<Blob>} PDF file blob
   */
  async downloadComplianceReport(filters = {}) {
    try {
      const response = await api.get('/compliance-report', {
        params: {
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString(),
          userId: filters.userId,
          action: filters.action
        },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `compliance-report-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Failed to download compliance report');
    }
  }

  /**
   * Get unique values for filter options
   * 
   * @param {string} field - Field name (documentId, userId, action)
   * @returns {Promise<array>} Unique values
   */
  async getFilterOptions(field) {
    try {
      const validFields = ['documentId', 'userId', 'action'];

      if (!validFields.includes(field)) {
        throw new Error(`Invalid field: ${field}`);
      }

      const response = await api.get(`/audit-logs/filters/${field}`);
      return response.data.values || [];
    } catch (error) {
      throw this._handleError(error, `Failed to fetch ${field} options`);
    }
  }

  /**
   * Get document verification status
   * 
   * @param {string} documentId - Document to check
   * @returns {Promise<object>} Current verification status
   */
  async getDocumentVerificationStatus(documentId) {
    try {
      const response = await api.get(`/documents/${documentId}/verification-status`);
      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Failed to fetch verification status');
    }
  }

  /**
   * Export audit trail as CSV
   * 
   * @param {object} filters - Export filters
   * @returns {Promise<Blob>} CSV file blob
   */
  async exportAuditTrailAsCSV(filters = {}) {
    try {
      const response = await api.get('/audit-logs/export/csv', {
        params: {
          documentId: filters.documentId,
          userId: filters.userId,
          action: filters.action,
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString()
        },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-trail-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Failed to export audit trail');
    }
  }

  /**
   * Search audit logs with full-text search
   * 
   * @param {string} query - Search query
   * @param {object} options - Search options
   *   - limit: Results limit (default: 50)
   *   - offset: Pagination offset
   * @returns {Promise<object>} Search results
   */
  async searchAuditLogs(query, options = {}) {
    try {
      if (!query || query.trim().length === 0) {
        throw new Error('Search query is required');
      }

      const response = await api.get('/audit-logs/search', {
        params: {
          q: query,
          limit: options.limit || 50,
          offset: options.offset || 0
        }
      });

      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Search failed');
    }
  }

  /**
   * Get statistics for audit dashboard
   * 
   * @param {object} filters - Statistical period filters
   * @returns {Promise<object>} Audit statistics
   */
  async getAuditStatistics(filters = {}) {
    try {
      const response = await api.get('/audit-logs/statistics', {
        params: {
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString(),
          documentId: filters.documentId,
          userId: filters.userId
        }
      });

      return response.data;
    } catch (error) {
      throw this._handleError(error, 'Failed to fetch statistics');
    }
  }

  /**
   * Private: Handle and format API errors
   * 
   * @private
   */
  _handleError(error, defaultMessage) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.message) {
      throw new Error(error.message);
    }
    throw new Error(defaultMessage);
  }
}

export default new DocumentAuditService();
