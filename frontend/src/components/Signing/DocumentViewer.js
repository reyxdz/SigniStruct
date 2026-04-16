import React, { useRef } from 'react';
import './DocumentViewer.css';


import { LuFileText, LuX, LuCheck, LuMousePointer2, LuChevronLeft, LuChevronRight, LuMousePointer } from 'react-icons/lu';

/**
 * DocumentViewer Component
 * Displays document content and handles signature placement overlay
 * 
 * Props:
 *   - document: Document object with file_url, title, num_pages
 *   - signaturePlacements: Array of signature placements
 *   - isPlacingSignature: Boolean indicating active placement mode
 *   - onSignaturePlaced(placement): Callback when user places signature
 */
const DocumentViewer = ({
  document,
  signaturePlacements = [],
  isPlacingSignature = false,
  onSignaturePlaced,
  currentPage = 1,
  onPageChange
}) => {
  const isLoading = false;
  const error = null;
  const viewerRef = useRef(null);

  const handlePlaceSignature = (e) => {
    if (!isPlacingSignature || !onSignaturePlaced || !viewerRef.current) {
      return;
    }

    const rect = viewerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Standard signature dimensions
    const width = 150;
    const height = 50;

    const placement = {
      x: Math.round(x),
      y: Math.round(y),
      width,
      height,
      page: currentPage
    };

    onSignaturePlaced(placement);
  };

  return (
    <div className="document-viewer">
      <div className="viewer-header">
        <h3 className="document-title">{document?.title || 'Document'}</h3>
        <div className="document-info">
          <span className="info-badge">
            <LuFileText /> {document?.num_pages || 1} Page(s)
          </span>
          <span className="file-size">
            {document?.file_size ? `${(document.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
          </span>
        </div>
      </div>

      {error && (
        <div className="viewer-error">
          <span className="error-icon"><LuX /></span>
          {error}
        </div>
      )}

      {isLoading && (
        <div className="viewer-loading">
          <div className="spinner"></div>
          <p>Loading document...</p>
        </div>
      )}

      <div
        ref={viewerRef}
        className={`document-content ${isPlacingSignature ? 'placing-mode' : ''}`}
        onClick={handlePlaceSignature}
        style={{
          cursor: isPlacingSignature ? 'crosshair' : 'default',
          backgroundColor: '#f5f5f5',
          border: isPlacingSignature ? '2px dashed #2563eb' : '1px solid #e5e7eb',
          aspectRatio: '8.5 / 11',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {document?.file_url ? (
          <div className="document-display">
            {/* PDF Preview or Document Content */}
            <div className="document-placeholder">
              <div className="placeholder-content">
                <span className="file-icon"><LuFileText /></span>
                <p className="file-name">{document.original_filename || document.title}</p>
                <p className="file-path">{document.file_url}</p>
                <p className="upload-date">
                  Uploaded: {new Date(document.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Render existing signature placements */}
            {signaturePlacements
              .filter((placement) => placement.page === currentPage)
              .map((placement, index) => (
                <div
                  key={index}
                  className="signature-placement"
                  style={{
                    position: 'absolute',
                    left: `${placement.x}px`,
                    top: `${placement.y}px`,
                    width: `${placement.width}px`,
                    height: `${placement.height}px`,
                    border: '2px solid #16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="signature-label"><LuCheck /> Signature</span>
                </div>
              ))}

            {/* Placement hint */}
            {isPlacingSignature && (
              <div className="placement-hint">
                <p className="hint-text"><LuMousePointer2 /> Click where you want to place the signature</p>
              </div>
            )}
          </div>
        ) : (
          <div className="no-document">
            <p>No document loaded</p>
          </div>
        )}
      </div>

      {/* Page navigation */}
      {document?.num_pages > 1 && (
        <div className="page-navigation">
          <button
            className="page-button"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <LuChevronLeft /> Previous
          </button>
          <span className="page-counter">
            Page {currentPage} of {document.num_pages}
          </span>
          <button
            className="page-button"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === document.num_pages}
          >
            Next <LuChevronRight />
          </button>
        </div>
      )}

      {isPlacingSignature && (
        <div className="placement-mode-active">
          <p className="mode-indicator"><LuMousePointer /> Signature Placement Mode Active</p>
        </div>
      )}
    </div>  
  );
};

export default DocumentViewer;
