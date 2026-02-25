import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DocumentList.css';

const DocumentList = ({ refreshTrigger }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedDocId, setExpandedDocId] = useState(null);
  const [deletingDocId, setDeletingDocId] = useState(null);

  /**
   * Fetch documents from backend
   */
  const fetchDocuments = async (status = null) => {
    setLoading(true);
    setError('');

    try {
      const config = {};
      if (status && status !== 'all') {
        config.params = { status };
      }

      const response = await axios.get('/api/documents', config);
      setDocuments(response.data.documents || []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch documents';
      setError(errorMsg);
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load documents on component mount and when refreshTrigger changes
   */
  useEffect(() => {
    fetchDocuments(filter !== 'all' ? filter : null);
  }, [refreshTrigger]);

  /**
   * Handle filter change
   */
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    fetchDocuments(newFilter !== 'all' ? newFilter : null);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status) => {
    const colors = {
      draft: '#ffc107',
      pending_signature: '#17a2b8',
      partially_signed: '#0d6efd',
      fully_signed: '#28a745',
      archived: '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  /**
   * Get status display text
   */
  const getStatusDisplay = (status) => {
    const display = {
      draft: 'Draft',
      pending_signature: 'Pending Signature',
      partially_signed: 'Partially Signed',
      fully_signed: 'Fully Signed',
      archived: 'Archived'
    };
    return display[status] || status;
  };

  /**
   * Handle document deletion
   */
  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setDeletingDocId(docId);

    try {
      await axios.delete(`/api/documents/${docId}`);
      setDocuments(documents.filter(doc => doc._id !== docId));
      setExpandedDocId(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete document';
      setError(errorMsg);
      console.error('Error deleting document:', err);
    } finally {
      setDeletingDocId(null);
    }
  };

  /**
   * Toggle document details expansion
   */
  const toggleExpand = (docId) => {
    setExpandedDocId(expandedDocId === docId ? null : docId);
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="document-list">
      <div className="list-header">
        <h2>My Documents</h2>

        {/* Filter Buttons */}
        <div className="filter-buttons">
          {['all', 'draft', 'pending_signature', 'partially_signed', 'fully_signed'].map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`filter-btn ${filter === status ? 'active' : ''}`}
            >
              {getStatusDisplay(status)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="list-alert error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No documents found</h3>
          <p>Upload your first document to get started</p>
        </div>
      ) : (
        <div className="documents-container">
          {documents.map((doc) => (
            <div key={doc._id} className="document-card">
              {/* Card Header */}
              <div className="card-header" onClick={() => toggleExpand(doc._id)}>
                <div className="header-content">
                  <div className="doc-icon">📄</div>
                  <div className="doc-info">
                    <h3 className="doc-title">{doc.title}</h3>
                    <div className="doc-meta">
                      <span className="meta-item">
                        Uploaded: {formatDate(doc.created_at)}
                      </span>
                      <span className="meta-item">
                        Size: {formatFileSize(doc.file_size)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="doc-status">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(doc.status) }}
                  >
                    {getStatusDisplay(doc.status)}
                  </span>
                  <span className={`expand-icon ${expandedDocId === doc._id ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Card Details (Expandable) */}
              {expandedDocId === doc._id && (
                <div className="card-details">
                  {doc.description && (
                    <div className="detail-section">
                      <label>Description</label>
                      <p>{doc.description}</p>
                    </div>
                  )}

                  <div className="detail-section">
                    <label>File Hash (SHA-256)</label>
                    <code className="hash-display">{doc.file_hash_sha256}</code>
                  </div>

                  <div className="detail-row">
                    <div className="detail-section">
                      <label>Original Filename</label>
                      <p>{doc.original_filename}</p>
                    </div>
                    <div className="detail-section">
                      <label>Pages</label>
                      <p>{doc.num_pages || '1'}</p>
                    </div>
                  </div>

                  {doc.signers && doc.signers.length > 0 && (
                    <div className="detail-section">
                      <label>Signers ({doc.signers.length})</label>
                      <div className="signers-list">
                        {doc.signers.map((signer, idx) => (
                          <div key={idx} className="signer-item">
                            <span className="signer-email">{signer.email}</span>
                            <span
                              className="signer-status"
                              style={{
                                color: signer.status === 'signed' ? '#28a745' : '#ffc107'
                              }}
                            >
                              {signer.status === 'signed' ? '✓ Signed' : '○ Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="card-actions">
                    {doc.status === 'draft' && (
                      <button
                        onClick={() => handleDelete(doc._id)}
                        disabled={deletingDocId === doc._id}
                        className="action-btn delete"
                      >
                        {deletingDocId === doc._id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}

                    {doc.status !== 'archived' && (
                      <button className="action-btn primary">
                        Prepare for Signing
                      </button>
                    )}

                    <button className="action-btn secondary">
                      View Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
