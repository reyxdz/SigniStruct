import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiX, FiPlus } from 'react-icons/fi';
import './SignatureSelectorModal.css';

/**
 * SignatureSelectorModal Component
 * Allows users to select an existing signature or draw a new one
 */
const SignatureSelectorModal = ({
  onSignatureComplete,
  onCancel,
  fieldName,
  onDrawNew
}) => {
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignatureId, setSelectedSignatureId] = useState(null);
  const [error, setError] = useState('');

  // Fetch user's saved signatures
  useEffect(() => {
    fetchSignatures();
  }, []);

  const fetchSignatures = async () => {
    try {
      setLoading(true);
      const response = await api.get('/signatures/user');
      if (response.data.success) {
        setSignatures(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch signatures:', err);
      setError('Failed to load your signatures');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSignature = () => {
    if (!selectedSignatureId) {
      setError('Please select a signature');
      return;
    }

    const selected = signatures.find(s => s._id === selectedSignatureId);
    if (selected) {
      onSignatureComplete(selected.signature_image);
    }
  };

  return (
    <div className="signature-selector-overlay">
      <div className="signature-selector-modal">
        {/* Header */}
        <div className="selector-header">
          <h2>Select or Draw Signature{fieldName ? ` - ${fieldName}` : ''}</h2>
          <button className="close-btn" onClick={onCancel}>
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="selector-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your signatures...</p>
            </div>
          ) : signatures.length > 0 ? (
            <>
              <div className="signatures-section">
                <h3>Your Signatures</h3>
                <div className="signatures-grid">
                  {signatures.map((sig) => (
                    <div
                      key={sig._id}
                      className={`signature-item ${selectedSignatureId === sig._id ? 'selected' : ''}`}
                      onClick={() => setSelectedSignatureId(sig._id)}
                    >
                      <img
                        src={sig.signature_image}
                        alt="Saved signature"
                        className="signature-preview"
                      />
                      <div className="signature-meta">
                        <span className="sig-type">{sig.signature_type}</span>
                        {sig.is_default && <span className="sig-default">Default</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="divider">
                <span>or</span>
              </div>

              <div className="draw-new-section">
                <button className="draw-new-btn" onClick={onDrawNew}>
                  <FiPlus size={18} />
                  Draw New Signature
                </button>
              </div>
            </>
          ) : (
            <div className="no-signatures-state">
              <p>You haven't saved any signatures yet</p>
              <button className="draw-new-btn" onClick={onDrawNew}>
                <FiPlus size={18} />
                Draw Your First Signature
              </button>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Footer */}
        {signatures.length > 0 && selectedSignatureId && (
          <div className="selector-footer">
            <button className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button className="confirm-btn" onClick={handleSelectSignature}>
              Use This Signature
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignatureSelectorModal;
