import React, { useState } from 'react';
import './SignaturePlacementTool.css';


import { LuCheck, LuX, LuLightbulb } from 'react-icons/lu';

/**
 * SignaturePlacementTool Component
 * Manages the signature placement process
 * 
 * Props:
 *   - isActive: Boolean indicating if placement mode is on
 *   - onTogglePlacement(): Callback to toggle placement mode
 *   - signaturePlacements: Array of current placements
 *   - onRemovePlacement(index): Callback to remove placement
 *   - onConfirmPlacement(): Callback when ready to sign
 *   - isLoading: Boolean indicating signing in progress
 */
const SignaturePlacementTool = ({
  isActive,
  onTogglePlacement,
  signaturePlacements = [],
  onRemovePlacement,
  onConfirmPlacement,
  isLoading = false,
  currentPage = 1
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const placementsOnCurrentPage = signaturePlacements.filter(
    (p) => p.page === currentPage
  );

  return (
    <div className="signature-placement-tool">
      <div className="tool-header">
        <h3>Signature Placement</h3>
        <button
          className={`toggle-button ${isActive ? 'active' : ''}`}
          onClick={onTogglePlacement}
          disabled={isLoading}
        >
          {isActive ? <><LuCheck /> Placement Mode ON</> : '+ Add Signature'}
        </button>
      </div>

      {isActive && (
        <div className="placement-mode-indicator">
          <div className="indicator-pulse"></div>
          <p>Ready to place signature - Click on document to place</p>
        </div>
      )}

      <div className="placements-list">
        <h4>Placements on Page {currentPage}</h4>
        {placementsOnCurrentPage.length > 0 ? (
          <ul className="placements-items">
            {placementsOnCurrentPage.map((placement, index) => (
              <li key={index} className="placement-item">
                <div className="placement-details">
                  <span className="placement-number">#{index + 1}</span>
                  <span className="placement-coords">
                    Position: ({placement.x}, {placement.y})
                  </span>
                  <span className="placement-size">
                    Size: {placement.width}×{placement.height}
                  </span>
                </div>
                <button
                  className="remove-button"
                  onClick={() => onRemovePlacement?.(index)}
                  disabled={isLoading}
                  title="Remove this placement"
                >
                  <LuX /> Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-placements">No signatures placed on this page yet</p>
        )}
      </div>

      <div className="total-placements">
        <p className="count-badge">
          Total Signatures: <strong>{signaturePlacements.length}</strong>
        </p>
      </div>

      {showPreview && (
        <div className="placement-preview">
          <h4>Preview - All Placements</h4>
          <ul className="preview-list">
            {signaturePlacements.map((placement, index) => (
              <li key={index} className="preview-item">
                Page {placement.page} • Position ({placement.x}, {placement.y}) •
                Size: {placement.width}×{placement.height}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="tool-actions">
        <button
          className="action-button secondary"
          onClick={() => setShowPreview(!showPreview)}
          disabled={signaturePlacements.length === 0 || isLoading}
        >
          {showPreview ? <><LuX /> Hide Preview</> : '<LuEye /> Preview All'}
        </button>

        <button
          className="action-button primary"
          onClick={onConfirmPlacement}
          disabled={signaturePlacements.length === 0 || isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-mini"></span> Signing...
            </>
          ) : (
            <><LuCheck /> Confirm & Sign</>
          )}
        </button>
      </div>

      <div className="tool-help">
        <p className="help-text">
          <strong><LuLightbulb /> Tip:</strong> Each signature placement is tied to a specific
          page. Switch pages to place signatures on different pages.
        </p>
      </div>
    </div>
  );
};

export default SignaturePlacementTool;
