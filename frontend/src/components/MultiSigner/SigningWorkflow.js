import React, { useState } from 'react';
import './SigningWorkflow.css';


import { LuX, LuTriangleAlert, LuCheck } from 'react-icons/lu';

/**
 * SigningWorkflow Component
 * Allows users to set up multi-signer workflow for a document
 * Configure signing method (sequential/parallel), add signers, set deadlines
 */
const SigningWorkflow = ({ 
  documentId, 
  onSignersAdded,
  onCancel,
  loading = false 
}) => {
  const [signingMethod, setSigningMethod] = useState('sequential');
  const [signers, setSigners] = useState([]);
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleAddSigner = () => {
    setError(null);

    if (!newSignerEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSignerEmail)) {
      setError('Invalid email address');
      return;
    }

    // Check for duplicates
    if (signers.some(s => s.email.toLowerCase() === newSignerEmail.toLowerCase())) {
      setError('This email is already added');
      return;
    }

    setSigners([
      ...signers,
      {
        id: Math.random().toString(36),
        email: newSignerEmail.trim(),
        can_comment: true
      }
    ]);
    setNewSignerEmail('');
  };

  const removeSigner = (signerId) => {
    setSigners(signers.filter(s => s.id !== signerId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (signers.length === 0) {
      setError('Please add at least one signer');
      return;
    }

    if (signingMethod === 'sequential' && signers.length > 5) {
      setError('Sequential signing is limited to 5 signers for performance reasons');
      return;
    }

    try {
      const response = await fetch(
        `/api/multi-signer/documents/${documentId}/signers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            signers: signers.map(s => ({
              email: s.email,
              can_comment: s.can_comment
            })),
            signingMethod,
            deadline: deadline ? new Date(deadline).toISOString() : null
          })
        }
      );

      const result = await response.json();

      if (!result.success) {
        setError(result.message || 'Failed to set up signers');
        return;
      }

      setSuccess(`Successfully added ${result.data.signers_added} signer${result.data.signers_added !== 1 ? 's' : ''}`);
      
      // Call callback after 1 second
      setTimeout(() => {
        onSignersAdded && onSignersAdded(result.data);
      }, 1000);
    } catch (err) {
      setError('Failed to add signers. Please try again.');
      console.error('Error adding signers:', err);
    }
  };

  return (
    <div className="signing-workflow-container">
      <div className="workflow-card">
        <h2 className="workflow-title">Setup Multi-Signer Workflow</h2>

        <form onSubmit={handleSubmit}>
          {/* Signing Method */}
          <div className="form-section">
            <label className="form-label">Signing Method</label>
            <div className="method-selector">
              <label className="method-option">
                <input
                  type="radio"
                  name="method"
                  value="sequential"
                  checked={signingMethod === 'sequential'}
                  onChange={(e) => setSigningMethod(e.target.value)}
                />
                <div className="method-content">
                  <span className="method-title">Sequential Signing</span>
                  <span className="method-desc">One signer at a time in order</span>
                </div>
              </label>

              <label className="method-option">
                <input
                  type="radio"
                  name="method"
                  value="parallel"
                  checked={signingMethod === 'parallel'}
                  onChange={(e) => setSigningMethod(e.target.value)}
                />
                <div className="method-content">
                  <span className="method-title">Parallel Signing</span>
                  <span className="method-desc">All signers sign simultaneously</span>
                </div>
              </label>
            </div>
          </div>

          {/* Add Signer */}
          <div className="form-section">
            <label className="form-label">Add Signers</label>
            <div className="signer-input-group">
              <input
                type="email"
                value={newSignerEmail}
                onChange={(e) => setNewSignerEmail(e.target.value)}
                placeholder="Enter signer's email address"
                className="signer-input"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSigner())}
              />
              <button
                type="button"
                onClick={handleAddSigner}
                className="btn btn-secondary"
              >
                Add Signer
              </button>
            </div>
          </div>

          {/* Signers List */}
          {signers.length > 0 && (
            <div className="form-section">
              <label className="form-label">
                Signers ({signers.length})
              </label>
              <div className="signers-input-list">
                {signers.map((signer, index) => (
                  <div key={signer.id} className="signer-input-item">
                    <div className="signer-order-input">
                      {signingMethod === 'sequential' ? (
                        <span>{index + 1}</span>
                      ) : (
                        <span>∥</span>
                      )}
                    </div>
                    <div className="signer-details">
                      <span className="signer-email">{signer.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSigner(signer.id)}
                      className="btn-remove"
                      title="Remove signer"
                    ><LuX /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deadline */}
          <div className="form-section">
            <label className="form-label">Signing Deadline (Optional)</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="form-input"
            />
            <span className="form-hint">
              When set, signers must sign by this date/time
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon"><LuTriangleAlert /></span>
              <span className="alert-text">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="alert alert-success">
              <span className="alert-icon"><LuCheck /></span>
              <span className="alert-text">{success}</span>
            </div>
          )}

          {/* Info Note */}
          <div className="info-box">
            <span className="info-icon">ℹ</span>
            <div className="info-content">
              <p>
                {signingMethod === 'sequential' 
                  ? 'Signers will sign in the order they were added. Each signer can only sign after the previous signer has completed.'
                  : 'All signers can sign at the same time. The document is complete once all signers have signed.'
                }
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || signers.length === 0}
            >
              {loading ? 'Setting up...' : 'Set Up Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SigningWorkflow;
