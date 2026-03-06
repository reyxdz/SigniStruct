import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { createField, updateField, updateFieldPosition, updateFieldSize, updateFieldStyling, cloneField } from '../utils/fieldUtils';
import api from '../services/api';

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

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved
  const autoSaveTimeoutRef = React.useRef(null);
  const fieldsRef = React.useRef(fields);
  const documentRef = React.useRef(document);

  // Keep refs up to date
  React.useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);

  React.useEffect(() => {
    documentRef.current = document;
  }, [document]);

  /**
   * Force save pending changes immediately
   * Used when user navigates away or refresh before debounce completes
   * Uses fetch with keepalive flag for page unload scenarios
   */
  const flushPendingSave = React.useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    if (!documentRef.current?._id) return;

    try {
      console.log('💾 Flushing pending auto-save on page unload...');
      console.log('  Document ID:', documentRef.current._id);
      console.log('  Fields to save:', fieldsRef.current.length);
      
      // Get auth token from localStorage (key is 'token', not 'authToken')
      const token = localStorage.getItem('token');
      console.log('  Token available:', !!token);
      
      // Use fetch with keepalive for reliable save during page unload
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/documents/${documentRef.current._id}/fields`;
      const payload = {
        fields: fieldsRef.current,
        lastEditedAt: new Date().toISOString()
      };
      
      console.log('  Sending PUT to:', url);
      console.log('  Payload:', JSON.stringify(payload).substring(0, 100) + '...');
      
      fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(payload),
        keepalive: true // Critical: tells browser to complete this request even during unload
      }).then((response) => {
        console.log('✅ Flush response status:', response.status);
        if (!response.ok) {
          console.error('❌ Flush response not ok:', response.statusText);
        }
      }).catch((error) => {
        console.error('❌ Failed to flush pending save:', error);
      });
    } catch (error) {
      console.error('❌ Error flushing pending save:', error);
    }
  }, []);

  // ============================================
  // Initialize Fields from Document
  // ============================================

  useEffect(() => {
    console.log('📖 EditorContext initializing with document:', initialDocument);
    if (initialDocument && initialDocument.fields) {
      console.log('📑 Loading fields from initialDocument:', initialDocument.fields);
      console.log('  Document ID:', initialDocument._id);
      setDocument(initialDocument); // Update document state when initialDocument changes!
      setFields(Array.isArray(initialDocument.fields) ? initialDocument.fields : []);
    } else {
      console.log('⚠️ No fields in initialDocument');
      setDocument(initialDocument);
    }
  }, [initialDocument]);

  // ============================================
  // Handle Page Unload - Flush Pending Saves
  // ============================================

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Check if there's a pending save
      if (autoSaveTimeoutRef.current) {
        console.log('⚠️ Pending save detected on page unload');
        // Flush the save synchronously or with keepalive
        flushPendingSave();
        
        // Some browsers require returning a string for beforeunload
        // e.preventDefault();
        // e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [flushPendingSave]);

  // ============================================
  // Auto-Save (Debounced)
  // ============================================

  useEffect(() => {
    // Don't auto-save if no document ID
    if (!document?._id) {
      console.log('⏭️ Skipping auto-save: No document ID');
      return;
    }

    console.log('⏲️ Auto-save timer started. Current fields count:', fields?.length || 0);

    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      console.log('  Clearing previous auto-save timeout');
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set save status to "saving" after 500ms of inactivity
    setSaveStatus('saving');

    // Create new timeout
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('💾 Auto-saving fields...');
        console.log('  Document ID:', document._id);
        console.log('  Fields count:', fields?.length || 0);
        
        const response = await api.put(`/documents/${document._id}/fields`, {
          fields,
          lastEditedAt: new Date().toISOString()
        });

        console.log('📡 API Response:', response.status);
        console.log('  Success:', response.data.success);
        console.log('  Saved fields count:', response.data.document?.fields?.length || 0);

        if (response.data.success) {
          console.log('✅ Auto-save successful');
          setSaveStatus('saved');
          autoSaveTimeoutRef.current = null;
          
          // Reset to idle after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          console.error('❌ API returned success=false');
          setSaveStatus('idle');
        }
      } catch (error) {
        console.error('❌ Auto-save failed:', error.message);
        console.error('  Status:', error.response?.status);
        console.error('  Data:', error.response?.data);
        setSaveStatus('idle');
      }
    }, 500);

    // Cleanup on unmount - flush pending saves
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [fields, document?._id]);

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

  /**
   * Save fields to backend
   * @param {string} documentId - Document ID to save to
   * @returns {Promise<Object>} Response from server
   */
  const saveFields = useCallback(async (documentId) => {
    try {
      console.log('💾 Saving fields to backend...');
      console.log('  Document ID:', documentId);
      console.log('  Fields count:', fields.length);

      const response = await api.put(`/documents/${documentId}/fields`, {
        fields,
        lastEditedAt: new Date().toISOString()
      });

      if (response.data.success) {
        console.log('✅ Fields saved successfully');
        return {
          success: true,
          data: response.data.document
        };
      }
    } catch (error) {
      console.error('❌ Error saving fields:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to save fields'
      };
    }
  }, [fields]);

  // ============================================
  // Context Value
  // ============================================

  const value = {
    // State
    document,
    fields,
    selectedFieldId,
    currentPage,
    saveStatus,

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
    saveFields,
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
