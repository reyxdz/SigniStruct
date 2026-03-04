/**
 * Field Model & Utilities
 * Defines the structure and utility functions for working with document fields
 */

/**
 * Field Model Definition
 * 
 * @typedef {Object} Field
 * @property {string} id - Unique field identifier (e.g., "field-1708950234567")
 * @property {number} toolId - Tool type ID (1-8 based on tool definitions)
 * @property {string} label - Human-readable label (e.g., "My Signature", "Recipient Email")
 * @property {string} type - Field type: 'signature', 'initial', 'email', 'name', 'text'
 * @property {number} pageNumber - PDF page number (1-based)
 * @property {number} x - Horizontal position as percentage (0-100)
 * @property {number} y - Vertical position as percentage (0-100)
 * @property {number} width - Field width in pixels (default: 120)
 * @property {number} height - Field height in pixels (default: 40)
 * @property {string|null} value - Field value (signature image URL, initial letter, email, name, or text)
 * @property {boolean} isRecipient - Whether this is a recipient field
 * @property {Array<Object>} assignedRecipients - Array of recipient assignments (for recipient fields)
 * @property {string} fontFamily - Font family name (default: "Arial")
 * @property {number} fontSize - Font size in pixels (default: 12)
 * @property {string} fontColor - Hex color code (default: "#000000")
 * @property {Object} fontStyles - Font styling options
 * @property {boolean} fontStyles.bold - Bold text flag
 * @property {boolean} fontStyles.italic - Italic text flag
 * @property {boolean} fontStyles.underline - Underline text flag
 * @property {string} createdAt - ISO timestamp of field creation (e.g., "2025-02-26T...")
 * @property {string|null} updatedAt - ISO timestamp of last update
 */

/**
 * Default field dimensions
 */
export const DEFAULT_FIELD_DIMENSIONS = {
  width: 120,
  height: 40,
};

/**
 * Default field styling
 */
export const DEFAULT_FIELD_STYLING = {
  fontFamily: 'Arial',
  fontSize: 12,
  fontColor: '#000000',
  fontStyles: {
    bold: false,
    italic: false,
    underline: false,
  },
};

/**
 * Field type definitions matching tool definitions
 */
export const FIELD_TYPES = {
  SIGNATURE: 'signature',
  INITIAL: 'initial',
  EMAIL: 'email',
  NAME: 'name',
  TEXT: 'text',
};

/**
 * Create a new field from tool data
 * 
 * @param {Object} toolData - Data from drag-dropped tool
 * @param {number} toolData.toolId - Tool ID
 * @param {string} toolData.label - Tool label
 * @param {string} toolData.type - Field type
 * @param {string|null} toolData.value - Field value (optional)
 * @param {boolean} toolData.isRecipient - Is recipient field
 * @param {number} x - X position percentage
 * @param {number} y - Y position percentage
 * @param {number} pageNumber - Page number
 * @returns {Field} New field object
 */
