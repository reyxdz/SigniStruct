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
   * Creates a new canvas with transparent background and draws signature onto it
   */
  const stripWhiteBackground = (sourceCanvas) => {
    // Create a new canvas with transparent background
    const newCanvas = document.createElement('canvas');
    newCanvas.width = sourceCanvas.width;
    newCanvas.height = sourceCanvas.height;
    const ctx = newCanvas.getContext('2d');

    // Draw the source canvas onto new canvas with transparent background
    ctx.drawImage(sourceCanvas, 0, 0);

    // Get image data and process pixels
    const imageData = ctx.getImageData(0, 0, newCanvas.width, newCanvas.height);
    const data = imageData.data;

    // Iterate through all pixels and make white/near-white pixels transparent
    for (let i = 0; i < data.length; i += 4) {
      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];

      // If pixel is white or very close to white, make it transparent
      // Using threshold of 250 to catch light gray anti-aliasing too
      if (red > 250 && green > 250 && blue > 250) {
        data[i + 3] = 0; // Set alpha to 0 (fully transparent)
      }
      // For slightly less white pixels (250-240), reduce opacity gradually
      else if (red > 240 && green > 240 && blue > 240) {
        const avg = (red + green + blue) / 3;
        data[i + 3] = Math.round((255 - avg) * 2); // Reduce opacity based on whiteness
      }
    }

    ctx.putImageData(imageData, 0, 0);
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
            backgroundColor="transparent"
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
