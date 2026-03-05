import React, { useState, useRef, useCallback, useEffect } from 'react';
import { colors, typography, borderRadius } from '../../theme';
import { FiX } from 'react-icons/fi';
import { FIELD_TYPES } from '../../utils/fieldUtils';

/**
 * FieldOverlay Component
 * Renders a single field overlay on the PDF
 * Shows field value with styling and selection indicators
 * Supports dragging to move and resizing via handle
 */
const FieldOverlay = ({
  field,
  isSelected,
  onSelect,
  onRemove,
  onMove,
  onResize,
  zoomLevel = 100,
  containerWidth = 100,
  containerHeight = 100
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const overlayRef = useRef(null);

  useEffect(() => {
    console.log(`🎯 FieldOverlay rendering: Field ${field.id}, isSelected=${isSelected}, x=${field.x}%, y=${field.y}%, width=${field.width}px, height=${field.height}px`);
    if ((field.fieldType || field.type) === 'signature') {
      console.log(`  Signature field: has image=${!!field.value}, image length=${field.value?.length || 0}`);
      if (field.value) {
        const srcPreview = field.value.substring(0, 150);
        console.log(`  Image src (first 150 chars): ${srcPreview}...`);
      }
    }
  }, [field.id, field.x, field.y, isSelected, field.width, field.height, field.value, field.fieldType, field.type]);

  // Get field type color
  const getFieldColor = () => {
    if (field.isRecipient) {
      return '#f59e0b'; // Amber for recipient fields
    }
    switch (field.fieldType || field.type) {
      case FIELD_TYPES.SIGNATURE:
        return '#3b82f6'; // Blue
      case FIELD_TYPES.INITIAL:
        return '#8b5cf6'; // Purple
      case FIELD_TYPES.EMAIL:
        return '#ec4899'; // Pink
      case FIELD_TYPES.NAME:
        return '#10b981'; // Green
      case FIELD_TYPES.TEXT:
        return '#6366f1'; // Indigo
      default:
        return '#6b7280'; // Gray
    }
  };

  /**
   * Handle drag start - moving field
   */
  const handleDragStart = useCallback((e) => {
    if (!isSelected) return;
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      fieldX: field.x,
      fieldY: field.y,
    });
  }, [isSelected, field.x, field.y]);

  /**
   * Handle mouse move - dragging field
   */
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !isSelected) return;
    e.stopPropagation();

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Convert pixel deltas to percentage (assuming container width/height in pixels)
    // This is approximate - actual calculation depends on PDF viewer dimensions
    const zoomFactor = zoomLevel / 100;
    const containerWidthPx = containerWidth; // in 100% = containerWidth px
    const containerHeightPx = containerHeight;

    const deltaXPercent = (deltaX * 100) / (containerWidthPx * zoomFactor);
    const deltaYPercent = (deltaY * 100) / (containerHeightPx * zoomFactor);

    // Calculate new position with bounds checking (0-100%)
    let newX = dragStart.fieldX + deltaXPercent;
    let newY = dragStart.fieldY + deltaYPercent;

    // Clamp to bounds
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    // Call onMove callback
    if (onMove) {
      onMove(field.id, newX, newY);
    }
  }, [isDragging, isSelected, dragStart, zoomLevel, containerWidth, containerHeight, field.id, onMove]);

  /**
   * Handle mouse up - stop dragging and deselect field
   */
  const handleMouseUp = useCallback((e) => {
    if (isDragging) {
      setIsDragging(false);
      e.stopPropagation();
      // Deselect the field after dropping it
      setTimeout(() => {
        onSelect(null);
      }, 0);
    }
  }, [isDragging, onSelect]);

  /**
   * Handle resize start - resizing field
   */
  const handleResizeStart = useCallback((e) => {
    if (!isSelected) return;
    e.stopPropagation();
    
    setIsResizing(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      fieldWidth: field.width,
      fieldHeight: field.height,
    });
  }, [isSelected, field.width, field.height]);

  /**
   * Handle mouse move - resizing field
   */
  const handleResizeMouseMove = useCallback((e) => {
    if (!isResizing || !isSelected) return;
    e.stopPropagation();

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Minimum field size (20px)
    const minSize = 20;
    const zoomFactor = zoomLevel / 100;

    // Calculate new size
    let newWidth = dragStart.fieldWidth + (deltaX / zoomFactor);
    let newHeight = dragStart.fieldHeight + (deltaY / zoomFactor);

    // Enforce minimum size
    newWidth = Math.max(minSize, newWidth);
    newHeight = Math.max(minSize, newHeight);

    // Call onResize callback
    if (onResize) {
      onResize(field.id, newWidth, newHeight);
    }
  }, [isResizing, isSelected, dragStart, zoomLevel, field.id, onResize]);

  /**
   * Handle mouse up - stop resizing
   */
  const handleResizeMouseUp = useCallback((e) => {
    if (isResizing) {
      setIsResizing(false);
      e.stopPropagation();
    }
  }, [isResizing]);

  // Add global mouse move/up listeners when dragging or resizing
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleResizeMouseUp);
      };
    }
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  if (!field) return null;

  const fieldColor = getFieldColor();

  return (
    <div
      ref={overlayRef}
      style={{
        ...styles.fieldOverlay,
        left: `${field.x}%`,
        top: `${field.y}%`,
        width: `${field.width}px`,
        height: `${field.height}px`,
        border: isSelected ? `3px solid ${fieldColor}` : 'none',
        backgroundColor: 'transparent',
        backgroundImage: isSelected ? `repeating-linear-gradient(45deg, transparent, transparent 10px, ${fieldColor}08 10px, ${fieldColor}08 20px)` : 'none',
        zIndex: isSelected ? 1000 : 100,
        transform: `scale(${zoomLevel / 100})`,
        transformOrigin: 'top left',
        cursor: isSelected ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        boxShadow: isDragging || isResizing ? `0 4px 12px ${fieldColor}40` : isSelected ? `0 0 0 3px ${fieldColor}25, inset 0 0 0 1px ${fieldColor}50` : 'none',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(field.id);
      }}
      onMouseDown={handleDragStart}
      title={`${field.label} - Click to select, drag to move`}
    >
      {/* Signature Image - Show when field has a signature value, always visible */}
      {(field.fieldType || field.type) === 'signature' && field.value && (
        <img
          src={field.value}
          alt="Signature"
          style={styles.signatureImage}
          onError={(e) => {
            console.error(`🔴 FieldOverlay: Image failed to load for field ${field.id}`);
            console.error(`  Src preview: ${field.value?.substring(0, 100) || 'null'}...`);
            console.error(`  Error:`, e);
          }}
          onLoad={() => {
            console.log(`✅ FieldOverlay: Image loaded successfully for field ${field.id}`);
          }}
        />
      )}

      {/* Text Content - Show for non-signature fields */}
      {(field.fieldType || field.type) !== 'signature' && field.value && (
        <div style={styles.fieldContent}>
          <span style={{
            color: field.fontColor || '#000000',
            fontFamily: field.fontFamily || 'Arial',
            fontSize: `${field.fontSize || 14}px`,
            fontWeight: field.fontStyles?.bold ? 'bold' : 'normal',
            fontStyle: field.fontStyles?.italic ? 'italic' : 'normal',
            textDecoration: field.fontStyles?.underline ? 'underline' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {field.value}
          </span>
        </div>
      )}

      {/* Selection Indicators */}
      {isSelected && (
        <>
          {/* Selection Box */}
          <div style={{
            ...styles.selectionBox,
            borderColor: fieldColor,
          }} />

          {/* Remove Button */}
          <button
            style={{
              ...styles.removeButton,
              backgroundColor: fieldColor,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(field.id);
            }}
            title="Delete field"
          >
            <FiX size={12} color="white" />
          </button>

          {/* Drag Handle */}
          <div
            style={{
              ...styles.dragHandle,
              backgroundColor: fieldColor,
              cursor: isResizing ? 'nwse-resize' : 'grab',
              transform: isResizing ? 'scale(1.2)' : 'scale(1)',
            }}
            onMouseDown={handleResizeStart}
            title="Drag to resize field"
          />
        </>
      )}

      {/* Label for recipient fields */}
      {field.isRecipient && (
        <div style={{
          ...styles.recipientLabel,
          backgroundColor: fieldColor,
        }}>
          R
        </div>
      )}
    </div>
  );
};

/**
 * Inline Styles
 */
const styles = {
  fieldOverlay: {
    position: 'absolute',
    border: '2px solid',
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },

  fieldContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    position: 'relative',
    background: 'transparent',
  },

  fieldIcon: {
    fontSize: '16px',
    fontWeight: 'bold',
  },

  signatureImage: {
    maxWidth: '90%',
    maxHeight: '80%',
    objectFit: 'contain',
    backgroundColor: 'transparent',
    mixBlendMode: 'darken',
  },

  // Selection State Styles
  selectionBox: {
    position: 'absolute',
    top: '-2px',
    left: '-2px',
    right: '-2px',
    bottom: '-2px',
    border: '2px solid',
    borderRadius: borderRadius.sm,
    pointerEvents: 'none',
    boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)',
  },

  removeButton: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
    zIndex: 2000,
  },

  dragHandle: {
    position: 'absolute',
    bottom: '-6px',
    right: '-6px',
    width: '12px',
    height: '12px',
    borderRadius: '2px',
    cursor: 'grab',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
    zIndex: 1500,
  },

  recipientLabel: {
    position: 'absolute',
    top: '-8px',
    left: '-8px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.white,
    fontSize: '10px',
    fontWeight: typography.weights.bold,
    zIndex: 1200,
  },
};

export default FieldOverlay;
