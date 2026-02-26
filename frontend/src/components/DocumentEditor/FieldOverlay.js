import React from 'react';
import { colors, typography, borderRadius } from '../../theme';
import { FiX } from 'react-icons/fi';

/**
 * FieldOverlay Component
 * Renders a single field overlay on the PDF
 * Shows field value with styling and selection indicators
 */
const FieldOverlay = ({
  field,
  isSelected,
  onSelect,
  onRemove,
  zoomLevel = 100
}) => {
  if (!field) return null;

  // Get field type icon styling
  const getFieldIcon = () => {
    switch (field.type) {
      case 'signature':
        return '✓';
      case 'initial':
        return field.value?.charAt(0).toUpperCase() || 'I';
      case 'email':
        return '@';
      case 'name':
        return 'N';
      default:
        return '□';
    }
  };

  // Get field type color
  const getFieldColor = () => {
    if (field.isRecipient) {
      return '#f59e0b'; // Amber for recipient fields
    }
    switch (field.type) {
      case 'signature':
        return '#3b82f6'; // Blue
      case 'initial':
        return '#8b5cf6'; // Purple
      case 'email':
        return '#ec4899'; // Pink
      case 'name':
        return '#10b981'; // Green
      default:
        return '#6b7280'; // Gray
    }
  };

  const fieldColor = getFieldColor();
  const fieldIcon = getFieldIcon();

  return (
    <div
      style={{
        ...styles.fieldOverlay,
        left: `${field.x}%`,
        top: `${field.y}%`,
        width: `${field.width}px`,
        height: `${field.height}px`,
        borderColor: isSelected ? fieldColor : `${fieldColor}80`,
        backgroundColor: isSelected ? `${fieldColor}15` : `${fieldColor}08`,
        zIndex: isSelected ? 1000 : 100,
        transform: `scale(${zoomLevel / 100})`,
        transformOrigin: 'top left',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(field.id);
      }}
      title={`${field.label} - Click to select`}
    >
      {/* Field Icon/Symbol */}
      <div style={{
        ...styles.fieldContent,
        color: fieldColor,
      }}>
        <span style={styles.fieldIcon}>{fieldIcon}</span>
        {field.type === 'signature' && field.value && (
          <img
            src={field.value}
            alt="Signature"
            style={styles.signatureImage}
          />
        )}
      </div>

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
            }}
            title="Drag to move field"
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
  },

  fieldIcon: {
    fontSize: '16px',
    fontWeight: 'bold',
  },

  signatureImage: {
    maxWidth: '90%',
    maxHeight: '80%',
    objectFit: 'contain',
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
