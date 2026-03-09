import React, { useState, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import api from '../../services/api';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import FieldOverlay from './FieldOverlay';
import './DocumentViewer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/pdf.worker.min.js`;

/**
 * DocumentViewer Component
 * Renders PDF document with page navigation and zoom controls
 * Handles field placement via drag-and-drop and field movement/resizing
 */
const DocumentViewer = ({
  documentId,
  signingToken,
  currentPage,
  onPageChange,
  fields = [],
  selectedFieldId,
  onFieldSelect,
  onFieldDrop,
  onFieldMove,
  onFieldResize,
  onFieldRemove,
}) => {
  // PDF state
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Zoom preset values
  const ZOOM_PRESETS = [50, 75, 100, 125, 150];

  // Log when fields prop changes
  useEffect(() => {
    console.log('📺 DocumentViewer received fields prop:', fields.length, 'fields');
  }, [fields]);

  // Fetch PDF file from backend on mount or documentId/signingToken change
  useEffect(() => {
    if (documentId) {
      fetchPdfFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, signingToken]);

  // Close zoom menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowZoomMenu(false);
    };

    if (showZoomMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showZoomMenu]);

  /**
   * Fetch PDF file from backend
   * Gets the document with file data from API
   * Uses signing token endpoint if available (for recipients)
   */
  const fetchPdfFile = async () => {
    try {
      setLoading(true);
      setError('');

      // Use token-based endpoint if signing token is available (for recipients)
      // Otherwise use regular preview endpoint (for document owners)
      const endpoint = signingToken
        ? `/documents/${documentId}/preview/${signingToken}`
        : `/documents/${documentId}/preview`;
      const response = await api.get(endpoint);

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
    setZoom((prev) => {
      // Find next preset value
      const nextPreset = ZOOM_PRESETS.find(z => z > prev);
      return nextPreset || Math.min(prev + 10, 200);
    });
  };

  /**
   * Handle zoom out
   */
  const handleZoomOut = () => {
    setZoom((prev) => {
      // Find previous preset value
      const prevPreset = [...ZOOM_PRESETS].reverse().find(z => z < prev);
      return prevPreset || Math.max(prev - 10, 50);
    });
  };

  /**
   * Handle zoom to specific percentage
   */
  const handleZoomToPreset = (percentage) => {
    setZoom(percentage);
    setShowZoomMenu(false);
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
    setIsDragOver(true);
    e.dataTransfer.dropEffect = 'copy';
  };

  /**
   * Handle drag leave PDF canvas
   */
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  /**
   * Handle drop on PDF canvas
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (onFieldDrop) {
      // Get the PDF container position
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Get tool data from drag event
      const toolData = e.dataTransfer.getData('application/json');
      if (toolData) {
        const tool = JSON.parse(toolData);
        
        // Ensure position is within bounds (0-100%)
        const boundedX = Math.min(Math.max(x, 0), 100);
        const boundedY = Math.min(Math.max(y, 0), 100);

        onFieldDrop({
          ...tool,
          x: boundedX,
          y: boundedY,
          pageNumber: currentPage,
        });
      }
    }
  };

  /**
   * Handle field removal
   */
  const handleRemoveField = (fieldId) => {
    if (onFieldRemove) {
      onFieldRemove(fieldId);
    }
  };

  /**
   * Handle field move (drag)
   */
  const handleFieldMove = (fieldId, x, y) => {
    if (onFieldMove) {
      onFieldMove(fieldId, x, y);
    }
  };

  /**
   * Handle field resize
   */
  const handleFieldResize = (fieldId, width, height) => {
    if (onFieldResize) {
      onFieldResize(fieldId, width, height);
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

          <div style={styles.zoomControl}>
            <button
              style={styles.zoomButton}
              onClick={() => setShowZoomMenu(!showZoomMenu)}
              title="Zoom preset"
            >
              {zoom}%
            </button>
            
            {showZoomMenu && (
              <div style={styles.zoomMenu}>
                {ZOOM_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    style={{
                      ...styles.zoomMenuButton,
                      ...(zoom === preset ? styles.zoomMenuButtonActive : {})
                    }}
                    onClick={() => handleZoomToPreset(preset)}
                  >
                    {preset}%
                  </button>
                ))}
                <div style={styles.zoomMenuDivider} />
                <button
                  style={styles.zoomMenuButton}
                  onClick={() => {
                    handleZoomToPreset(Math.round((numPages ? 100 : 100)));
                    setShowZoomMenu(false);
                  }}
                  title="Fit to page height"
                >
                  Fit Page
                </button>
                <button
                  style={styles.zoomMenuButton}
                  onClick={() => {
                    handleZoomToPreset(100);
                    setShowZoomMenu(false);
                  }}
                  title="Actual size"
                >
                  Actual Size
                </button>
              </div>
            )}
          </div>

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
              position: 'relative',
              ...(isDragOver ? styles.pdfContainerDragOver : {})
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
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

            {/* Render field overlays */}
            {fields && (
              <>
                {console.log('📺 DocumentViewer rendering fields:', fields.length, 'fields on page', currentPage)}
                {fields.map((field) => {
                  const shouldRender = field.pageNumber === currentPage;
                  console.log(`  Field ${field.id}: pageNumber=${field.pageNumber}, currentPage=${currentPage}, shouldRender=${shouldRender}`);
                  return shouldRender && (
                    <FieldOverlay
                      key={field.id}
                      field={field}
                      isSelected={selectedFieldId === field.id}
                      onSelect={onFieldSelect || (() => {})}
                      onRemove={handleRemoveField}
                      onMove={handleFieldMove}
                      onResize={handleFieldResize}
                      zoomLevel={zoom}
                      containerWidth={400}
                      containerHeight={600}
                    />
                  );
                })}
              </>
            )}

            {/* Drag-over indicator - removed, no visual feedback needed */}
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
    width: '100%',
    flex: 1,
    backgroundColor: colors.lightGray,
    position: 'relative',
  },

  // Controls - Now floating
  controls: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    gap: spacing.lg,
    zIndex: 100,
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
  zoomControl: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  zoomButton: {
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: typography.sizes.sm,
    color: colors.gray700,
    backgroundColor: colors.gray100,
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
    minWidth: '50px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
  },
  zoomMenu: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    backgroundColor: colors.white,
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.md,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    minWidth: '120px',
    marginBottom: spacing.sm,
  },
  zoomMenuButton: {
    display: 'block',
    width: '100%',
    padding: `${spacing.xs} ${spacing.md}`,
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.gray700,
    fontSize: typography.sizes.sm,
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  zoomMenuButtonActive: {
    backgroundColor: colors.primary,
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  zoomMenuDivider: {
    height: '1px',
    backgroundColor: colors.gray200,
    margin: `${spacing.xs} 0`,
  },

  // Viewer
  viewerWrapper: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: `calc(${spacing.lg} + 80px)`,
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
    position: 'relative',
  },

  pdfContainerDragOver: {
    borderColor: colors.primary,
    borderWidth: '2px',
    borderStyle: 'dashed',
    box: `2px dashed ${colors.primary}`,
    boxShadow: `0 0 0 2px ${colors.primary}40, 0 4px 12px rgba(0, 0, 0, 0.15)`,
  },

  dragOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${colors.primary}20`,
    borderRadius: borderRadius.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 500,
  },

  dragOverMessage: {
    backgroundColor: colors.primary,
    color: colors.white,
    padding: `${spacing.lg} ${spacing.xl}`,
    borderRadius: borderRadius.lg,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
  },

  dragOverText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    margin: 0,
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
