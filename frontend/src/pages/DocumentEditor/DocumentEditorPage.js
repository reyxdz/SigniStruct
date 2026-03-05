import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiArrowLeft, FiSave, FiSend } from 'react-icons/fi';
import { EditorProvider, useEditor } from '../../contexts/EditorContext';
import DocumentViewer from '../../components/DocumentEditor/DocumentViewer';
import LeftPanel from '../../components/DocumentEditor/LeftPanel';
import RightPanel from '../../components/DocumentEditor/RightPanel';
import './DocumentEditorPage.css';

/**
 * DocumentEditorContent
 * Inner component that uses EditorContext
 * Handles the actual editor UI and interactions
 */
const DocumentEditorContent = ({ documentId, document, loading, error, isSaving, onSave, onPublish, onNavigateBack }) => {
  const { 
    fields, 
    selectedFieldId, 
    currentPage, 
    addField, 
    selectField,
    changePage, 
    moveField, 
    resizeField, 
    removeField 
  } = useEditor();

  /**
   * Wrapper for field drop to handle callback signature
   * DocumentViewer calls onFieldDrop with combined object
   * EditorContext expects separate parameters
   */
  const handleFieldDrop = (fieldDataWithPosition) => {
    const { x, y, pageNumber, ...toolData } = fieldDataWithPosition;
    addField(toolData, x, y, pageNumber);
  };

  console.log('📄 DocumentEditorContent rendering with', fields.length, 'fields');

  /**
   * Handle field move
   */
  const handleFieldMove = (fieldId, x, y) => {
    moveField(fieldId, x, y);
  };

  /**
   * Handle field resize
   */
  const handleFieldResize = (fieldId, width, height) => {
    resizeField(fieldId, width, height);
  };

  /**
   * Handle field remove
   */
  const handleFieldRemove = (fieldId) => {
    console.log(`🗑️ Removing field: ${fieldId}`);
    removeField(fieldId);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingMessage}>Loading document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorMessage}>{error}</div>
        <div style={{ display: 'flex', gap: spacing.md }}>
          <button 
            onClick={onNavigateBack}
            style={styles.backButton}
          >
            ← Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button 
            onClick={onNavigateBack}
            style={styles.backBtn}
          >
            <FiArrowLeft style={{ marginRight: spacing.sm }} />
            Back
          </button>
          <div style={styles.documentInfo}>
            <h1 style={styles.documentTitle}>{document?.title || 'Untitled Document'}</h1>
            <p style={styles.documentStatus}>Status: {document?.status || 'draft'}</p>
          </div>
        </div>
        
        <div style={styles.headerRight}>
          <button 
            onClick={() => onSave(fields)}
            style={{ ...styles.headerBtn, ...styles.saveBtn }}
            disabled={isSaving}
          >
            <FiSave style={{ marginRight: spacing.xs }} />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button 
            onClick={onPublish}
            style={{ ...styles.headerBtn, ...styles.publishBtn }}
            disabled={isSaving}
          >
            <FiSend style={{ marginRight: spacing.xs }} />
            Publish
          </button>
        </div>
      </div>

      {/* Main Editor Container - 3 Column Layout */}
      <div style={styles.editorContainer}>
        
        {/* Left Panel - Tools */}
        <LeftPanel />

        {/* Center - Document Viewer */}
        <DocumentViewer
          documentId={documentId}
          currentPage={currentPage}
          onPageChange={changePage}
          fields={fields}
          selectedFieldId={selectedFieldId}
          onFieldSelect={selectField}
          onFieldDrop={handleFieldDrop}
          onFieldMove={handleFieldMove}
          onFieldResize={handleFieldResize}
          onFieldRemove={handleFieldRemove}
        />

        {/* Right Panel - Properties */}
        <RightPanel />

      </div>
    </div>
  );
};

/**
 * DocumentEditorPage
 * Main component for editing documents with field placement
 * 3-column layout: LeftPanel | DocumentViewer | RightPanel
 * Provides EditorContext to all child components
 */
const DocumentEditorPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  // Document state
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch document on mount
  useEffect(() => {
    fetchDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  /**
   * Fetch document from backend
   * @function
   * @async
   */
  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/documents/${documentId}`);
      
      if (response.data.success || response.data.document) {
        const doc = response.data.document || response.data.data;
        console.log('📄 Fetched document:', doc);
        console.log('📋 Document fields:', doc?.fields);
        setDocument(doc);
      }
    } catch (err) {
      console.error('Failed to fetch document:', err);
      
      // Provide specific error messages based on status code
      if (err.response?.status === 404) {
        setError('Document not found. The document may have been deleted or the ID is invalid.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this document.');
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to load document. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save document - will be called with fields from DocumentEditorContent
   */
  const handleSaveDocument = async (fieldsToSave = []) => {
    try {
      setIsSaving(true);
      console.log('💾 Saving document fields:', fieldsToSave);
      const response = await api.put(`/documents/${documentId}/fields`, {
        fields: fieldsToSave,
        lastEditedAt: new Date()
      });
      console.log('✅ Save response:', response.data);
      alert('Document saved successfully!');
    } catch (err) {
      console.error('❌ Failed to save document:', err);
      console.error('  Response:', err.response?.data);
      alert('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Publish document for signing
   */
  const handlePublishDocument = async () => {
    try {
      setIsSaving(true);
      // Note: This will be updated in Phase 4.3 to use context fields
      await api.post(`/documents/${documentId}/publish`, {
        fields: []
      });
      alert('Document published successfully!');
      navigate('/documents');
    } catch (err) {
      console.error('Failed to publish document:', err);
      alert('Failed to publish document');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Navigate back to documents list
   */
  const handleNavigateBack = () => {
    navigate('/documents');
  };

  return (
    <EditorProvider initialDocument={document}>
      <DocumentEditorContent
        documentId={documentId}
        document={document}
        loading={loading}
        error={error}
        isSaving={isSaving}
        onSave={handleSaveDocument}
        onPublish={handlePublishDocument}
        onNavigateBack={handleNavigateBack}
      />
    </EditorProvider>
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
  errorMessage: {
    fontSize: typography.sizes.base,
    color: '#dc2626',
    textAlign: 'center',
    maxWidth: '500px',
    padding: spacing.lg,
    backgroundColor: '#fee2e2',
    borderRadius: borderRadius.md,
    border: `1px solid #fca5a5`,
    lineHeight: 1.6,
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
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray700,
    cursor: 'pointer',
    transition: transitions.fast,
  },
  documentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  documentTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray900,
    margin: 0,
  },
  documentStatus: {
    fontSize: typography.sizes.xs,
    color: colors.gray500,
    margin: 0,
    textTransform: 'capitalize',
  },
  headerRight: {
    display: 'flex',
    gap: spacing.md,
  },
  headerBtn: {
    display: 'flex',
    alignItems: 'center',
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    cursor: 'pointer',
    transition: transitions.fast,
  },
  saveBtn: {
    backgroundColor: colors.gray200,
    color: colors.gray900,
  },
  publishBtn: {
    backgroundColor: colors.primary,
    color: colors.white,
  },

  // Editor Container
  editorContainer: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },

  // Center Panel
  centerPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.lightGray,
    overflow: 'hidden',
    minWidth: 0,
  },

  // Right Panel
  rightPanel: {
    width: '350px',
    minWidth: '350px',
    flexShrink: 0,
    backgroundColor: colors.white,
    borderLeft: `1px solid ${colors.gray200}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  // Panel Shared Styles
  panelHeader: {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.gray200}`,
    backgroundColor: colors.white,
  },
  panelTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.gray900,
    margin: 0,
  },
  panelContent: {
    flex: 1,
    overflow: 'auto',
    padding: spacing.md,
  },
  placeholderText: {
    fontSize: typography.sizes.sm,
    color: colors.gray400,
    textAlign: 'center',
    margin: 0,
  },
};

export default DocumentEditorPage;
