import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import DocumentViewer from '../../components/DocumentEditor/DocumentViewer';
import SignatureCanvas from '../../components/DocumentEditor/SignatureCanvas';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { FiAlertCircle } from 'react-icons/fi';


import { LuCheck } from 'react-icons/lu';

/**
 * DocumentSign Component
 * Allows authenticated users to sign documents they own
 * Shows PDF with signature fields for signing
 */
const DocumentSign = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  // Document state
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Signing state
  const [fieldValues, setFieldValues] = useState({});
  const [selectedField, setSelectedField] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // Fetch document on mount
  useEffect(() => {
    fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  /**
   * Fetch document from backend
   */
  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('📄 Fetching document for signing:', documentId);
      const response = await api.get(`/documents/${documentId}`);

      if (response.data.success || response.data.document) {
        const doc = response.data.document || response.data.data;
        console.log('✅ Document fetched:', doc.name || doc.title);
        console.log('  Fields:', doc.fields?.length || 0);

        setDocument(doc);

        // Initialize field values
        const initialValues = {};
        (doc.fields || []).forEach(field => {
          initialValues[field.id] = field.value || '';
        });
        setFieldValues(initialValues);
      }
    } catch (err) {
      console.error('❌ Failed to fetch document:', err);
      const errorMsg = err.response?.data?.error || 'Failed to load document';
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle field value change
   */
  const handleFieldValueChange = (fieldId, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  /**
   * Submit signed document
   */
  const submitSignature = async () => {
    if (!document) {
      alert('Document not loaded');
      return;
    }

    // Check if all signature fields are signed
    const allSigned = (document.fields || [])
      .filter(field => field.fieldType === 'signature')
      .every(field => fieldValues[field.id]);

    if (!allSigned) {
      alert('Please sign all required signature fields');
      return;
    }

    try {
      setIsSigning(true);

      // Prepare signatures array
      const signatures = document.fields
        .filter(field => field.fieldType === 'signature' && fieldValues[field.id])
        .map(field => ({
          fieldId: field.id,
          value: fieldValues[field.id],
          timestamp: new Date().toISOString(),
        }));

      // Prepare other field values
      const otherFields = document.fields
        .filter(field => field.fieldType !== 'signature')
        .map(field => ({
          fieldId: field.id,
          value: fieldValues[field.id] || '',
        }));

      const payload = {
        signatures,
        otherFields,
      };

      console.log('📤 Submitting signatures:', payload);
      const response = await api.put(
        `/documents/${documentId}/sign`,
        payload
      );

      if (response.data.success) {
        console.log('✅ Signatures submitted successfully');
        alert('Document signed successfully!');
        navigate('/documents');
      } else {
        throw new Error(response.data.error || 'Failed to submit signatures');
      }
    } catch (err) {
      console.error('❌ Failed to submit signatures:', err);
      alert('Error submitting signatures: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSigning(false);
    }
  };


  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: colors.gray50,
      }}>
        <div style={{
          textAlign: 'center',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `4px solid ${colors.gray200}`,
            borderTop: `4px solid ${colors.primary}`,
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite',
          }}></div>
          <p style={{ color: colors.gray600 }}>Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: colors.gray50,
      }}>
        <div style={{
          backgroundColor: colors.white,
          padding: spacing.lg,
          borderRadius: borderRadius.lg,
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}>
          <FiAlertCircle style={{
            fontSize: '48px',
            color: colors.red500,
            marginBottom: spacing.md,
          }} />
          <h2 style={{ color: colors.gray900, marginBottom: spacing.sm }}>Error</h2>
          <p style={{ color: colors.gray600, marginBottom: spacing.lg }}>{error}</p>
          <button
            onClick={() => navigate('/documents')}
            style={{
              backgroundColor: colors.primary,
              color: colors.white,
              border: 'none',
              padding: `${spacing.sm} ${spacing.lg}`,
              borderRadius: borderRadius.md,
              cursor: 'pointer',
            }}
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: colors.gray50,
      }}>
        <div style={{
          backgroundColor: colors.white,
          padding: spacing.lg,
          borderRadius: borderRadius.lg,
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}>
          <p style={{ color: colors.gray600 }}>Document not found</p>
          <button
            onClick={() => navigate('/documents')}
            style={{
              backgroundColor: colors.primary,
              color: colors.white,
              border: 'none',
              padding: `${spacing.sm} ${spacing.lg}`,
              borderRadius: borderRadius.md,
              cursor: 'pointer',
              marginTop: spacing.md,
            }}
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 360px',
      gap: spacing.lg,
      height: '100vh',
      backgroundColor: colors.gray50,
      overflow: 'hidden',
    }}>
      {/* PDF Viewer */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}>
        <div style={{
          padding: spacing.lg,
          borderBottom: `1px solid ${colors.gray200}`,
          backgroundColor: colors.white,
        }}>
          <h1 style={{
            margin: 0,
            fontSize: typography.sizes.lg,
            fontWeight: typography.weights.semibold,
            color: colors.gray900,
          }}>
            {document.name || document.title}
          </h1>
          <p style={{
            margin: `${spacing.xs} 0 0 0`,
            fontSize: typography.sizes.sm,
            color: colors.gray600,
          }}>
            Sign this document
          </p>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <DocumentViewer
            documentId={documentId}
            fields={document.fields || []}
            onFieldValueChange={handleFieldValueChange}
            fieldValues={fieldValues}
            isEditing={true}
          />
        </div>
      </div>

      {/* Signature Panel */}
      <div style={{
        backgroundColor: colors.white,
        borderLeft: `1px solid ${colors.gray200}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}>
        <div style={{
          padding: spacing.lg,
          borderBottom: `1px solid ${colors.gray200}`,
        }}>
          <h2 style={{
            margin: 0,
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.semibold,
            color: colors.gray900,
          }}>
            Signature Fields
          </h2>
        </div>

        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: spacing.lg,
        }}>
          {document.fields && document.fields.length > 0 ? (
            document.fields.map((field) => (
              <div key={field.id} style={{
                marginBottom: spacing.lg,
                padding: spacing.md,
                backgroundColor: colors.gray50,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.gray200}`,
              }}>
                <label style={{
                  display: 'block',
                  fontSize: typography.sizes.sm,
                  fontWeight: typography.weights.medium,
                  color: colors.gray900,
                  marginBottom: spacing.sm,
                }}>
                  {field.label}
                </label>
                {field.fieldType === 'signature' ? (
                  <button
                    onClick={() => {
                      setSelectedField(field);
                      setShowSignatureModal(true);
                    }}
                    style={{
                      width: '100%',
                      padding: spacing.md,
                      backgroundColor: fieldValues[field.id] ? colors.green100 : colors.primary,
                      color: fieldValues[field.id] ? colors.green800 : colors.white,
                      border: 'none',
                      borderRadius: borderRadius.sm,
                      fontSize: typography.sizes.sm,
                      fontWeight: typography.weights.medium,
                      cursor: 'pointer',
                    }}
                  >
                    {fieldValues[field.id] ? <><LuCheck /> Signed</> : 'Add Signature'}
                  </button>
                ) : (
                  <input
                    type="text"
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                    placeholder={field.label}
                    style={{
                      width: '100%',
                      padding: spacing.sm,
                      border: `1px solid ${colors.gray300}`,
                      borderRadius: borderRadius.sm,
                      fontSize: typography.sizes.sm,
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>
            ))
          ) : (
            <p style={{
              color: colors.gray600,
              fontSize: typography.sizes.sm,
              textAlign: 'center',
            }}>
              No signature fields
            </p>
          )}
        </div>

        <div style={{
          padding: spacing.lg,
          borderTop: `1px solid ${colors.gray200}`,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: spacing.md,
        }}>
          <button
            onClick={() => navigate('/documents')}
            style={{
              padding: spacing.md,
              backgroundColor: colors.gray100,
              color: colors.gray700,
              border: 'none',
              borderRadius: borderRadius.md,
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.medium,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={submitSignature}
            disabled={isSigning}
            style={{
              padding: spacing.md,
              backgroundColor: colors.accent,
              color: colors.white,
              border: 'none',
              borderRadius: borderRadius.md,
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.medium,
              cursor: isSigning ? 'not-allowed' : 'pointer',
              opacity: isSigning ? 0.6 : 1,
            }}
          >
            {isSigning ? 'Submitting...' : 'Submit Signature'}
          </button>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && selectedField && (
        <SignatureCanvas
          field={selectedField}
          onSign={(signatureData) => {
            handleFieldValueChange(selectedField.id, signatureData);
            setShowSignatureModal(false);
          }}
          onClose={() => setShowSignatureModal(false)}
        />
      )}
    </div>
  );
};

export default DocumentSign;
