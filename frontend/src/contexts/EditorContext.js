import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { createField, updateField, updateFieldPosition, updateFieldSize, updateFieldStyling, cloneField } from '../utils/fieldUtils';

/**
 * EditorContext
 * Manages state for the document editor including:
 * - Fields and their operations
 * - Document metadata
 * - Page navigation
 * - Field selection
 */
const EditorContext = createContext(null);

/**
 * EditorProvider Component
 * Wraps the document editor with centralized state management
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.initialDocument - Initial document data
 */
export const EditorProvider = ({ children, initialDocument = null }) => {
  // Document state
  const [document, setDocument] = useState(initialDocument);

  // Field state
  const [fields, setFields] = useState([]);

  // UI state
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ============================================
  // Initialize Fields from Document
  // ============================================

  useEffect(() => {
    console.log('📖 EditorContext initializing with document:', initialDocument);
    if (initialDocument && initialDocument.fields) {
      console.log('📑 Loading fields from initialDocument:', initialDocument.fields);
      setFields(Array.isArray(initialDocument.fields) ? initialDocument.fields : []);
    } else {
      console.log('⚠️ No fields in initialDocument');
    }
  }, [initialDocument]);

  // ============================================
  // Field Operations
  // ============================================

  /**
   * Add a new field to the document
   * @param {Object} toolData - Data from dragged tool
   * @param {number} x - X position percentage
   * @param {number} y - Y position percentage
   * @param {number} pageNumber - Page number
   * @returns {Field} The created field
   */
  const addField = useCallback((toolData, x, y, pageNumber) => {
    try {
      const newField = createField(toolData, x, y, pageNumber);
      setFields(prev => [...prev, newField]);
      setSelectedFieldId(newField.id);
      return newField;
    } catch (err) {
      console.error('Error adding field:', err);
      throw err;
    }
  }, []);

  /**
   * Remove a field by ID
   * @param {string} fieldId - Field ID to remove
   */
  const removeField = useCallback((fieldId) => {
    console.log(`🗑️ EditorContext.removeField triggered for field: ${fieldId}`);
    setFields(prev => {
      const filtered = prev.filter(f => f.id !== fieldId);
      console.log(`  Fields before: ${prev.length}, after: ${filtered.length}`);
      return filtered;
    });
    if (selectedFieldId === fieldId) {
      console.log(`  Clearing selection as deleted field was selected`);
      setSelectedFieldId(null);
    }
  }, [selectedFieldId]);

  /**
   * Update a field's properties
   * @param {string} fieldId - Field ID to update
   * @param {Object} updates - Properties to update
   * @returns {Field} The updated field
   */
  const updateFieldData = useCallback((fieldId, updates) => {
    let updatedField = null;

    setFields(prev => prev.map(field => {
      if (field.id === fieldId) {
        updatedField = updateField(field, updates);
        return updatedField;
      }
      return field;
    }));

    return updatedField;
  }, []);

  /**
   * Update field position (move)
   * @param {string} fieldId - Field ID
   * @param {number} x - New X position (0-100%)
   * @param {number} y - New Y position (0-100%)
   * @returns {Field} Updated field
   */
  const moveField = useCallback((fieldId, x, y) => {
    let movedField = null;

    setFields(prev => prev.map(field => {
      if (field.id === fieldId) {
        movedField = updateFieldPosition(field, x, y);
        return movedField;
      }
      return field;
    }));

    return movedField;
  }, []);

  /**
   * Update field size (resize)
   * @param {string} fieldId - Field ID
   * @param {number} width - New width (pixels)
   * @param {number} height - New height (pixels)
   * @returns {Field} Updated field
   */
  const resizeField = useCallback((fieldId, width, height) => {
    let resizedField = null;

    setFields(prev => prev.map(field => {
      if (field.id === fieldId) {
        resizedField = updateFieldSize(field, width, height);
        return resizedField;
      }
      return field;
    }));

    return resizedField;
  }, []);

  /**
   * Update field styling (font, color, etc.)
   * @param {string} fieldId - Field ID
   * @param {Object} styling - Styling properties
   * @returns {Field} Updated field
   */
  const updateFieldStyle = useCallback((fieldId, styling) => {
    let styledField = null;

    setFields(prev => prev.map(field => {
      if (field.id === fieldId) {
        styledField = updateFieldStyling(field, styling);
        return styledField;
      }
      return field;
    }));

    return styledField;
  }, []);

  /**
   * Duplicate a field
   * @param {string} fieldId - Field ID to duplicate
   * @param {Object} overrides - Properties to override in duplicate
   * @returns {Field} The duplicated field
   */
  const duplicateField = useCallback((fieldId, overrides = {}) => {
    const fieldToDuplicate = fields.find(f => f.id === fieldId);
    if (!fieldToDuplicate) {
      console.error('Field not found:', fieldId);
      return null;
    }

    const duplicatedField = cloneField(fieldToDuplicate, {
      x: Math.min(fieldToDuplicate.x + 5, 100),
      y: Math.min(fieldToDuplicate.y + 5, 100),
      ...overrides
    });

    setFields(prev => [...prev, duplicatedField]);
    setSelectedFieldId(duplicatedField.id);
    return duplicatedField;
  }, [fields]);

  /**
   * Clear all fields on a specific page
   * @param {number} pageNumber - Page number
   */
  const clearPageFields = useCallback((pageNumber) => {
    setFields(prev => prev.filter(f => f.pageNumber !== pageNumber));
    if (selectedFieldId && fields.find(f => f.id === selectedFieldId && f.pageNumber === pageNumber)) {
      setSelectedFieldId(null);
    }
  }, [selectedFieldId, fields]);

  /**
   * Clear all fields
   */
  const clearAllFields = useCallback(() => {
    setFields([]);
    setSelectedFieldId(null);
  }, []);

  /**
   * Get field by ID
   * @param {string} fieldId - Field ID
   * @returns {Field|undefined}
   */
  const getField = useCallback((fieldId) => {
    return fields.find(f => f.id === fieldId);
  }, [fields]);

  // ============================================
  // Selection & Navigation
  // ============================================

  /**
   * Select a field
   * @param {string} fieldId - Field ID to select
   */
  const selectField = useCallback((fieldId) => {
    setSelectedFieldId(fieldId);
  }, []);

  /**
   * Deselect current field
   */
  const deselectField = useCallback(() => {
    setSelectedFieldId(null);
  }, []);

  /**
   * Change current page
   * @param {number} pageNumber - Page number
   */
  const changePage = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);

  // ============================================
  // Document Operations
  // ============================================

  /**
   * Update document metadata
   * @param {Object} updates - Document properties to update
   */
  const updateDocument = useCallback((updates) => {
    setDocument(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    }));
  }, []);

  /**
   * Load fields into editor
   * @param {Field[]} loadedFields - Fields to load
   */
  const loadFields = useCallback((loadedFields) => {
    setFields(Array.isArray(loadedFields) ? loadedFields : []);
    setSelectedFieldId(null);
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setDocument(initialDocument);
    setFields([]);
    setSelectedFieldId(null);
    setCurrentPage(1);
  }, [initialDocument]);

  // ============================================
  // Context Value
  // ============================================

  const value = {
    // State
    document,
    fields,
    selectedFieldId,
    currentPage,

    // Field operations
    addField,
    removeField,
    updateFieldData,
    moveField,
    resizeField,
    updateFieldStyle,
    duplicateField,
    clearPageFields,
    clearAllFields,
    getField,

    // Selection & Navigation
    selectField,
    deselectField,
    changePage,

    // Document operations
    updateDocument,
    loadFields,
    reset,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

/**
 * useEditor Hook
 * Access editor state and actions in any component within EditorProvider
 * 
 * @returns {Object} Editor context value with state and actions
 * @throws {Error} If used outside EditorProvider
 */
export const useEditor = () => {
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }

  return context;
};

export default EditorContext;
