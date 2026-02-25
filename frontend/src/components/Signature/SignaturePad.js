import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import './SignaturePad.css';

/**
 * SignaturePad Component
 * Allows users to draw their signature on a canvas
 */
const SignaturePad = ({ onSignatureComplete, onCancel }) => {
  const signatureCanvasRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  /**
   * Handle mouse down - drawing starts
   */
  const handleMouseDown = () => {
    setIsDrawing(true);
  };

  /**
   * Handle mouse up - drawing ends
   */
  const handleMouseUp = () => {
    setIsDrawing(false);
    updateEmptyState();
  };

  /**
   * Handle touch end - drawing ends on touch devices
   */
  const handleTouchEnd = () => {
    setIsDrawing(false);
    updateEmptyState();
  };

  /**
   * Update empty state by checking canvas content
   */
  const updateEmptyState = () => {
    if (signatureCanvasRef.current) {
      const canvasEmpty = signatureCanvasRef.current.isEmpty();
      setIsEmpty(canvasEmpty);
    }
  };

  /**
   * Handle mouse move - drawing
   */
  const handleMouseMove = () => {
    if (isDrawing && signatureCanvasRef.current && isEmpty) {
      setIsEmpty(false);
    }
  };

  /**
   * Clear the canvas
   */
  const handleClear = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
      setIsEmpty(true);
      setIsDrawing(false);
    }
  };

  /**
   * Save the signature
   */
  const handleSave = () => {
    if (!signatureCanvasRef.current) {
      alert('Unable to save signature. Please try again.');
      return;
    }

    const canvasEmpty = signatureCanvasRef.current.isEmpty();
    
    if (canvasEmpty) {
      alert('Please draw your signature before saving.');
      return;
    }

    const signatureImage = signatureCanvasRef.current.toDataURL('image/png');
    onSignatureComplete(signatureImage, 'handwritten');
  };

  return (
    <div className="signature-pad">
      <div className="signature-pad-container">
        <h3>Draw Your Signature</h3>
        <p className="signature-instructions">
          Please sign in the box below using your mouse or touchpad
        </p>

        <div className="canvas-wrapper">
          <SignatureCanvas
            ref={signatureCanvasRef}
            canvasProps={{
              width: 500,
              height: 200,
              className: 'signature-canvas'
            }}
            onMouseUp={handleMouseUp}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchEnd={handleTouchEnd}
            onTouchStart={handleMouseDown}
            penColor="black"
            backgroundColor="white"
          />
        </div>

        <div className="signature-pad-actions">
          <button
            className="btn btn-secondary"
            onClick={handleClear}
          >
            Clear
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              handleClear();
              onCancel();
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
          >
            Save Signature
          </button>
        </div>

        {isEmpty && (
          <p className="signature-hint">Start drawing to create your signature</p>
        )}
      </div>
    </div>
  );
};

export default SignaturePad;
