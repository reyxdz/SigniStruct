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
   * Remove white background from signature
   * Uses brightness/luminance to detect and remove light pixels
   * Keeps signature pixels (dark) and removes background (light)
   */
  const stripWhiteBackground = (sourceCanvas) => {
    // Create a new canvas with explicitly transparent background
    const newCanvas = document.createElement('canvas');
    newCanvas.width = sourceCanvas.width;
    newCanvas.height = sourceCanvas.height;
    const ctx = newCanvas.getContext('2d', { alpha: true });

    // Set background to transparent
    ctx.clearRect(0, 0, newCanvas.width, newCanvas.height);

    // Copy image data from source canvas
    ctx.drawImage(sourceCanvas, 0, 0);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, newCanvas.width, newCanvas.height);
    const data = imageData.data;

    // Process each pixel: remove light background, keep dark signature
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Calculate brightness using luminance formula
      // This is more reliable than checking individual RGB channels
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
      
      // Remove light pixels (brightness > 180)
      // Signature pixels are dark (black), so brightness << 100
      // Light background/anti-aliasing edges are > 150-200
      if (brightness > 180) {
        data[i + 3] = 0; // Make fully transparent
      } else if (brightness > 150) {
        // For anti-aliased edges, reduce opacity gradually
        const alpha = Math.max(0, 255 * ((200 - brightness) / 50));
        data[i + 3] = Math.round(alpha);
      }
    }

    // Put the processed image data back
    ctx.putImageData(imageData, 0, 0);

    // Return as PNG
    return newCanvas.toDataURL('image/png');
  };

  /**
   * Handle save - extract canvas and process it
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

    // Get the canvas element and create a clean version with transparent background
    const sourceCanvas = signatureCanvasRef.current.getCanvas();
    const signatureImage = stripWhiteBackground(sourceCanvas);
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
