import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiArrowLeft, FiSave, FiSend } from 'react-icons/fi';
import DocumentViewer from '../../components/DocumentEditor/DocumentViewer';
import './DocumentEditorPage.css';

/**
 * DocumentEditorPage
 * Main component for editing documents with field placement
 * 3-column layout: LeftPanel | DocumentViewer | RightPanel
 */
const DocumentEditorPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  // Document state
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Editor state
  const [fields, setFields] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [selectedFieldId, setSelectedFieldId] = useState(null); // Used in Phase 5
  // eslint-disable-next-line no-unused-vars
  const [currentPage, setCurrentPage] = useState(1); // Used in Phase 2

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/documents/${documentId}`);
      
      if (response.data.success || response.data.document) {
        const doc = response.data.document || response.data.data;
        setDocument(doc);
        
        // Load existing fields if any
        if (doc.fields && Array.isArray(doc.fields)) {
          setFields(doc.fields);
        } else {
          setFields([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch document:', err);
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save document fields to backend
   */
  const handleSaveDocument = async () => {
    try {
      setIsSaving(true);
      await api.put(`/documents/${documentId}/fields`, {
        fields: fields,
        lastEditedAt: new Date()
      });
      alert('Document saved successfully!');
    } catch (err) {
      console.error('Failed to save document:', err);
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
      await api.post(`/documents/${documentId}/publish`, {
        fields: fields
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
        <button 
          onClick={() => navigate('/documents')}
          style={styles.backButton}
        >
          ← Back to Documents
        </button>
      </div>
    );
  }

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
            <h1 style={styles.documentTitle}>{document?.title || 'Untitled Document'}</h1>
            <p style={styles.documentStatus}>Status: {document?.status || 'draft'}</p>
          </div>
        </div>
        
        <div style={styles.headerRight}>
          <button 
            onClick={handleSaveDocument}
            style={{ ...styles.headerBtn, ...styles.saveBtn }}
            disabled={isSaving}
          >
            <FiSave style={{ marginRight: spacing.xs }} />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button 
            onClick={handlePublishDocument}
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
        <div style={styles.leftPanel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Tools</h2>
          </div>
          <div style={styles.panelContent}>
            <p style={styles.placeholderText}>Tools panel coming soon...</p>
          </div>
        </div>

        {/* Center - Document Viewer */}
        <DocumentViewer
          documentId={documentId}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          droppedTools={fields}
          selectedFieldId={selectedFieldId}
        />

        {/* Right Panel - Properties */}
        <div style={styles.rightPanel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Properties</h2>
          </div>
          <div style={styles.panelContent}>
            {selectedFieldId ? (
              <p style={styles.placeholderText}>Field properties will appear here...</p>
            ) : (
              <p style={styles.placeholderText}>Select a field to edit properties</p>
            )}
          </div>
        </div>

      </div>
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
    backgroundColor: colors.lightGray,
    fontFamily: 'inherit',
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
    color: '#ef4444',
    textAlign: 'center',
    maxWidth: '500px',
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
  },

  // Left Panel
  leftPanel: {
    width: '300px',
    backgroundColor: colors.white,
    borderRight: `1px solid ${colors.gray200}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  // Center Panel
  centerPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.lightGray,
    overflow: 'hidden',
  },

  // Right Panel
  rightPanel: {
    width: '350px',
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
