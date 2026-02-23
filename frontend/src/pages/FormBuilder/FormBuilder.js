import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';

const FormBuilder = ({ formId }) => {
  const [formName, setFormName] = useState('Untitled Form');
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);

  const addField = (type) => {
    const newField = {
      id: Date.now(),
      type,
      label: `${type} Field`,
      required: false,
      placeholder: '',
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (id, updates) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
    setSelectedFieldId(null);
  };

  const publishForm = () => {
    alert('Form published! You can now share it with others.');
  };

  const builderStyles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.lightGray,
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      backgroundColor: colors.white,
      borderBottom: `1px solid ${colors.gray200}`,
      padding: spacing.lg,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: colors.shadowMd,
    },
    titleInput: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      border: 'none',
      backgroundColor: 'transparent',
      color: colors.gray900,
      padding: `${spacing.sm} ${spacing.md}`,
      minWidth: '300px',
    },
    actions: {
      display: 'flex',
      gap: spacing.md,
    },
    button: {
      padding: `${spacing.sm} ${spacing.lg}`,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      border: 'none',
      borderRadius: borderRadius.md,
      cursor: 'pointer',
      transition: transitions.fast,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      color: colors.white,
    },
    secondaryButton: {
      backgroundColor: colors.white,
      color: colors.primary,
      border: `2px solid ${colors.primary}`,
    },
    builderContainer: {
      display: 'grid',
      gridTemplateColumns: '250px 1fr 280px',
      gap: spacing.lg,
      flex: 1,
      padding: spacing.lg,
      overflow: 'hidden',
    },
    toolbar: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      boxShadow: colors.shadowMd,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.lg,
    },
    toolbarTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      margin: 0,
    },
    fieldButtons: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: spacing.sm,
    },
    fieldButton: {
      padding: `${spacing.sm} ${spacing.md}`,
      backgroundColor: colors.primaryVeryLight,
      color: colors.primary,
      border: `1px solid ${colors.primary}`,
      borderRadius: borderRadius.md,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.medium,
      cursor: 'pointer',
      transition: transitions.fast,
    },
    canvas: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      boxShadow: colors.shadowMd,
      overflow: 'auto',
    },
    formPreview: {
      maxWidth: '800px',
    },
    formTitle: {
      fontSize: typography.sizes['2xl'],
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      marginBottom: spacing.lg,
      margin: 0,
    },
    emptyCanvas: {
      textAlign: 'center',
      color: colors.gray500,
      padding: `${spacing['3xl']} ${spacing['2xl']}`,
      fontSize: typography.sizes.sm,
    },
    fieldItem: {
      padding: spacing.lg,
      backgroundColor: colors.gray50,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      border: `2px solid transparent`,
      cursor: 'pointer',
      transition: transitions.fast,
    },
    fieldItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryVeryLight,
    },
    fieldLabel: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.gray900,
      marginBottom: spacing.sm,
      display: 'block',
    },
    required: {
      color: colors.error,
      marginLeft: spacing.xs,
    },
    fieldInput: {
      width: '100%',
      padding: `${spacing.sm} ${spacing.md}`,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      fontSize: typography.sizes.sm,
      marginBottom: spacing.md,
    },
    removeButton: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: colors.error,
      color: colors.white,
      border: 'none',
      borderRadius: '50%',
      width: '28px',
      height: '28px',
      fontSize: typography.sizes.lg,
      cursor: 'pointer',
      transition: transitions.fast,
      display: 'none',
    },
    properties: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      boxShadow: colors.shadowMd,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.lg,
      overflow: 'auto',
    },
    propertiesTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      margin: 0,
    },
    propertyGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.sm,
    },
    propertyLabel: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.gray700,
    },
    propertyInput: {
      padding: `${spacing.sm} ${spacing.md}`,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      fontSize: typography.sizes.sm,
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
    },
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div style={builderStyles.container}>
      {/* Header */}
      <div style={builderStyles.header}>
        <input
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          style={builderStyles.titleInput}
          placeholder="Form Title"
        />
        <div style={builderStyles.actions}>
          <button
            style={{
              ...builderStyles.button,
              ...builderStyles.secondaryButton,
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = colors.gray50;
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = colors.white;
            }}
          >
            💾 Save Draft
          </button>
          <button
            style={{
              ...builderStyles.button,
              ...builderStyles.primaryButton,
            }}
            onClick={publishForm}
            onMouseOver={(e) => {
              e.target.style.opacity = '0.9';
            }}
            onMouseOut={(e) => {
              e.target.style.opacity = '1';
            }}
          >
            🚀 Publish Form
          </button>
        </div>
      </div>

      {/* Builder Container */}
      <div style={builderStyles.builderContainer}>
        {/* Toolbar */}
        <div style={builderStyles.toolbar}>
          <h3 style={builderStyles.toolbarTitle}>🧩 Add Fields</h3>
          <div style={builderStyles.fieldButtons}>
            {['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio', 'date', 'signature'].map(
              type => (
                <button
                  key={type}
                  onClick={() => addField(type)}
                  style={builderStyles.fieldButton}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = colors.primary;
                    e.target.style.color = colors.white;
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = colors.primaryVeryLight;
                    e.target.style.color = colors.primary;
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              )
            )}
          </div>
        </div>

        {/* Canvas */}
        <div style={builderStyles.canvas}>
          <div style={builderStyles.formPreview}>
            <h2 style={builderStyles.formTitle}>{formName}</h2>
            {fields.length === 0 ? (
              <p style={builderStyles.emptyCanvas}>
                ✨ Add fields to your form using the toolbar on the left
              </p>
            ) : (
              fields.map(field => (
                <div
                  key={field.id}
                  style={{
                    ...builderStyles.fieldItem,
                    ...(selectedFieldId === field.id && builderStyles.fieldItemSelected),
                    position: 'relative',
                  }}
                  onClick={() => setSelectedFieldId(field.id)}
                  onMouseOver={(e) => {
                    e.currentTarget.querySelector('.remove-field').style.display = 'block';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.querySelector('.remove-field').style.display = 'none';
                  }}
                >
                  <label style={builderStyles.fieldLabel}>
                    {field.label}
                    {field.required && <span style={builderStyles.required}>*</span>}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder || 'Enter value'}
                    disabled
                    style={builderStyles.fieldInput}
                  />
                  <button
                    className="remove-field"
                    style={builderStyles.removeButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeField(field.id);
                    }}
                    onMouseOver={(e) => {
                      e.target.style.opacity = '0.8';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.opacity = '1';
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedField && (
          <div style={builderStyles.properties}>
            <h3 style={builderStyles.propertiesTitle}>⚙️ Properties</h3>
            <div style={builderStyles.propertyGroup}>
              <label style={builderStyles.propertyLabel}>Field Label</label>
              <input
                type="text"
                value={selectedField.label}
                onChange={(e) => updateField(selectedFieldId, { label: e.target.value })}
                style={builderStyles.propertyInput}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.gray300;
                }}
              />
            </div>
            <div style={builderStyles.propertyGroup}>
              <label style={builderStyles.propertyLabel}>Placeholder</label>
              <input
                type="text"
                value={selectedField.placeholder}
                onChange={(e) => updateField(selectedFieldId, { placeholder: e.target.value })}
                style={builderStyles.propertyInput}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.gray300;
                }}
              />
            </div>
            <div style={builderStyles.propertyGroup}>
              <label style={builderStyles.checkboxGroup}>
                <input
                  type="checkbox"
                  checked={selectedField.required}
                  onChange={(e) => updateField(selectedFieldId, { required: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ ...builderStyles.propertyLabel, margin: 0 }}>
                  Required Field
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormBuilder;
