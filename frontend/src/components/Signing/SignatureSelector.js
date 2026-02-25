import React, { useState, useEffect } from 'react';
import './SignatureSelector.css';

/**
 * SignatureSelector Component
 * Allows user to select or create a signature for document signing
 * 
 * Props:
 *   - onSelectSignature(signatureId): Callback when signature is selected
 *   - selectedSignature: Currently selected signature ID
 */
const SignatureSelector = ({ onSelectSignature, selectedSignature, signatures = [] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Auto-select first signature if available
    if (signatures.length > 0 && !selectedSignature) {
      onSelectSignature(signatures[0]._id);
    }
  }, [signatures]);

  const handleSelectSignature = (signatureId) => {
    onSelectSignature(signatureId);
  };

  return (
    <div className="signature-selector">
      <div className="selector-header">
        <h3>Select Signature</h3>
        <p className="selector-subtitle">Choose a saved signature to apply to the document</p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span> {error}
        </div>
      )}

      {isLoading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading signatures...</p>
        </div>
      ) : signatures.length > 0 ? (
        <div className="signatures-grid">
          {signatures.map((signature) => (
            <div
              key={signature._id}
              className={`signature-card ${selectedSignature === signature._id ? 'selected' : ''}`}
              onClick={() => handleSelectSignature(signature._id)}
            >
              <div className="signature-preview">
                {signature.signature_image && (
                  <img
                    src={signature.signature_image}
                    alt={`Signature ${signature.signature_type}`}
                    className="signature-image"
                  />
                )}
              </div>
              <div className="signature-info">
                <p className="signature-type">
                  <strong>{signature.signature_type || 'Untitled'}</strong>
                </p>
                <p className="signature-date">
                  Created: {new Date(signature.created_at).toLocaleDateString()}
                </p>
                {signature.is_default && (
                  <span className="default-badge">Default</span>
                )}
              </div>
              {selectedSignature === signature._id && (
                <div className="selected-checkmark">✓</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-signatures">
          <div className="empty-state">
            <p>📝 No signatures found</p>
            <p className="subtitle">
              Please create a signature first before signing documents
            </p>
          </div>
        </div>
      )}

      <div className="selector-footer">
        <p className="info-text">
          💡 Tip: You can create or manage signatures in your profile settings
        </p>
      </div>
    </div>
  );
};

export default SignatureSelector;
