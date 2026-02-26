import React, { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import api from '../../../services/api';
import { colors, spacing, typography, borderRadius } from '../../../theme';
import { FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import './DocumentViewer.css';

/**
 * DocumentViewer Component
 * Renders PDF document with page navigation and zoom controls
 * Responsible for displaying the PDF file in the editor
 */
const DocumentViewer = ({
  documentId,
  currentPage,
  onPageChange,
  droppedTools = [],
  onFieldDrop,
  selectedFieldId,
}) => {
  // PDF state
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch PDF file from backend on mount or documentId change
  useEffect(() => {
    if (documentId) {
      fetchPdfFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  /**
   * Fetch PDF file from backend
   * Gets the document with file data from API
   */
  const fetchPdfFile = async () => {
    try {
      setLoading(true);
      setError('');

      // Use the preview endpoint to get the PDF file as base64
      const response = await api.get(`/documents/${documentId}/preview`);

      if (response.data.success || response.data.document) {
        const doc = response.data.document || response.data.data;

        // Check if document has file data as base64
        if (doc.fileData) {
          // Convert base64 to blob URL
          const base64Data = doc.fileData;
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          setPdfUrl(blobUrl);
        } else if (doc.file_url) {
          // Fallback to direct URL if base64 not available
          setPdfUrl(doc.file_url);
        } else {
          setError('No PDF file found for this document');
        }
      }
    } catch (err) {
      console.error('Failed to fetch PDF:', err);
      setError(err.response?.data?.message || 'Failed to load PDF file');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle successful PDF load
   * Set total page count
   */
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  /**
   * Handle PDF load error
   */
  const onDocumentLoadError = (err) => {
    console.error('PDF load error:', err);
    setError('Failed to render PDF. Please try again.');
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= numPages) {
      onPageChange(newPage);
    }
  };

  /**
   * Handle zoom in
   */
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  /**
   * Handle zoom out
   */
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  /**
   * Handle page input change
   */
  const handlePageInputChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    handlePageChange(value);
  };

  /**
   * Handle drag over PDF canvas
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * Handle drop on PDF canvas
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onFieldDrop) {
      // Get the PDF canvas position
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Get tool data from drag event
      const toolData = e.dataTransfer.getData('application/json');
      if (toolData) {
        const tool = JSON.parse(toolData);
        onFieldDrop({
          ...tool,
          x: Math.min(Math.max(x, 0), 100),
          y: Math.min(Math.max(y, 0), 100),
          pageNumber: currentPage,
        });
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* Viewer Controls */}
      <div style={styles.controls}>
        <div style={styles.controlsLeft}>
          <button
            style={styles.controlButton}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            title="Previous page"
          >
            <FiChevronLeft />
          </button>

          <div style={styles.pageInput}>
            <input
              type="number"
              min="1"
              max={numPages || 1}
              value={currentPage}
              onChange={handlePageInputChange}
              style={styles.pageInputField}
            />
            <span style={styles.pageInfo}>
              of <strong>{numPages || '0'}</strong>
            </span>
          </div>

          <button
            style={styles.controlButton}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= (numPages || 1)}
            title="Next page"
          >
            <FiChevronRight />
          </button>
        </div>

        <div style={styles.controlsRight}>
          <button
            style={styles.controlButton}
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            title="Zoom out"
          >
            <FiZoomOut />
          </button>

          <span style={styles.zoomPercent}>{zoom}%</span>

          <button
            style={styles.controlButton}
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            title="Zoom in"
          >
            <FiZoomIn />
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div style={styles.viewerWrapper}>
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>Loading PDF...</p>
          </div>
        )}

        {error && (
          <div style={styles.errorContainer}>
            <p style={styles.errorText}>{error}</p>
            <button
              style={styles.retryButton}
              onClick={fetchPdfFile}
            >
              Try Again
            </button>
          </div>
        )}

        {pdfUrl && !loading && !error && (
          <div
            style={{
              ...styles.pdfContainer,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div style={styles.docLoading}>Loading document...</div>}
            >
              <Page
                pageNumber={currentPage}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                style={styles.page}
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Inline Styles
 */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: colors.lightGray,
  },

  // Controls
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.gray200}`,
    gap: spacing.lg,
  },
  controlsLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  },
  controlsRight: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  },
  controlButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    backgroundColor: colors.gray100,
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.md,
    color: colors.gray700,
    cursor: 'pointer',
    fontSize: typography.sizes.lg,
    transition: 'all 0.2s ease',
  },
  pageInput: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pageInputField: {
    width: '50px',
    padding: `${spacing.xs} ${spacing.sm}`,
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.sm,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  pageInfo: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
  },
  zoomPercent: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    minWidth: '45px',
    textAlign: 'center',
  },

  // Viewer
  viewerWrapper: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    overflow: 'auto',
    backgroundColor: colors.lightGray,
    position: 'relative',
  },
  pdfContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  page: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: `3px solid ${colors.gray200}`,
    borderTop: `3px solid ${colors.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.gray600,
  },
  docLoading: {
    padding: spacing.xl,
    color: colors.gray400,
  },

  // Error
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: '#fef2f2',
    borderRadius: borderRadius.lg,
    border: `1px solid #fecaca`,
  },
  errorText: {
    fontSize: typography.sizes.base,
    color: '#dc2626',
    textAlign: 'center',
    margin: 0,
  },
  retryButton: {
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },
};

export default DocumentViewer;
