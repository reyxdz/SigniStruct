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
   * Creates a completely transparent image with only the signature strokes
   */
  const stripWhiteBackground = (sourceCanvas) => {
    // Create a new canvas with transparent background
    const newCanvas = document.createElement('canvas');
    newCanvas.width = sourceCanvas.width;
    newCanvas.height = sourceCanvas.height;
    const ctx = newCanvas.getContext('2d', { alpha: true });

    // Ensure canvas has transparent background
    ctx.clearRect(0, 0, newCanvas.width, newCanvas.height);

    // Draw the source canvas onto new canvas
    ctx.drawImage(sourceCanvas, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, newCanvas.width, newCanvas.height);
    const data = imageData.data;

    // Process every pixel to remove white background
    for (let i = 0; i < data.length; i += 4) {
      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];
      const alpha = data[i + 3];

      // Calculate brightness/whiteness
      const brightness = (red + green + blue) / 3;

      // If pixel is very light (whitish), make it transparent
      if (brightness > 230) {
        data[i + 3] = 0; // Full transparency
      } 
      // For lighter pixels (200-230), reduce opacity gradually
      else if (brightness > 200) {
        const intensity = (brightness - 200) / 30; // 0 to 1
        data[i + 3] = Math.round(alpha * (1 - intensity * 0.8)); // Reduce alpha
      }
    }

    ctx.putImageData(imageData, 0, 0);
    
    // Return as PNG with alpha channel
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