export const createField = (toolData, x, y, pageNumber) => {
  if (!toolData || !toolData.toolId) {
    throw new Error('Invalid tool data for field creation');
  }

  const now = new Date().toISOString();

  return {
    id: `field-${Date.now()}`,
    toolId: toolData.toolId,
    label: toolData.label || 'Untitled Field',
    fieldType: toolData.fieldType || toolData.type || FIELD_TYPES.TEXT,
    pageNumber: pageNumber || 1,
    x: Math.min(Math.max(x || 0, 0), 100),
    y: Math.min(Math.max(y || 0, 0), 100),
    width: DEFAULT_FIELD_DIMENSIONS.width,
    height: DEFAULT_FIELD_DIMENSIONS.height,
    value: toolData.value || null,
    isRecipient: toolData.isRecipient || false,
    assignedRecipients: [],
    fontFamily: DEFAULT_FIELD_STYLING.fontFamily,
    fontSize: DEFAULT_FIELD_STYLING.fontSize,
    fontColor: DEFAULT_FIELD_STYLING.fontColor,
    fontStyles: {
      bold: DEFAULT_FIELD_STYLING.fontStyles.bold,
      italic: DEFAULT_FIELD_STYLING.fontStyles.italic,
      underline: DEFAULT_FIELD_STYLING.fontStyles.underline,
    },
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Update a field with new properties
 * Only updates specified properties, preserves others
 * 
 * @param {Field} field - Existing field to update
 * @param {Object} updates - Properties to update
 * @returns {Field} Updated field object
 */
export const updateField = (field, updates) => {
  if (!field || !field.id) {
    throw new Error('Invalid field for update');
  }

  // Validate position bounds if updating x or y
  if (updates.x !== undefined) {
    updates.x = Math.min(Math.max(updates.x, 0), 100);
  }
  if (updates.y !== undefined) {
    updates.y = Math.min(Math.max(updates.y, 0), 100);
  }

  return {
    ...field,
    ...updates,
    id: field.id, // Prevent ID changes
    createdAt: field.createdAt, // Preserve creation time
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Update field position (x, y percentages)
 * 
 * @param {Field} field - Field to update
 * @param {number} x - New X position (0-100%)
 * @param {number} y - New Y position (0-100%)
 * @returns {Field} Updated field
 */
export const updateFieldPosition = (field, x, y) => {
  return updateField(field, {
    x: Math.min(Math.max(x, 0), 100),
    y: Math.min(Math.max(y, 0), 100),
  });
};

/**
 * Update field size (width, height in pixels)
 * 
 * @param {Field} field - Field to update
 * @param {number} width - New width (pixels)
 * @param {number} height - New height (pixels)
 * @returns {Field} Updated field
 */
export const updateFieldSize = (field, width, height) => {
  return updateField(field, {
    width: Math.max(width || field.width, 20), // Minimum 20px
    height: Math.max(height || field.height, 20),
  });
};

/**
 * Update field styling (font, color, etc.)
 * 
 * @param {Field} field - Field to update
 * @param {Object} styling - Styling properties
 * @returns {Field} Updated field
 */
export const updateFieldStyling = (field, styling) => {
  return updateField(field, {
    fontFamily: styling.fontFamily || field.fontFamily,
    fontSize: Math.max(styling.fontSize || field.fontSize, 8),
    fontColor: styling.fontColor || field.fontColor,
    fontStyles: {
      bold: styling.fontStyles?.bold ?? field.fontStyles.bold,
      italic: styling.fontStyles?.italic ?? field.fontStyles.italic,
      underline: styling.fontStyles?.underline ?? field.fontStyles.underline,
    },
  });
};

/**
 * Validate field structure
 * Ensures field has all required properties
 * 
 * @param {Field} field - Field to validate
 * @returns {Object} Validation result { isValid: boolean, errors: string[] }
 */
export const validateField = (field) => {
  const errors = [];

  if (!field) {
    errors.push('Field is required');
    return { isValid: false, errors };
  }

  // Required properties
  if (!field.id) errors.push('Field ID is required');
  if (field.toolId === undefined) errors.push('Tool ID is required');
  if (!field.label) errors.push('Field label is required');
  if (!field.fieldType && !field.type) errors.push('Field type is required');
  if (!field.pageNumber) errors.push('Page number is required');

  // Numeric properties
  if (typeof field.x !== 'number' || field.x < 0 || field.x > 100) {
    errors.push('X position must be between 0-100');
  }
  if (typeof field.y !== 'number' || field.y < 0 || field.y > 100) {
    errors.push('Y position must be between 0-100');
  }
  if (typeof field.width !== 'number' || field.width < 10) {
    errors.push('Width must be at least 10px');
  }
  if (typeof field.height !== 'number' || field.height < 10) {
    errors.push('Height must be at least 10px');
  }
  if (typeof field.fontSize !== 'number' || field.fontSize < 8 || field.fontSize > 72) {
    errors.push('Font size must be between 8-72px');
  }

  // Font styles object
  if (!field.fontStyles || typeof field.fontStyles !== 'object') {
    errors.push('Font styles object is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Clone a field (create deep copy)
 * Useful for copying fields or creating templates
 * 
 * @param {Field} field - Field to clone
 * @param {Object} overrides - Properties to override in clone
 * @returns {Field} Cloned field with new ID
 */
export const cloneField = (field, overrides = {}) => {
  const cloned = {
    ...field,
    fontStyles: { ...field.fontStyles },
    assignedRecipients: [...(field.assignedRecipients || [])],
    id: `field-${Date.now()}`, // Generate new ID
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };

  return cloned;
};

/**
 * Get fields on a specific page
 * 
 * @param {Field[]} fields - Array of all fields
 * @param {number} pageNumber - Page number to filter
 * @returns {Field[]} Fields on specified page
 */
export const getFieldsOnPage = (fields, pageNumber) => {
  if (!Array.isArray(fields)) return [];
  return fields.filter(field => field.pageNumber === pageNumber);
};

/**
 * Get fields by type
 * 
 * @param {Field[]} fields - Array of all fields
 * @param {string} type - Field type to filter
 * @returns {Field[]} Fields of specified type
 */
export const getFieldsByType = (fields, type) => {
  if (!Array.isArray(fields)) return [];
  return fields.filter(field => (field.fieldType || field.type) === type);
};

/**
 * Get recipient fields
 * 
 * @param {Field[]} fields - Array of all fields
 * @returns {Field[]} All recipient fields
 */
export const getRecipientFields = (fields) => {
  if (!Array.isArray(fields)) return [];
  return fields.filter(field => field.isRecipient);
};

/**
 * Get sender fields (non-recipient)
 * 
 * @param {Field[]} fields - Array of all fields
 * @returns {Field[]} All sender fields
 */
export const getSenderFields = (fields) => {
  if (!Array.isArray(fields)) return [];
  return fields.filter(field => !field.isRecipient);
};

/**
 * Calculate field bounds for intersection detection
 * 
 * @param {Field} field - Field to get bounds for
 * @param {number} containerWidth - PDF container width in pixels
 * @param {number} containerHeight - PDF container height in pixels
 * @returns {Object} Bounds { left, top, right, bottom }
 */
export const getFieldBounds = (field, containerWidth, containerHeight) => {
  const left = (field.x / 100) * containerWidth;
  const top = (field.y / 100) * containerHeight;
  const right = left + field.width;
  const bottom = top + field.height;

  return { left, top, right, bottom };
};

/**
 * Check if two fields overlap
 * 
 * @param {Field} field1 - First field
 * @param {Field} field2 - Second field
 * @param {number} containerWidth - PDF container width
 * @param {number} containerHeight - PDF container height
 * @returns {boolean} True if fields overlap
 */
export const fieldsOverlap = (field1, field2, containerWidth, containerHeight) => {
  if (field1.pageNumber !== field2.pageNumber) return false;

  const b1 = getFieldBounds(field1, containerWidth, containerHeight);
  const b2 = getFieldBounds(field2, containerWidth, containerHeight);

  return !(b1.right < b2.left || b1.left > b2.right || 
           b1.bottom < b2.top || b1.top > b2.bottom);
};

/**
 * Serialize fields for API transmission
 * Converts timestamps and ensures JSON compatibility
 * 
 * @param {Field[]} fields - Fields to serialize
 * @returns {Object[]} Serialized fields
 */
export const serializeFields = (fields) => {
  if (!Array.isArray(fields)) return [];

  return fields.map(field => ({
    ...field,
    createdAt: field.createdAt instanceof Date ? field.createdAt.toISOString() : field.createdAt,
    updatedAt: field.updatedAt instanceof Date ? field.updatedAt.toISOString() : field.updatedAt,
  }));
};

/**
 * Deserialize fields from API response
 * Converts timestamps back to Date objects
 * 
 * @param {Object[]} serialized - Serialized fields from API
 * @returns {Field[]} Deserialized fields
 */
export const deserializeFields = (serialized) => {
  if (!Array.isArray(serialized)) return [];

  return serialized.map(field => ({
    ...field,
    createdAt: field.createdAt instanceof Date ? field.createdAt : new Date(field.createdAt),
    updatedAt: field.updatedAt instanceof Date ? field.updatedAt : new Date(field.updatedAt),
  }));
};

/**
 * Export all utilities as named exports
 * Available for import as: import { createField, updateField, ... } from '../../utils/fieldUtils'
 */
