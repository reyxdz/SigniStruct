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
   * Find the bounding box of non-transparent pixels in canvas
   * This detects the actual signature content area
   */
  const findSignatureBoundingBox = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let minX = width;
    let maxX = -1;
    let minY = height;
    let maxY = -1;

    // Scan all pixels to find bounds of non-transparent content
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        // Non-transparent pixel found
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }

    // Return bounding box with padding for clean edges
    if (maxX === -1) {
      // No content found
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const padding = 5;
    return {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: Math.min(width, maxX - minX + 1 + padding * 2),
      height: Math.min(height, maxY - minY + 1 + padding * 2),
    };
  };

  /**
   * Remove white background from signature and crop to content
   * Uses brightness/luminance to detect and remove light pixels
   * Then crops the canvas to only the actual signature bounds
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

    // Find bounding box of actual signature content
    const boundingBox = findSignatureBoundingBox(ctx, newCanvas.width, newCanvas.height);

    // If signature is too small, return empty
    if (boundingBox.width <= 0 || boundingBox.height <= 0) {
      return newCanvas.toDataURL('image/png');
    }

    // Create a cropped canvas with only the signature content
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = boundingBox.width;
    croppedCanvas.height = boundingBox.height;
    const croppedCtx = croppedCanvas.getContext('2d', { alpha: true });

    // Copy the bounding box area from the cleaned canvas to the cropped canvas
    croppedCtx.drawImage(
      newCanvas,
      boundingBox.x,
      boundingBox.y,
      boundingBox.width,
      boundingBox.height,
      0,
      0,
      boundingBox.width,
      boundingBox.height
    );

    // Return cropped signature as PNG
    return croppedCanvas.toDataURL('image/png');
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
