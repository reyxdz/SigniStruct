import React, { useState, useEffect } from 'react';
import './SignersList.css';


import { LuCheck, LuX, LuUsers, LuMessageSquare } from 'react-icons/lu';

/**
 * SignersList Component
 * Displays list of signers with their status in multi-signer workflow
 * Shows signing order, current status, deadline, and signature date
 */
const SignersList = ({ 
  documentId, 
  signers = [], 
  signingMethod = 'sequential',
  onRetry,
  loading = false
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'signed':
        return <LuCheck />;
      case 'pending':
        return '⏳';
      case 'declined':
        return <LuX />;
      case 'expired':
        return '⏱';
      default:
        return '•';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'signed':
        return 'success';
      case 'pending':
        return 'pending';
      case 'declined':
        return 'danger';
      case 'expired':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline';
    
    const date = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return `Expired ${Math.abs(daysUntil)} days ago`;
    }
    if (daysUntil === 0) {
      return 'Expires today';
    }
    return `${daysUntil} day${daysUntil !== 1 ? 's' : ''} left`;
  };

  if (loading) {
    return (
      <div className="signers-list-container loading">
        <div className="spinner"></div>
        <p>Loading signers...</p>
      </div>
    );
  }

  if (!signers || signers.length === 0) {
    return (
      <div className="signers-list-container empty">
        <div className="empty-state">
          <p className="empty-icon"><LuUsers /></p>
          <p className="empty-text">No signers added yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="signers-list-container">
      <div className="signers-list-header">
        <h3>Signing Workflow</h3>
        <span className="signing-method-badge">
          {signingMethod === 'sequential' ? 'Sequential' : 'Parallel'}
        </span>
      </div>

      <div className="signers-timeline">
        {signers.map((signer, index) => (
          <div 
            key={signer._id} 
            className={`signer-card status-${getStatusColor(signer.status)}`}
          >
            {/* Left side: Order and Status */}
            <div className="signer-left">
              <div className="signer-order">
                {signingMethod === 'sequential' ? (
                  <span className="order-number">{index + 1}</span>
                ) : (
                  <span className="parallel-indicator">∥</span>
                )}
              </div>
              <div className={`status-badge ${signer.status}`}>
                <span className="status-icon">
                  {getStatusIcon(signer.status)}
                </span>
                <span className="status-text">
                  {signer.status.charAt(0).toUpperCase() + signer.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Middle: Signer Info */}
            <div className="signer-info">
              <div className="signer-name">
                {signer.signer_name || 'Unknown'}
              </div>
              <div className="signer-email">
                {signer.signer_email}
              </div>
              
              {signer.status === 'signed' && signer.signed_at && (
                <div className="signed-date">
                  Signed on {new Date(signer.signed_at).toLocaleDateString()}
                </div>
              )}
              
              {signer.status === 'declined' && (
                <div className="decline-note">
                  Declined signing
                </div>
              )}

              {signer.comments_count > 0 && (
                <div className="comments-badge">
                  <LuMessageSquare /> {signer.comments_count} comment{signer.comments_count !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Right side: Deadline and Actions */}
            <div className="signer-right">
              {signer.deadline && (
                <div className={`deadline ${signer.is_expired ? 'expired' : ''}`}>
                  {formatDeadline(signer.deadline)}
                </div>
              )}

              {signer.status === 'pending' && signer.reminder_count > 0 && (
                <div className="reminders-sent">
                  {signer.reminder_count} reminder{signer.reminder_count !== 1 ? 's' : ''} sent
                </div>
              )}

              {signer.status === 'signed' && (
                <div className="signed-checkmark"><LuCheck /> Signed</div>
              )}
            </div>

            {/* Timeline connector for sequential */}
            {signingMethod === 'sequential' && index < signers.length - 1 && (
              <div className="timeline-connector">
                {signer.status === 'signed' ? (
                  <span className="connector-complete">→</span>
                ) : (
                  <span className="connector-pending">⋮</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="signers-summary">
        <div className="summary-item">
          <span className="summary-label">Total Signers:</span>
          <span className="summary-value">{signers.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Signed:</span>
          <span className="summary-value success">
            {signers.filter(s => s.status === 'signed').length}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Pending:</span>
          <span className="summary-value pending">
            {signers.filter(s => s.status === 'pending').length}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Declined:</span>
          <span className="summary-value danger">
            {signers.filter(s => s.status === 'declined').length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignersList;
