import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { FiTrash2, FiCheck } from 'react-icons/fi';

/**
 * SignatureCanvasModal Component
 * Allows users to draw signature on canvas and submit
 * Used in document signing workflow
 */
const SignatureCanvasModal = ({ onSignatureComplete, onCancel }) => {
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
   * Remove white background from signature and crop to content
   */
  const stripWhiteBackground = (sourceCanvas) => {
    const newCanvas = document.createElement('canvas');
    newCanvas.width = sourceCanvas.width;
    newCanvas.height = sourceCanvas.height;
    const ctx = newCanvas.getContext('2d', { alpha: true });

    ctx.clearRect(0, 0, newCanvas.width, newCanvas.height);
    ctx.drawImage(sourceCanvas, 0, 0);

    const imageData = ctx.getImageData(0, 0, newCanvas.width, newCanvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const brightness = (r * 0.299 + g * 0.587 + b * 0.114);

      if (brightness > 180) {
        data[i + 3] = 0;
      } else if (brightness > 150) {
        const alpha = Math.max(0, 255 * ((200 - brightness) / 50));
        data[i + 3] = alpha;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return newCanvas;
  };

  /**
   * Find the bounding box of non-transparent pixels
   */
  const findSignatureBoundingBox = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let minX = width;
    let maxX = -1;
    let minY = height;
    let maxY = -1;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX === -1) {
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
   * Complete signature and convert to base64
   */
  const handleCompleteSignature = () => {
    if (isEmpty) {
      alert('⚠️ Please draw your signature before submitting.');
      return;
    }

    if (signatureCanvasRef.current) {
      // Get the canvas
      const sourceCanvas = signatureCanvasRef.current.getCanvas();

      // Remove white background
      const cleanedCanvas = stripWhiteBackground(sourceCanvas);

      // Get bounding box
      const ctx = cleanedCanvas.getContext('2d');
      const boundingBox = findSignatureBoundingBox(ctx, cleanedCanvas.width, cleanedCanvas.height);

      // Create final canvas with cropped content
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = boundingBox.width || sourceCanvas.width;
      finalCanvas.height = boundingBox.height || sourceCanvas.height;
      const finalCtx = finalCanvas.getContext('2d');

      finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);

      if (boundingBox.width > 0 && boundingBox.height > 0) {
        finalCtx.drawImage(
          cleanedCanvas,
          boundingBox.x,
          boundingBox.y,
          boundingBox.width,
          boundingBox.height,
          0,
          0,
          boundingBox.width,
          boundingBox.height
        );
      } else {
        finalCtx.drawImage(cleanedCanvas, 0, 0);
      }

      // Convert to base64
      const signatureDataUrl = finalCanvas.toDataURL('image/png');

      console.log('✅ Signature captured');
      onSignatureComplete(signatureDataUrl);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Draw Your Signature</h2>
        <p style={styles.subtitle}>Sign in the box below</p>
      </div>

      <div style={styles.canvasContainer}>
        <SignatureCanvas
          ref={signatureCanvasRef}
          penColor={colors.gray900}
          canvasProps={{
            width: 500,
            height: 200,
            style: styles.canvas
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      <div style={styles.buttonContainer}>
        <button
          onClick={handleClear}
          style={styles.clearButton}
        >
          <FiTrash2 style={{ marginRight: spacing.xs }} />
          Clear
        </button>
        <button
          onClick={onCancel}
          style={styles.cancelButton}
        >
          Cancel
        </button>
        <button
          onClick={handleCompleteSignature}
          disabled={isEmpty}
          style={{
            ...styles.completeButton,
            opacity: isEmpty ? 0.5 : 1,
            cursor: isEmpty ? 'not-allowed' : 'pointer'
          }}
        >
          <FiCheck style={{ marginRight: spacing.xs }} />
          Confirm Signature
        </button>
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
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
  },
  header: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gray900,
    margin: 0,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    margin: 0,
  },
  canvasContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    border: `2px dashed ${colors.gray300}`,
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
    cursor: 'crosshair',
  },
  buttonContainer: {
    display: 'flex',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  clearButton: {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.gray200,
    color: colors.gray900,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  cancelButton: {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.gray100,
    color: colors.gray700,
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    cursor: 'pointer',
  },
  completeButton: {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.green,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
};

export default SignatureCanvasModal;
