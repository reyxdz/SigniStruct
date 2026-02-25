import React, { useState } from 'react';
import api from '../../services/api';
import SignaturePad from '../../components/Signature/SignaturePad';
import SignatureUploader from '../../components/Signature/SignatureUploader';
import './CreateSignaturePage.css';

/**
 * CreateSignaturePage
 * Main page for creating or uploading user signatures
 * Allows users to either draw or upload their signature
 */
const CreateSignaturePage = () => {
  const [activeTab, setActiveTab] = useState('draw'); // 'draw' or 'upload'
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetchingSignatures, setFetchingSignatures] = useState(true);

  // Fetch existing signatures on component mount
  React.useEffect(() => {
    fetchUserSignatures();
  }, []);

  /**
   * Fetch user's existing signatures
   */
  const fetchUserSignatures = async () => {
    try {
      setFetchingSignatures(true);
      const response = await api.get('/signatures/user');

      if (response.data.success) {
        setSignatures(response.data.signatures);
      }
    } catch (err) {
      console.error('Failed to fetch signatures:', err);
      setError('Failed to load signatures');
    } finally {
      setFetchingSignatures(false);
    }
  };

  /**
   * Handle signature completion (from either pad or uploader)
   */
  const handleSignatureComplete = async (signatureImage, signatureType) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Send signature to backend
      const response = await api.post('/signatures/create', {
        signature_image: signatureImage,
        signature_type: signatureType
      });

      if (response.data.success) {
        setSuccess(
          `Signature created successfully! (${signatureType})`
        );

        // Refresh signatures list
        await fetchUserSignatures();

        // Reset to draw tab after delay
        setTimeout(() => {
          setActiveTab('draw');
          setSuccess('');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to create signature:', err);
      setError(err.response?.data?.error || 'Failed to create signature');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set a signature as default
   */
  const handleSetDefault = async (signatureId) => {
    try {
      const response = await api.put(
        `/signatures/${signatureId}/set-default`,
        {}
      );

      if (response.data.success) {
        setSuccess('Default signature updated!');
        await fetchUserSignatures();
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      console.error('Failed to set default signature:', err);
      setError(err.response?.data?.error || 'Failed to set default signature');
    }
  };

  /**
   * Delete a signature
   */
  const handleDeleteSignature = async (signatureId) => {
    if (!window.confirm('Are you sure you want to delete this signature?')) {
      return;
    }

    try {
      const response = await api.delete(`/signatures/${signatureId}`);

      if (response.data.success) {
        setSuccess('Signature deleted successfully');
        await fetchUserSignatures();
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      console.error('Failed to delete signature:', err);
      setError(err.response?.data?.error || 'Failed to delete signature');
    }
  };

  return (
    <div className="create-signature-page">
      <div className="signature-page-container">
        {/* Header Section */}
        <div className="page-header">
          <h1>Manage Your Signatures</h1>
          <p className="page-subtitle">
            Create, upload, or manage your digital signatures
          </p>
        </div>

        {/* Alerts */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Main Content */}
        <div className="signature-content">
          {/* Create Signature Section */}
          <div className="create-section">
            <div className="tab-navigation">
              <button
                className={`tab-btn ${activeTab === 'draw' ? 'active' : ''}`}
                onClick={() => setActiveTab('draw')}
                disabled={loading}
              >
                Draw Signature
              </button>
              <button
                className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
                disabled={loading}
              >
                Upload Image
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'draw' && (
                <SignaturePad
                  onSignatureComplete={handleSignatureComplete}
                />
              )}
              {activeTab === 'upload' && (
                <SignatureUploader
                  onSignatureComplete={handleSignatureComplete}
                  onCancel={() => {
                    setError('');
                    setSuccess('');
                  }}
                />
              )}
            </div>
          </div>

          {/* Existing Signatures Section */}
          <div className="signatures-section">
            <h2>Your Signatures</h2>
            {fetchingSignatures ? (
              <p className="loading-text">Loading signatures...</p>
            ) : signatures.length === 0 ? (
              <p className="empty-state">
                No signatures created yet. Create one to get started!
              </p>
            ) : (
              <div className="signatures-grid">
                {signatures.map((signature) => (
                  <div key={signature._id} className="signature-card">
                    <div className="signature-card-header">
                      <span className="signature-type">
                        {signature.signature_type === 'handwritten'
                          ? '✏️ Drawn'
                          : signature.signature_type === 'uploaded'
                          ? '📤 Uploaded'
                          : '🖨️ Printed'}
                      </span>
                      {signature.is_default && (
                        <span className="default-badge">Default</span>
                      )}
                    </div>

                    {signature.signature_image && (
                      <div className="signature-preview">
                        <img
                          src={signature.signature_image}
                          alt="Signature preview"
                        />
                      </div>
                    )}

                    <div className="signature-meta">
                      <small>
                        {new Date(signature.created_at).toLocaleDateString()}
                      </small>
                    </div>

                    <div className="signature-card-actions">
                      {!signature.is_default && (
                        <button
                          className="btn-action btn-set-default"
                          onClick={() => handleSetDefault(signature._id)}
                        >
                          Set as Default
                        </button>
                      )}
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteSignature(signature._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSignaturePage;
