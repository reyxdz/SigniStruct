import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import DocumentViewer from '../../components/Signing/DocumentViewer';
import SignatureSelector from '../../components/Signing/SignatureSelector';
import SignaturePlacementTool from '../../components/Signing/SignaturePlacementTool';
import DocumentSigningService from '../../services/documentSigningService';
import './DocumentSignerPage.css';

/**
 * DocumentSignerPage
 * Main page for signing documents with digital signatures
 * 
 * Flow:
 * 1. User selects a signature from saved signatures
 * 2. User places signature on document pages
 * 3. User reviews and confirms
 * 4. Document is signed and uploaded to backend
 * 5. User sees confirmation and verification results
 */
const DocumentSignerPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // State Management
  const [document, setDocument] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [isPlacingSignature, setIsPlacingSignature] = useState(false);
  const [signaturePlacements, setSignaturePlacements] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [signingProgress, setSigningProgress] = useState(0);

  // Load document and signatures on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // In a real app, you'd fetch the document details
        // For now, we use placeholder data
        // const docResponse = await api.get(`/documents/${documentId}`);
        // setDocument(docResponse.data.document);

        // Mock document data
        setDocument({
          _id: documentId,
          title: 'Contract.pdf',
          file_url: '/uploads/contracts/contract.pdf',
          original_filename: 'Contract.pdf',
          num_pages: 3,
          file_size: 1024000,
          status: 'pending_signature',
          created_at: new Date().toISOString(),
          owner_id: user?.id
        });

        // Mock user signatures
        setSignatures([
          {
            _id: 'sig1',
            signature_type: 'Handwritten',
            signature_image: 'data:image/png;base64,...',
            is_default: true,
            created_at: new Date().toISOString()
          }
        ]);

        setIsLoading(false);
      } catch (err) {
        setError('Failed to load document. Please try again.');
        setIsLoading(false);
      }
    };

    if (documentId && user) {
      loadData();
    }
  }, [documentId, user]);

  // Handle signature selection
  const handleSelectSignature = (signatureId) => {
    setSelectedSignature(signatureId);
    setError(null);
  };

  // Handle toggling placement mode
  const handleTogglePlacement = () => {
    if (signaturePlacements.length === 0 && selectedSignature) {
      setIsPlacingSignature(!isPlacingSignature);
    } else if (isPlacingSignature) {
      setIsPlacingSignature(false);
    } else if (selectedSignature) {
      setIsPlacingSignature(true);
    } else {
      setError('Please select a signature first');
    }
  };

  // Handle signature placement
  const handleSignaturePlaced = (placement) => {
    setSignaturePlacements([...signaturePlacements, placement]);
    setIsPlacingSignature(false); // Turn off mode after placing one signature
  };

  // Handle placement removal
  const handleRemovePlacement = (index) => {
    setSignaturePlacements(signaturePlacements.filter((_, i) => i !== index));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (document?.num_pages || 1)) {
      setCurrentPage(newPage);
    }
  };

  // Handle signing confirmation
  const handleConfirmSigning = async () => {
    if (!selectedSignature || signaturePlacements.length === 0) {
      setError('Please place at least one signature before signing');
      return;
    }

    setShowConfirmDialog(true);
  };

  // Execute signing
  const handleExecuteSigning = async () => {
    try {
      setIsSigning(true);
      setSigningProgress(0);
      setError(null);
      setShowConfirmDialog(false);

      // Sign the document with the first placement
      const placement = signaturePlacements[0];
      setSigningProgress(30);

      const response = await DocumentSigningService.signDocument(
        documentId,
        selectedSignature,
        placement
      );

      setSigningProgress(70);

      if (response.success) {
        setSuccess(
          `Document signed successfully! Signature ID: ${response.signature._id}`
        );
        setSigningProgress(100);

        // Verify the document
        setTimeout(async () => {
          try {
            const verifyResponse =
              await DocumentSigningService.verifyDocument(documentId);
            setVerificationResult(verifyResponse.verification);
          } catch (verifyError) {
            console.error('Verification error:', verifyError);
          }
        }, 1000);

        // Reset form
        setTimeout(() => {
          setSignaturePlacements([]);
          setSelectedSignature(null);
          setIsSigning(false);
        }, 2000);
      }
    } catch (err) {
      setIsSigning(false);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to sign document. Please try again.'
      );
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (signaturePlacements.length > 0) {
      if (
        window.confirm(
          'Are you sure? You will lose all signature placements.'
        )
      ) {
        navigate('/documents');
      }
    } else {
      navigate('/documents');
    }
  };

  if (isLoading) {
    return (
      <div className="document-signer-page loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-signer-page">
      <div className="signer-header">
        <div className="header-content">
          <h1>📝 Sign Document</h1>
          <p className="subtitle">
            Place and confirm your digital signature on the document
          </p>
        </div>
        <button className="close-button" onClick={handleCancel}>
          ✕
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">❌</span>
          <div className="error-content">
            <p className="error-message">{error}</p>
            <button
              className="error-dismiss"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="success-banner">
          <span className="success-icon">✅</span>
          <div className="success-content">
            <p className="success-message">{success}</p>
            {verificationResult && (
              <p className="verification-status">
                Document Status: <strong>{verificationResult.is_valid ? '✓ Valid' : '✕ Invalid'}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {isSigning && (
        <div className="signing-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${signingProgress}%` }}
            ></div>
          </div>
          <p className="progress-text">
            {signingProgress < 30 && 'Preparing signature...'}
            {signingProgress >= 30 && signingProgress < 70 && 'Signing document...'}
            {signingProgress >= 70 && signingProgress < 100 && 'Verifying signature...'}
            {signingProgress === 100 && 'Complete!'}
          </p>
        </div>
      )}

      <div className="signer-container">
        <div className="signer-main">
          <DocumentViewer
            document={document}
            signaturePlacements={signaturePlacements}
            isPlacingSignature={isPlacingSignature}
            onSignaturePlaced={handleSignaturePlaced}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>

        <div className="signer-sidebar">
          <div className="sidebar-section">
            <SignatureSelector
              signatures={signatures}
              selectedSignature={selectedSignature}
              onSelectSignature={handleSelectSignature}
            />
          </div>

          <div className="sidebar-section">
            <SignaturePlacementTool
              isActive={isPlacingSignature}
              onTogglePlacement={handleTogglePlacement}
              signaturePlacements={signaturePlacements}
              onRemovePlacement={handleRemovePlacement}
              onConfirmPlacement={handleConfirmSigning}
              isLoading={isSigning}
              currentPage={currentPage}
            />
          </div>
        </div>
      </div>

      {showConfirmDialog && (
        <div className="confirm-dialog-overlay" onClick={() => setShowConfirmDialog(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Document Signing</h3>
            <div className="confirm-details">
              <p><strong>Document:</strong> {document?.title}</p>
              <p><strong>Signatures to Place:</strong> {signaturePlacements.length}</p>
              <p className="warning">
                ⚠️ Once signed, this action cannot be undone.
              </p>
            </div>
            <div className="confirm-actions">
              <button
                className="button button-secondary"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                onClick={handleExecuteSigning}
              >
                Confirm & Sign
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="signer-footer">
        <button className="button button-secondary" onClick={handleCancel}>
          ← Back
        </button>
        <div className="footer-info">
          <p className="info-text">
            {signaturePlacements.length > 0
              ? `Ready to sign with ${signaturePlacements.length} signature placement(s)`
              : 'Select a signature and place it on the document'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentSignerPage;
