import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiArrowLeft, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import DocumentViewer from '../../components/DocumentEditor/DocumentViewer';
import SignatureCanvas from '../../components/DocumentEditor/SignatureCanvas';
import './DocumentSigningPage.css';

/**
 * DocumentSigningPage
 * Page for recipients to view and sign documents
 * Verifies signing token and displays only fields assigned to the recipient
 */
const DocumentSigningPage = () => {
  const { documentId, signingToken } = useParams();
  const navigate = useNavigate();

  // Document state
  const [document, setDocument] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Signing state
  const [fieldValues, setFieldValues] = useState({}); // fieldId -> fieldValue
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signingComplete, setSigningComplete] = useState(false);

  // Fetch document on mount
  useEffect(() => {
    fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, signingToken]);

  /**
   * Fetch document for signing from backend
   * Validates token and gets recipient's fields
   */
  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔐 Fetching document for signing');
      const response = await api.get(`/documents/${documentId}/sign/${signingToken}`);

      if (response.data.success) {
        const { document: doc, recipient: recip, signingStatus } = response.data.data;
        console.log('✅ Document fetched successfully');
        console.log('  Fields for recipient:', doc.fields.length);
        console.log('  Recipient:', recip.email);
        console.log('  Signing status:', signingStatus);

        setDocument(doc);
        setRecipient(recip);

        // Initialize field values
        const initialValues = {};
        doc.fields.forEach(field => {
          initialValues[field.id] = field.value || '';
        });
        setFieldValues(initialValues);

        // If already signed, show completion page
        if (signingStatus === 'signed') {
          setSigningComplete(true);
        }
      }
    } catch (err) {
      console.error('❌ Failed to fetch document:', err);

      if (err.response?.status === 401) {
        setError('Your signing link has expired or is invalid. Please request a new invitation from the document owner.');
      } else if (err.response?.status === 404) {
        setError('Document not found. The document may have been deleted.');
      } else {
        const errorMsg = err.response?.data?.error || 'Failed to load document. Please try again later.';
        setError(`Error: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle field value change for text fields
   */
  const handleFieldChange = (fieldId, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  /**
   * Open signature pad for signature field
   */
  const handleSignatureFieldClick = (fieldId) => {
    setSelectedFieldId(fieldId);
    setShowSignaturePad(true);
  };

  /**
   * Save signature from canvas
   */
  const handleSignatureSave = (signatureData) => {
    if (selectedFieldId) {
      setFieldValues(prev => ({
        ...prev,
        [selectedFieldId]: signatureData
      }));
      setShowSignaturePad(false);
      setSelectedFieldId(null);
    }
  };

  /**
   * Check if all required fields are signed
   */
  const checkAllFieldsSigned = () => {
    if (!document || document.fields.length === 0) {
      return false;
    }

    return document.fields.every(field => {
      const value = fieldValues[field.id];
      return value && value.trim().length > 0;
    });
  };

  /**
   * Submit signed document
   */
  const handleSubmitSigning = async () => {
    if (!checkAllFieldsSigned()) {
      alert('❌ Please sign all fields before submitting.');
      return;
    }

    // Show confirmation dialog
    const confirmSubmit = window.confirm(
      'Are you sure you want to sign this document? This action cannot be undone.'
    );

    if (!confirmSubmit) {
      return;
    }

    try {
      setIsSigning(true);
      console.log('📝 Submitting signed document');

      // Submit all fields
      for (const field of document.fields) {
        const fieldValue = fieldValues[field.id];
        const isLastField = document.fields.indexOf(field) === document.fields.length - 1;

        await api.post(`/documents/${documentId}/sign/${signingToken}`, {
          fieldId: field.id,
          fieldValue: fieldValue,
          allFieldsSigned: isLastField
        });

        console.log(`  ✅ Field ${field.id} submitted`);
      }

      console.log('✅ Document signed successfully');
      setSigningComplete(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/documents');
      }, 3000);
    } catch (err) {
      console.error('❌ Failed to submit signing:', err);

      const errorMsg = err.response?.data?.error || 'Failed to submit your signature. Please try again.';
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsSigning(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingMessage}>
          🔐 Verifying your signing link...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <FiAlertCircle style={styles.errorIcon} />
          <div style={styles.errorMessage}>{error}</div>
          <button
            onClick={() => navigate('/documents')}
            style={styles.backButton}
          >
            ← Back to Documents
          </button>
        </div>
      </div>
    );
  }

  // Signing complete page
  if (signingComplete) {
    return (
      <div style={styles.container}>
        <div style={styles.completionCard}>
          <FiCheck style={styles.successIcon} />
          <h1 style={styles.completionTitle}>✓ Document Signed Successfully</h1>
          <p style={styles.completionMessage}>
            Thank you for signing. The document has been recorded and the sender will be notified.
          </p>
          <button
            onClick={() => navigate('/documents')}
            style={styles.primaryButton}
          >
            Return to Documents
          </button>
        </div>
      </div>
    );
  }

  // Main signing view
  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            onClick={() => navigate('/documents')}
            style={styles.backBtn}
          >
            <FiArrowLeft style={{ marginRight: spacing.sm }} />
            Back
          </button>
          <div style={styles.documentInfo}>
            <h1 style={styles.documentTitle}>{document?.title || 'Document Signing'}</h1>
            {recipient && (
              <p style={styles.recipientInfo}>
                Signing as: {recipient.name} ({recipient.email})
              </p>
            )}
          </div>
        </div>

        <div style={styles.headerRight}>
          <button
            onClick={handleSubmitSigning}
            disabled={isSigning || !checkAllFieldsSigned()}
            style={{
              ...styles.headerBtn,
              ...styles.submitBtn,
              opacity: !checkAllFieldsSigned() ? 0.5 : 1
            }}
          >
            <FiCheck style={{ marginRight: spacing.xs }} />
            {isSigning ? 'Submitting...' : 'Sign & Submit'}
          </button>
        </div>
      </div>

      {/* Signing Progress */}
      <div style={styles.progressBar}>
        <div style={styles.progressText}>
          Signed: {Object.values(fieldValues).filter(v => v && v.trim().length > 0).length} of {document?.fields?.length || 0} fields
        </div>
        <div style={styles.progressFill}>
          <div
            style={{
              ...styles.progressBar,
              width: `${document?.fields?.length ? (Object.values(fieldValues).filter(v => v && v.trim().length > 0).length / document.fields.length) * 100 : 0}%`,
              backgroundColor: colors.green,
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Main Editor Container */}
      <div style={styles.editorContainer}>
        {/* Document Viewer */}
        <DocumentViewer
          documentId={documentId}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          fields={document?.fields || []}
          selectedFieldId={selectedFieldId}
          onFieldSelect={setSelectedFieldId}
          isSigningMode={true}
          fieldValues={fieldValues}
        />

        {/* Right Panel - Sign Fields */}
        <div style={styles.signPanel}>
          <div style={styles.signPanelHeader}>
            <h2 style={styles.signPanelTitle}>Fields to Sign</h2>
          </div>

          <div style={styles.signFieldsList}>
            {document?.fields?.map((field, idx) => (
              <div key={field.id} style={styles.fieldItem}>
                <div style={styles.fieldHeader}>
                  <span style={styles.fieldLabel}>{field.label}</span>
                  {fieldValues[field.id] && fieldValues[field.id].trim().length > 0 ? (
                    <FiCheck style={styles.fieldSignedIcon} />
                  ) : (
                    <span style={styles.fieldPendingIcon}>◯</span>
                  )}
                </div>

                {field.fieldType === 'signature' ? (
                  <button
                    onClick={() => handleSignatureFieldClick(field.id)}
                    style={styles.signatureButton}
                  >
                    {fieldValues[field.id] ? '✓ Signed' : '📝 Add Signature'}
                  </button>
                ) : (
                  <input
                    type={field.fieldType === 'email' ? 'email' : 'text'}
                    placeholder={`Enter your ${field.label.toLowerCase()}`}
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    style={styles.textInput}
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmitSigning}
            disabled={isSigning || !checkAllFieldsSigned()}
            style={{
              ...styles.submitButton,
              opacity: !checkAllFieldsSigned() ? 0.5 : 1
            }}
          >
            Sign & Submit Document
          </button>
        </div>
      </div>

      {/* Signature Canvas Modal */}
      {showSignaturePad && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Draw Your Signature</h2>
              <button
                onClick={() => setShowSignaturePad(false)}
                style={styles.closeButton}
              >
                <FiX />
              </button>
            </div>

            <SignatureCanvas
              onSignatureComplete={handleSignatureSave}
              onCancel={() => setShowSignaturePad(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Inline Styles
 */
const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    backgroundColor: colors.lightGray,
    fontFamily: 'inherit',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: colors.lightGray,
    gap: spacing.lg,
  },
  loadingMessage: {
    fontSize: typography.sizes.lg,
    color: colors.gray600,
  },
  errorCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    gap: spacing.md,
  },
  errorIcon: {
    fontSize: '3rem',
    color: colors.red,
  },
  errorMessage: {
    fontSize: typography.sizes.base,
    color: '#dc2626',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  completionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    gap: spacing.md,
  },
  successIcon: {
    fontSize: '3rem',
    color: colors.green,
  },
  completionTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray900,
    margin: 0,
  },
  completionMessage: {
    fontSize: typography.sizes.base,
    color: colors.gray600,
    textAlign: 'center',
    margin: 0,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    cursor: 'pointer',
    transition: transitions.fast,
  },
  backButton: {
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    cursor: 'pointer',
    transition: transitions.fast,
  },

  // Header Styles
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.gray200}`,
    boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.lg,
    flex: 1,
  },
  backBtn: {
    backgroundColor: colors.gray100,
    color: colors.gray700,
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    cursor: 'pointer',
    transition: transitions.fast,
    display: 'flex',
    alignItems: 'center',
  },
  documentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  documentTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gray900,
    margin: 0,
  },
  recipientInfo: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    gap: spacing.md,
  },
  headerBtn: {
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    cursor: 'pointer',
    transition: transitions.fast,
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  submitBtn: {
    backgroundColor: colors.green,
    '&:hover': {
      backgroundColor: '#16a34a',
    },
    '&:disabled': {
      backgroundColor: colors.gray300,
      cursor: 'not-allowed',
    },
  },

  // Progress Bar
  progressBar: {
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.gray200}`,
  },
  progressText: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    marginBottom: spacing.sm,
  },
  progressFill: {
    width: '100%',
    height: '4px',
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },

  // Editor Container
  editorContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: spacing.lg,
    padding: spacing.lg,
    flex: 1,
    overflow: 'hidden',
  },

  // Right Panel
  signPanel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    boxShadow: colors.shadowMd,
    overflow: 'hidden',
  },
  signPanelHeader: {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.gray200}`,
  },
  signPanelTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray900,
    margin: 0,
  },
  signFieldsList: {
    flex: 1,
    overflowY: 'auto',
    padding: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  fieldItem: {
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.gray200}`,
  },
  fieldHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray900,
  },
  fieldSignedIcon: {
    color: colors.green,
    fontSize: typography.sizes.base,
  },
  fieldPendingIcon: {
    color: colors.gray400,
    fontSize: typography.sizes.base,
  },
  signatureButton: {
    width: '100%',
    padding: spacing.sm,
    backgroundColor: colors.blue,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    cursor: 'pointer',
    transition: transitions.fast,
  },
  textInput: {
    width: '100%',
    padding: space spacing.sm,
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  submitButton: {
    margin: spacing.md,
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: colors.green,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    cursor: 'pointer',
    transition: transitions.fast,
    marginTop: 'auto',
  },

  // Modal
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.gray200}`,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray900,
    margin: 0,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: typography.sizes.xl,
    cursor: 'pointer',
    color: colors.gray600,
    padding: 0,
  },
};

export default DocumentSigningPage;
