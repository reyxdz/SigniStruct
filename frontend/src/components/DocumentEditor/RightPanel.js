import React, { useState, useEffect } from 'react';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { FiTrash2, FiX, FiPlus, FiSearch, FiLoader } from 'react-icons/fi';
import { useEditor } from '../../contexts/EditorContext';
import api from '../../services/api';
import './RightPanel.css';

/**
 * RightPanel Component
 * Displays properties for the selected field
 * Allows editing field styling, recipients, and deletion
 */
const RightPanel = () => {
  const { selectedFieldId, fields, removeField, updateFieldData } = useEditor();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showRecipientSearch, setShowRecipientSearch] = useState(false);
  const searchTimeoutRef = React.useRef(null);

  const selectedField = fields.find(f => f.id === selectedFieldId);

  // Handle recipient search
  useEffect(() => {
    if (!selectedField?.isRecipient) return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.data.success) {
          // Filter out already assigned recipients
          const assignedEmails = (selectedField.assignedRecipients || []).map(r => r.recipientEmail);
          const filtered = (response.data.data || []).filter(
            user => !assignedEmails.includes(user.email)
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Error searching recipients:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, selectedField]);

  if (!selectedField) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>Properties</h3>
        </div>
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Select a field to edit properties</p>
        </div>
      </div>
    );
  }

  const handleFontFamilyChange = (e) => {
    updateFieldData(selectedFieldId, { fontFamily: e.target.value });
  };

  const handleFontSizeChange = (e) => {
    const value = e.target.value;
    // Allow free typing - don't clamp while user is still editing
    if (value === '') {
      updateFieldData(selectedFieldId, { fontSize: null });
    } else {
      const size = parseInt(value);
      if (!isNaN(size) && size <= 15) {
        // Only allow values up to 15
        updateFieldData(selectedFieldId, { fontSize: size });
      }
    }
  };

  const handleFontSizeBlur = (e) => {
    // Enforce constraints only when losing focus
    const value = e.target.value;
    if (value === '') {
      updateFieldData(selectedFieldId, { fontSize: 14 });
    } else {
      const size = parseInt(value);
      if (!isNaN(size)) {
        const clamped = Math.max(8, Math.min(15, size));
        updateFieldData(selectedFieldId, { fontSize: clamped });
      }
    }
  };

  const handleColorChange = (e) => {
    updateFieldData(selectedFieldId, { fontColor: e.target.value });
  };

  const handleStyleToggle = (style) => {
    const currentStyles = selectedField.fontStyles || {};
    const newStyles = {
      ...currentStyles,
      [style]: !currentStyles[style]
    };
    updateFieldData(selectedFieldId, { fontStyles: newStyles });
  };

  const handleAddRecipient = (user) => {
    const newRecipient = {
      recipientId: user._id || user.id,
      recipientEmail: user.email,
      recipientName: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
      status: 'pending'
    };

    const currentRecipients = selectedField.assignedRecipients || [];
    const updatedRecipients = [...currentRecipients, newRecipient];

    updateFieldData(selectedFieldId, { assignedRecipients: updatedRecipients });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveRecipient = (email) => {
    const updatedRecipients = (selectedField.assignedRecipients || []).filter(
      r => r.recipientEmail !== email
    );
    updateFieldData(selectedFieldId, { assignedRecipients: updatedRecipients });
  };

  const handleClearAllRecipients = () => {
    updateFieldData(selectedFieldId, { assignedRecipients: [] });
  };

  const handleDelete = () => {
    if (window.confirm(`Delete field "${selectedField.label}"?`)) {
      removeField(selectedFieldId);
    }
  };

  const fontStyles = selectedField.fontStyles || {};

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Properties</h3>
      </div>

      <div style={styles.content}>
        {/* Field Information Section */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Field Information</h4>
          
          <div style={styles.propertyGroup}>
            <label style={styles.label}>Field Name</label>
            <input
              type="text"
              value={selectedField.label}
              readOnly
              style={styles.readOnlyInput}
            />
          </div>

          <div style={styles.propertyGroup}>
            <label style={styles.label}>Type</label>
            <input
              type="text"
              value={selectedField.type || selectedField.fieldType || 'Unknown'}
              readOnly
              style={styles.readOnlyInput}
            />
          </div>
        </div>

        {/* Styling Section */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Styling</h4>

          <div style={styles.propertyGroup}>
            <label style={styles.label}>Font Family</label>
            <select
              value={selectedField.fontFamily || 'Arial'}
              onChange={handleFontFamilyChange}
              style={styles.select}
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier">Courier</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>

          <div style={styles.propertyGroup}>
            <label style={styles.label}>Font Size</label>
            <input
              type="number"
              min="8"
              max="15"
              value={selectedField.fontSize || ''}
              onChange={handleFontSizeChange}
              onBlur={handleFontSizeBlur}
              placeholder="14"
              style={styles.numberInput}
            />
          </div>

          <div style={styles.propertyGroup}>
            <label style={styles.label}>Color</label>
            <input
              type="color"
              value={selectedField.fontColor || '#000000'}
              onChange={handleColorChange}
              style={styles.colorInput}
            />
          </div>

          <div style={styles.propertyGroup}>
            <label style={styles.label}>Font Style</label>
            <div style={styles.styleButtonsGroup}>
              <button
                onClick={() => handleStyleToggle('bold')}
                style={{
                  ...styles.styleButton,
                  ...(fontStyles.bold ? styles.styleButtonActive : {})
                }}
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                onClick={() => handleStyleToggle('italic')}
                style={{
                  ...styles.styleButton,
                  ...(fontStyles.italic ? styles.styleButtonActive : {})
                }}
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                onClick={() => handleStyleToggle('underline')}
                style={{
                  ...styles.styleButton,
                  ...(fontStyles.underline ? styles.styleButtonActive : {})
                }}
                title="Underline"
              >
                <u>U</u>
              </button>
            </div>
          </div>
        </div>

        {/* Recipient Assignment Section (only for recipient fields) */}
        {selectedField.isRecipient && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Assign Recipients</h4>

            {/* Assigned Recipients List */}
            {(selectedField.assignedRecipients || []).length > 0 && (
              <div style={styles.recipientsList}>
                {selectedField.assignedRecipients.map((recipient) => (
                  <div key={recipient.recipientEmail} style={styles.recipientTag}>
                    <div style={styles.recipientInfo}>
                      <span style={styles.recipientEmail}>{recipient.recipientEmail}</span>
                      {recipient.recipientName && (
                        <span style={styles.recipientName}>{recipient.recipientName}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveRecipient(recipient.recipientEmail)}
                      style={styles.removeButton}
                      title="Remove recipient"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Recipient Search */}
            <div style={styles.searchSection}>
              <div style={styles.searchInputWrapper}>
                <FiSearch size={16} style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search recipients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowRecipientSearch(true)}
                  style={styles.searchInput}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={styles.clearButton}
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showRecipientSearch && searchQuery.trim() && (
                <div style={styles.searchDropdown}>
                  {isSearching && (
                    <div style={styles.searchingMessage}>
                      <FiLoader size={14} style={styles.spinner} />
                      Searching...
                    </div>
                  )}

                  {!isSearching && searchResults.length > 0 && (
                    <div style={styles.resultsList}>
                      {searchResults.map((user) => (
                        <button
                          key={user._id || user.id}
                          onClick={() => handleAddRecipient(user)}
                          style={styles.resultItem}
                        >
                          <FiPlus size={14} style={{ marginRight: spacing.sm }} />
                          <div style={styles.resultInfo}>
                            <span style={styles.resultName}>
                              {user.firstName} {user.lastName}
                            </span>
                            <span style={styles.resultEmail}>{user.email}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!isSearching && searchResults.length === 0 && (
                    <div style={styles.noResults}>No recipients found</div>
                  )}
                </div>
              )}
            </div>

            {/* Clear All Button */}
            {(selectedField.assignedRecipients || []).length > 0 && (
              <button
                onClick={handleClearAllRecipients}
                style={styles.clearAllButton}
              >
                Clear All Recipients
              </button>
            )}
          </div>
        )}

        {/* Delete Section */}
        <div style={styles.section}>
          <button
            onClick={handleDelete}
            style={styles.deleteButton}
          >
            <FiTrash2 size={16} />
            Delete Field
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline Styles
 */
const styles = {
  container: {
    width: '350px',
    backgroundColor: colors.white,
    borderLeft: `1px solid ${colors.gray200}`,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },

  header: {
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.gray200}`,
    backgroundColor: colors.gray50,
  },

  title: {
    margin: 0,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.gray900,
  },

  content: {
    flex: 1,
    overflowY: 'auto',
    padding: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },

  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },

  emptyText: {
    color: colors.gray400,
    fontSize: typography.sizes.sm,
    margin: 0,
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottom: `1px solid ${colors.gray100}`,
  },

  sectionTitle: {
    margin: 0,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  propertyGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },

  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.gray600,
  },

  readOnlyInput: {
    padding: spacing.sm,
    border: `1px solid ${colors.gray200}`,
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    backgroundColor: colors.gray50,
    color: colors.gray700,
    fontFamily: 'inherit',
    cursor: 'default',
  },

  select: {
    padding: spacing.sm,
    border: `1px solid ${colors.gray200}`,
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    fontFamily: 'inherit',
    backgroundColor: colors.white,
    cursor: 'pointer',
    transition: `border-color 0.2s ease`,
  },

  numberInput: {
    padding: spacing.sm,
    border: `1px solid ${colors.gray200}`,
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    fontFamily: 'inherit',
  },

  colorInput: {
    width: '100%',
    height: '40px',
    border: `1px solid ${colors.gray200}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },

  styleButtonsGroup: {
    display: 'flex',
    gap: spacing.xs,
  },

  styleButton: {
    flex: 1,
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${colors.gray200}`,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    cursor: 'pointer',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    transition: `all 0.2s ease`,
  },

  styleButtonActive: {
    backgroundColor: colors.primary,
    color: colors.white,
    borderColor: colors.primary,
  },

  recipientsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },

  recipientTag: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    backgroundColor: colors.gray50,
    border: `1px solid ${colors.gray200}`,
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.xs,
  },

  recipientInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },

  recipientEmail: {
    color: colors.gray900,
    fontWeight: typography.weights.medium,
  },

  recipientName: {
    color: colors.gray500,
    fontSize: typography.sizes.xs,
  },

  removeButton: {
    background: 'none',
    border: 'none',
    color: colors.error,
    cursor: 'pointer',
    padding: spacing.xs,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchSection: {
    position: 'relative',
  },

  searchInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  searchIcon: {
    position: 'absolute',
    left: spacing.sm,
    color: colors.gray400,
    pointerEvents: 'none',
  },

  searchInput: {
    width: '100%',
    padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.lg}`,
    border: `1px solid ${colors.gray200}`,
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    fontFamily: 'inherit',
  },

  clearButton: {
    position: 'absolute',
    right: spacing.sm,
    background: 'none',
    border: 'none',
    color: colors.gray400,
    cursor: 'pointer',
    padding: spacing.xs,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.white,
    border: `1px solid ${colors.gray200}`,
    borderRadius: borderRadius.md,
    boxShadow: colors.shadowMd,
    zIndex: 1000,
    maxHeight: '300px',
    overflowY: 'auto',
  },

  searchingMessage: {
    padding: spacing.md,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    color: colors.gray500,
    fontSize: typography.sizes.xs,
    justifyContent: 'center',
  },

  spinner: {
    animation: 'spin 1s linear infinite',
  },

  resultsList: {
    display: 'flex',
    flexDirection: 'column',
  },

  resultItem: {
    padding: spacing.md,
    background: 'none',
    border: 'none',
    borderBottom: `1px solid ${colors.gray100}`,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: typography.sizes.sm,
    color: colors.gray700,
    transition: `background-color 0.2s ease`,
  },

  resultInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },

  resultName: {
    fontWeight: typography.weights.medium,
    color: colors.gray900,
  },

  resultEmail: {
    color: colors.gray500,
    fontSize: typography.sizes.xs,
  },

  noResults: {
    padding: spacing.md,
    color: colors.gray400,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },

  clearAllButton: {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: 'transparent',
    color: colors.error,
    border: `1px solid ${colors.error}`,
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    cursor: 'pointer',
    fontWeight: typography.weights.medium,
    transition: `all 0.2s ease`,
  },

  deleteButton: {
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: colors.error,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    cursor: 'pointer',
    fontWeight: typography.weights.medium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    transition: `all 0.2s ease`,
  },
};

export default RightPanel;
