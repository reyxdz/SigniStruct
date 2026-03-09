import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiCheck, FiAlertCircle } from 'react-icons/fi';
import DocumentViewer from '../../components/DocumentEditor/DocumentViewer';
import SignatureCanvas from '../../components/DocumentEditor/SignatureCanvas';
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
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signingComplete, setSigningComplete] = useState(false);

  // Fetch document on mount
  useEffect(() => {
    fetchDocument();
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

  const handleFieldChange = (fieldId, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSignField = (fieldId) => {
    setSelectedFieldId(fieldId);
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
      const response = await api.post(
        `/documents/${documentId}/sign/${signingToken}`,
        { fieldValues }
      );

      if (response.data.success) {
        setSigningComplete(true);
        setTimeout(() => navigate('/documents'), 2000);
      }
    } catch (err) {
      alert('Error submitting document: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSigning(false);
    }
  };

  const checkAllFieldsSigned = () => {
    if (!document?.fields) return false;
    return document.fields.every(field => signedFields.has(field.id) || fieldValues[field.id]);
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
            {document?.fields?.map((field) => (
              <div key={field.id} className="field-card">
                <div className="field-header">
                  <span className="field-name">{field.name || 'Field'}</span>
                  {signedFields.has(field.id) ? (
                    <span className="status-badge signed">✓ Signed</span>
                  ) : (
                    <span className="status-badge pending">Pending</span>
                  )}
                </div>
                <button
                  className="field-btn"
                  onClick={() => handleSignField(field.id)}
                  disabled={isSigning}
                >
                  {signedFields.has(field.id) ? 'Edit' : 'Sign'}
                </button>
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            <div className="summary-stat">
              <span>Total: {document?.fields?.length || 0}</span>
            </div>
            <div className="summary-stat">
              <span>Signed: {signedFields.size}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Signature Canvas Modal */}
      {showSignaturePad && (
        <SignatureCanvas
          onComplete={handleSignatureComplete}
          onCancel={() => setShowSignaturePad(false)}
          fieldName={document?.fields?.find(f => f.id === selectedFieldId)?.name}
        />
      )}
    </div>
  );
};

export default DocumentSigningPage;
