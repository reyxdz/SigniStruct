import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { colors, spacing, typography, borderRadius } from '../../theme';
import {
  FiPenTool,
  FiType,
  FiMail,
  FiUser,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiCheck
} from 'react-icons/fi';
import { FaSignature } from 'react-icons/fa';
import './LeftPanel.css';

/**
 * LeftPanel Component
 * Displays draggable field tools organized into sections
 * - My Information: User signature, initial, email, name
 * - Recipient Fields: Fields to assign to signers
 */
const LeftPanel = () => {
  const { user } = useAuth();
  const [mySignature, setMySignature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState('my-info');

  // Fetch user's signature on mount
  useEffect(() => {
    if (user?._id) {
      fetchUserSignature();
    }
  }, [user?._id]);

  /**
   * Fetch user's default signature
   */
  const fetchUserSignature = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/signatures/my-signatures`);
      
      if (response.data.success && response.data.signatures?.length > 0) {
        // Get the default signature
        const defaultSig = response.data.signatures.find(s => s.is_default) ||
                          response.data.signatures[0];
        setMySignature(defaultSig);
      }
    } catch (error) {
      console.error('Failed to fetch user signature:', error);
      // Continue without signature - not critical
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle drag start for tool
   */
  const handleToolDragStart = (e, toolData) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(toolData));
  };

  // Tool configurations
  const MY_INFO_TOOLS = [
    {
      id: 'my-signature',
      label: 'My Signature',
      toolId: 1,
      icon: FaSignature,
      type: 'signature',
      value: mySignature?.signature_image || null,
      hasData: !!mySignature
    },
    {
      id: 'my-initial',
      label: 'My Initial',
      toolId: 2,
      icon: FiType,
      type: 'initial',
      value: user?.firstName?.charAt(0) || '',
      hasData: true
    },
    {
      id: 'my-email',
      label: 'My Email',
      toolId: 3,
      icon: FiMail,
      type: 'email',
      value: user?.email || '',
      hasData: !!user?.email
    },
    {
      id: 'my-name',
      label: 'My Full Name',
      toolId: 4,
      icon: FiUser,
      type: 'name',
      value: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      hasData: !!user?.firstName
    }
  ];

  const RECIPIENT_TOOLS = [
    {
      id: 'recipient-signature',
      label: 'Recipient Signature',
      toolId: 5,
      icon: FaSignature,
      type: 'signature',
      isRecipient: true
    },
    {
      id: 'recipient-initial',
      label: 'Recipient Initial',
      toolId: 6,
      icon: FiType,
      type: 'initial',
      isRecipient: true
    },
    {
      id: 'recipient-email',
      label: 'Recipient Email',
      toolId: 7,
      icon: FiMail,
      type: 'email',
      isRecipient: true
    },
    {
      id: 'recipient-name',
      label: 'Recipient Full Name',
      toolId: 8,
      icon: FiUser,
      type: 'name',
      isRecipient: true
    }
  ];

  /**
   * Render a draggable tool
   */
  const ToolButton = ({ tool }) => {
    const Icon = tool.icon;
    const isDisabled = !tool.hasData && !tool.isRecipient;

    return (
      <div
        style={{
          ...styles.tool,
          ...(isDisabled ? styles.toolDisabled : styles.toolEnabled),
          opacity: loading ? 0.6 : 1
        }}
        className={!isDisabled ? 'tool-draggable' : ''}
        draggable={!isDisabled}
        onDragStart={(e) => !isDisabled && handleToolDragStart(e, tool)}
        title={isDisabled ? 'Please set up user data first' : 'Drag to add field'}
      >
        <div style={{
          ...styles.toolIcon,
          backgroundColor: isDisabled ? '#fecaca' : '#dbeafe'
        }}>
          <Icon size={20} color={isDisabled ? '#991b1b' : '#0284c7'} />
        </div>

        <div style={styles.toolContent}>
          <div style={styles.toolLabelContainer}>
            <p style={styles.toolLabel}>{tool.label}</p>
            {tool.isRecipient && !isDisabled && (
              <span style={styles.recipientTag}>Recipient</span>
            )}
          </div>
          {tool.isRecipient ? (
            <p style={styles.toolPlaceholder}>Drag to add</p>
          ) : (
            <div style={styles.valueDisplay}>
              {isDisabled ? (
                <span style={styles.missingDataText}>Data not set</span>
              ) : (
                <>
                  <span style={styles.dataIndicator}>✓</span>
                  <p style={styles.toolValue}>
                    {tool.type === 'signature' && mySignature ? '[Signature]' : 
                     tool.type === 'initial' ? tool.value :
                     tool.value || '[Not set]'}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {isDisabled && !tool.isRecipient && (
          <div style={styles.missingBadge}>
            <FiAlertCircle size={16} />
          </div>
        )}

        {!isDisabled && !tool.isRecipient && (
          <div style={styles.readyBadge}>
            <FiCheck size={14} />
          </div>
        )}
      </div>
    );
  };

  /**
   * Render a collapsible section
   */
  const Section = ({ id, title, tools, icon: SectionIcon }) => {
    const isExpanded = expandedSection === id;

    return (
      <div style={styles.section}>
        <button
          style={styles.sectionHeader}
          onClick={() => setExpandedSection(isExpanded ? null : id)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <SectionIcon size={18} style={{ color: colors.primary }} />
            <span style={styles.sectionTitle}>{title}</span>
          </div>
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </button>

        {isExpanded && (
          <div style={styles.sectionContent}>
            {tools.map((tool) => (
              <ToolButton key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Tools</h2>
      </div>

      <div style={styles.content}>
        <Section
          id="my-info"
          title="My Information"
          tools={MY_INFO_TOOLS}
          icon={FiUser}
        />

        <Section
          id="recipient-fields"
          title="Recipient Fields"
          tools={RECIPIENT_TOOLS}
          icon={FiPenTool}
        />

        {loading && <p style={styles.loadingText}>Loading signature...</p>}
      </div>

      <div style={styles.footer}>
        <p style={styles.hint}>💡 Drag tools to PDF to add fields</p>
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
    backgroundColor: colors.white,
    borderRight: `1px solid ${colors.gray200}`,
  },

  header: {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.gray200}`,
    backgroundColor: colors.white,
  },

  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.gray900,
    margin: 0,
  },

  content: {
    flex: 1,
    overflow: 'auto',
    padding: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },

  // Section Styles
  section: {
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.gray200}`,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: spacing.md,
    border: 'none',
    backgroundColor: colors.gray50,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },

  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray900,
    margin: 0,
  },

  sectionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
  },

  // Tool Styles
  tool: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.gray200}`,
    backgroundColor: colors.white,
    cursor: 'grab',
    transition: 'all 0.2s ease',
  },

  toolEnabled: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
  },

  toolDisabled: {
    cursor: 'not-allowed',
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },

  toolActive: {
    backgroundColor: colors.primary,
    color: colors.white,
    borderColor: colors.primary,
  },

  toolIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
    color: colors.primary,
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },

  toolContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },

  toolLabelContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },

  toolLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.gray900,
    margin: 0,
  },

  recipientTag: {
    fontSize: '9px',
    fontWeight: typography.weights.semibold,
    color: '#b45309',
    backgroundColor: '#fef3c7',
    padding: '2px 6px',
    borderRadius: borderRadius.sm,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  valueDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  },

  dataIndicator: {
    fontSize: '11px',
    color: '#16a34a',
    fontWeight: 'bold',
  },

  missingDataText: {
    fontSize: typography.sizes.xs,
    color: '#dc2626',
    fontWeight: typography.weights.medium,
  },

  toolValue: {
    fontSize: typography.sizes.xs,
    color: colors.gray600,
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  toolPlaceholder: {
    fontSize: typography.sizes.xs,
    color: colors.gray400,
    fontStyle: 'italic',
    margin: 0,
  },

  missingBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: borderRadius.sm,
    padding: '4px 4px',
    flexShrink: 0,
    color: '#dc2626',
  },

  readyBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: borderRadius.sm,
    padding: '4px 4px',
    flexShrink: 0,
    color: '#16a34a',
  },

  toolBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: borderRadius.sm,
    padding: `2px ${spacing.xs}`,
    flexShrink: 0,
  },

  badgeText: {
    fontSize: '10px',
    fontWeight: typography.weights.semibold,
    color: '#92400e',
  },

  // Footer
  footer: {
    padding: spacing.md,
    borderTop: `1px solid ${colors.gray200}`,
    backgroundColor: colors.gray50,
  },

  hint: {
    fontSize: typography.sizes.xs,
    color: colors.gray600,
    margin: 0,
    textAlign: 'center',
  },

  loadingText: {
    fontSize: typography.sizes.xs,
    color: colors.gray400,
    textAlign: 'center',
    margin: 0,
  },
};

export default LeftPanel;
