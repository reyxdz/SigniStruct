import React, { useState, useEffect } from 'react';
import './AuditTrail.css';

/**
 * AuditTrail Component
 * 
 * Displays audit trail events in a timeline format
 * Shows event type, timestamp, user, and status
 */
const AuditTrail = ({ events = [], loading = false, error = null, onRetry = null }) => {
  // Map action types to display labels and icons
  const actionMetadata = {
    SIGNATURE_CREATED: {
      label: 'Signature Created',
      icon: '✍️',
      color: 'primary',
      category: 'signature'
    },
    SIGNATURE_VERIFIED: {
      label: 'Signature Verified',
      icon: '✓',
      color: 'success',
      category: 'verification'
    },
    SIGNATURE_REVOKED: {
      label: 'Signature Revoked',
      icon: '✕',
      color: 'danger',
      category: 'signature'
    },
    CERTIFICATE_GENERATED: {
      label: 'Certificate Generated',
      icon: '🔐',
      color: 'primary',
      category: 'certificate'
    },
    CERTIFICATE_VERIFIED: {
      label: 'Certificate Verified',
      icon: '✓',
      color: 'success',
      category: 'verification'
    },
    CERTIFICATE_REVOKED: {
      label: 'Certificate Revoked',
      icon: '✕',
      color: 'danger',
      category: 'certificate'
    },
    DOCUMENT_VERIFIED: {
      label: 'Document Verified',
      icon: '📋',
      color: 'success',
      category: 'verification'
    },
    DOCUMENT_UPLOADED: {
      label: 'Document Uploaded',
      icon: '📤',
      color: 'primary',
      category: 'document'
    },
    DOCUMENT_DELETED: {
      label: 'Document Deleted',
      icon: '🗑️',
      color: 'danger',
      category: 'document'
    }
  };

  /**
   * Format timestamp to readable string
   */
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const eventDate = new Date(timestamp);
    const diffMs = now - eventDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatTimestamp(timestamp);
  };

  /**
   * Get status badge color and text
   */
  const getStatusBadge = (status) => {
    const statusMap = {
      VALID: { color: 'success', label: '✓ Valid' },
      INVALID: { color: 'danger', label: '✕ Invalid' },
      PENDING: { color: 'warning', label: '⧖ Pending' },
      SUCCESS: { color: 'success', label: '✓ Success' },
      FAILED: { color: 'danger', label: '✕ Failed' },
      REVOKED: { color: 'danger', label: '✕ Revoked' }
    };

    return statusMap[status] || { color: 'default', label: status };
  };

  if (loading) {
    return (
      <div className="audit-trail-container loading">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading audit trail...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="audit-trail-container error">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <p className="error-title">Failed to Load Audit Trail</p>
            <p className="error-message">{error}</p>
            {onRetry && (
              <button className="button button-secondary" onClick={onRetry}>
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="audit-trail-container empty">
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p className="empty-title">No Audit Events</p>
          <p className="empty-text">No audit trail events to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-trail-container">
      <div className="timeline">
        {events.map((event, index) => {
          const metadata = actionMetadata[event.action] || {
            label: event.action,
            icon: '•',
            color: 'default'
          };

          const status = getStatusBadge(event.status);

          return (
            <div key={index} className={`timeline-item timeline-item--${metadata.color}`}>
              <div className="timeline-marker">
                <div className="marker-icon">{metadata.icon}</div>
                <div className="marker-line"></div>
              </div>

              <div className="timeline-content">
                <div className="event-header">
                  <div className="event-title-section">
                    <h4 className="event-title">{metadata.label}</h4>
                    <time className="event-timestamp" title={formatTimestamp(event.timestamp)}>
                      {formatRelativeTime(event.timestamp)}
                    </time>
                  </div>

                  {status && (
                    <span className={`status-badge status-badge--${status.color}`}>
                      {status.label}
                    </span>
                  )}
                </div>

                <div className="event-details">
                  {event.user && (
                    <div className="detail-row">
                      <span className="detail-label">👤 User:</span>
                      <span className="detail-value">{event.user}</span>
                    </div>
                  )}

                  {event.user_email && (
                    <div className="detail-row">
                      <span className="detail-label">✉️ Email:</span>
                      <span className="detail-value">{event.user_email}</span>
                    </div>
                  )}

                  {event.ip_address && event.ip_address !== 'unknown' && (
                    <div className="detail-row">
                      <span className="detail-label">🌐 IP Address:</span>
                      <span className="detail-value">{event.ip_address}</span>
                    </div>
                  )}

                  {event.details && Object.keys(event.details).length > 0 && (
                    <div className="event-metadata">
                      <details className="metadata-details">
                        <summary className="metadata-summary">Additional Details</summary>
                        <div className="metadata-content">
                          {Object.entries(event.details).map(([key, value]) => (
                            <div key={key} className="metadata-item">
                              <span className="metadata-key">{key}:</span>
                              <span className="metadata-value">
                                {typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditTrail;
