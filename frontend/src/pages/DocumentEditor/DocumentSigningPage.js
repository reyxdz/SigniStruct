import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiCheck, FiAlertCircle } from 'react-icons/fi';
import DocumentViewer from '../../components/DocumentEditor/DocumentViewer';
import SignatureCanvas from '../../components/DocumentEditor/SignatureCanvas';
import SignatureSelectorModal from '../../components/DocumentEditor/SignatureSelectorModal';
import './DocumentSigningPage.css';

const DocumentSigningPage = () => {
  const { documentId, signingToken } = useParams();
  const navigate = useNavigate();

  // Document state
  const [document, setDocument] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Signing state
  const [fieldValues, setFieldValues] = useState({});
  const [signedFields, setSignedFields] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [showSignatureSelector, setShowSignatureSelector] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signingComplete, setSigningComplete] = useState(false);

  // Fetch document on mount
  useEffect(() => {
    fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, signingToken]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/documents/${documentId}/sign/${signingToken}`);

      if (response.data.success) {
        const { document: doc, recipient: recip, signingStatus } = response.data.data;
        setDocument(doc);
        setRecipient(recip);

        const initialValues = {};
        doc.fields.forEach(field => {
          initialValues[field.id] = field.value || '';
        });
        setFieldValues(initialValues);

        if (signingStatus === 'signed') {
          setSigningComplete(true);
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your signing link has expired or is invalid.');
      } else if (err.response?.status === 404) {
        setError('Document not found.');
      } else {
        setError(err.response?.data?.error || 'Failed to load document.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignField = (fieldId) => {
    setSelectedFieldId(fieldId);
    setShowSignatureSelector(true);
  };

  const handleSignatureSelected = (signatureData) => {
    if (selectedFieldId) {
      setFieldValues(prev => ({
        ...prev,
        [selectedFieldId]: signatureData
      }));
      setSignedFields(prev => new Set([...prev, selectedFieldId]));
    }
    setShowSignatureSelector(false);
    setSelectedFieldId(null);
  };

  const handleDrawNewSignature = () => {
    setShowSignatureSelector(false);
    setShowSignaturePad(true);
  };

  const handleSignatureComplete = (signatureData) => {
    if (selectedFieldId) {
      setFieldValues(prev => ({
        ...prev,
        [selectedFieldId]: signatureData
      }));
      setSignedFields(prev => new Set([...prev, selectedFieldId]));
    }
    setShowSignaturePad(false);
    setSelectedFieldId(null);
  };

  const handleSubmitSigning = async () => {
    if (!checkAllFieldsSigned()) {
      alert('Please sign all fields before submitting');
      return;
    }

    try {
      setIsSigning(true);
      
      // Get all interactive (non-readOnly) fields assigned to this recipient
      const fieldsToSubmit = document.fields.filter(field => 
        !field.readOnly &&
        field.assignedRecipients && 
        field.assignedRecipients.some(r => signedFields.has(field.id) || fieldValues[field.id])
      );

      // Submit each field
      for (let i = 0; i < fieldsToSubmit.length; i++) {
        const field = fieldsToSubmit[i];
        const isLastField = i === fieldsToSubmit.length - 1;
        
        const response = await api.post(
          `/documents/${documentId}/sign/${signingToken}`,
          {
            fieldId: field.id,
            fieldValue: fieldValues[field.id] || field.value,
            allFieldsSigned: isLastField
          }
        );

        if (!response.data.success) {
          throw new Error(response.data.error || `Failed to submit field ${field.label}`);
        }
      }

      setSigningComplete(true);
      setTimeout(() => navigate('/documents'), 2000);
    } catch (err) {
      alert('Error submitting document: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSigning(false);
    }
  };

  const checkAllFieldsSigned = () => {
    if (!document?.fields) return false;
    // Only check non-readOnly (recipient) fields
    const recipientFields = document.fields.filter(f => !f.readOnly);
    return recipientFields.length > 0 && recipientFields.every(field => signedFields.has(field.id) || fieldValues[field.id]);
  };

  if (loading) {
    return (
      <div className="signing-container">
        <div className="loading">Loading document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="signing-container">
        <div className="error-box">
          <FiAlertCircle className="error-icon" />
          <div className="error-message">{error}</div>
          <button className="back-btn" onClick={() => navigate('/documents')}>
            ← Back to Documents
          </button>
        </div>
      </div>
    );
  }

  if (signingComplete) {
    return (
      <div className="signing-container">
        <div className="success-box">
          <FiCheck className="success-icon" />
          <h1>Document Signed Successfully!</h1>
          <p>Thank you for signing. You will be redirected shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="signing-view">
      {/* Fixed Header */}
      <header className="signing-header">
        <div className="header-content">
          <div className="header-left">
            <button className="nav-btn" onClick={() => navigate('/documents')}>
              <FiArrowLeft size={18} />
              Back
            </button>
            <div>
              <h1 className="page-title">{document?.title}</h1>
              {recipient && <p className="recipient-label">Signing as: {recipient.name}</p>}
            </div>
          </div>
          <button
            className="submit-btn"
            onClick={handleSubmitSigning}
            disabled={isSigning || !checkAllFieldsSigned()}
          >
            <FiCheck size={16} />
            {isSigning ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="content-wrapper">
        {/* Document Viewer - Scrollable */}
        <div className="document-area">
          <DocumentViewer
            documentId={documentId}
            signingToken={signingToken}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            fields={document?.fields || []}
            selectedFieldId={selectedFieldId}
            onFieldSelect={setSelectedFieldId}
            isSigningMode={true}
            fieldValues={fieldValues}
          />
        </div>

        {/* Fields Sidebar */}
        <aside className="fields-sidebar">
          <div className="sidebar-header">
            <h2>Your Fields</h2>
          </div>

          <div className="fields-list">
            {(() => {
              // Group only interactive (non-readOnly) fields by label for the sidebar
              const groupedFields = {};
              document?.fields?.filter(f => !f.readOnly)?.forEach(field => {
                const label = field.label || field.fieldType || 'Field';
                if (!groupedFields[label]) {
                  groupedFields[label] = [];
                }
                groupedFields[label].push(field);
              });

              // Render grouped fields
              return Object.entries(groupedFields).map(([label, fields]) => {
                const totalCount = fields.length;
                const signedCount = fields.filter(f => signedFields.has(f.id)).length;

                return (
                  <div key={label} className="field-card">
                    <div className="field-header">
                      <span className="field-name">{label}</span>
                      <span className="field-count">{signedCount}/{totalCount}</span>
                    </div>
                    <button
                      className="field-btn"
                      onClick={() => {
                        // Find the first unsigned field of this type
                        const unsignedField = fields.find(f => !signedFields.has(f.id));
                        if (unsignedField) {
                          handleSignField(unsignedField.id);
                        } else if (fields[0]) {
                          // If all are signed, allow editing the first one
                          handleSignField(fields[0].id);
                        }
                      }}
                      disabled={isSigning}
                    >
                      {signedCount === totalCount ? 'Edit' : 'Sign'}
                    </button>
                  </div>
                );
              });
            })()}
          </div>

          <div className="sidebar-footer">
            <div className="summary-stat">
              <span>Total: {document?.fields?.filter(f => !f.readOnly)?.length || 0}</span>
            </div>
            <div className="summary-stat">
              <span>Signed: {signedFields.size}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Signature Selector Modal */}
      {showSignatureSelector && (
        <SignatureSelectorModal
          onSignatureComplete={handleSignatureSelected}
          onCancel={() => setShowSignatureSelector(false)}
          fieldName={document?.fields?.find(f => f.id === selectedFieldId)?.label || 'Signature'}
          onDrawNew={handleDrawNewSignature}
        />
      )}

      {/* Signature Canvas Modal */}
      {showSignaturePad && (
        <SignatureCanvas
          onComplete={handleSignatureComplete}
          onCancel={() => setShowSignaturePad(false)}
          fieldName={document?.fields?.find(f => f.id === selectedFieldId)?.label || 'Signature'}
        />
      )}
    </div>
  );
};

export default DocumentSigningPage;
