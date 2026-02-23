import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';

const Documents = () => {
  const [activeTab, setActiveTab] = useState('published');
  const [searchTerm, setSearchTerm] = useState('');

  const documents = {
    published: [
      { id: 1, name: 'Service Agreement', signers: 2, status: 'pending', created: '2024-02-15' },
      { id: 2, name: 'Proposal Document', signers: 1, status: 'signed', created: '2024-02-10' },
      { id: 3, name: 'Contract Template', signers: 3, status: 'pending', created: '2024-02-05' },
    ],
    assigned: [
      { id: 4, name: 'Employment Contract', signers: 1, status: 'pending', created: '2024-02-20', dueDate: '2024-02-27' },
      { id: 5, name: 'Lease Agreement', signers: 2, status: 'pending', created: '2024-02-18', dueDate: '2024-02-25' },
    ],
    draft: [
      { id: 6, name: 'NDA Document', signers: 0, status: 'draft', created: '2024-02-20' },
    ]
  };

  const getCurrentDocuments = () => {
    return documents[activeTab].filter(doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const documentsStyles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.lightGray,
      padding: `${spacing.xl} ${spacing['2xl']}`,
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing['3xl'],
    },
    title: {
      fontSize: typography.sizes['3xl'],
      fontWeight: typography.weights.bold,
      color: colors.gray900,
    },
    uploadButton: {
      backgroundColor: colors.secondary,
      color: colors.white,
      padding: `${spacing.sm} ${spacing.lg}`,
      border: 'none',
      borderRadius: borderRadius.md,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      cursor: 'pointer',
      transition: transitions.fast,
    },
    tabs: {
      display: 'flex',
      gap: spacing.lg,
      marginBottom: spacing.xl,
      borderBottom: `2px solid ${colors.gray200}`,
    },
    tab: {
      background: 'none',
      border: 'none',
      padding: `${spacing.md} 0`,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.gray600,
      cursor: 'pointer',
      transition: transitions.fast,
      borderBottom: `3px solid transparent`,
      marginBottom: '-2px',
    },
    tabActive: {
      color: colors.secondary,
      borderBottomColor: colors.secondary,
    },
    searchContainer: {
      marginBottom: spacing.xl,
    },
    searchInput: {
      width: '100%',
      maxWidth: '400px',
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: typography.sizes.sm,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      backgroundColor: colors.white,
      transition: transitions.fast,
    },
    tableWrapper: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      boxShadow: colors.shadowMd,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: typography.sizes.sm,
    },
    thead: {
      backgroundColor: colors.gray50,
      borderBottom: `2px solid ${colors.gray200}`,
    },
    th: {
      padding: spacing.md,
      textAlign: 'left',
      fontWeight: typography.weights.bold,
      color: colors.gray700,
    },
    tr: {
      borderBottom: `1px solid ${colors.gray200}`,
      transition: transitions.fast,
    },
    trHover: {
      backgroundColor: colors.gray50,
    },
    td: {
      padding: spacing.md,
      color: colors.gray700,
    },
    docName: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      fontWeight: typography.weights.medium,
      color: colors.primary,
    },
    statusBadge: {
      display: 'inline-block',
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.full,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.medium,
    },
    statusPending: {
      backgroundColor: colors.warningLight,
      color: '#B45309',
    },
    statusSigned: {
      backgroundColor: colors.successLight || '#ECFDF5',
      color: '#047857',
    },
    statusDraft: {
      backgroundColor: colors.gray100,
      color: colors.gray600,
    },
    actions: {
      display: 'flex',
      gap: spacing.sm,
    },
    actionButton: {
      padding: `${spacing.xs} ${spacing.sm}`,
      fontSize: typography.sizes.xs,
      border: `1px solid ${colors.primary}`,
      borderRadius: borderRadius.md,
      backgroundColor: 'transparent',
      color: colors.primary,
      cursor: 'pointer',
      transition: transitions.fast,
    },
    signButton: {
      backgroundColor: colors.accent,
      color: colors.white,
      border: `1px solid ${colors.accent}`,
    },
    emptyRow: {
      textAlign: 'center',
      padding: `${spacing['3xl']} ${spacing['2xl']}`,
      color: colors.gray600,
    },
  };

  return (
    <div style={documentsStyles.container}>
      <div style={documentsStyles.content}>
        {/* Header */}
        <div style={documentsStyles.header}>
          <h1 style={documentsStyles.title}>📄 Documents</h1>
          <button
            style={documentsStyles.uploadButton}
            onMouseOver={(e) => {
              e.target.style.opacity = '0.9';
            }}
            onMouseOut={(e) => {
              e.target.style.opacity = '1';
            }}
          >
            📤 Upload Document
          </button>
        </div>

        {/* Tabs */}
        <div style={documentsStyles.tabs}>
          <button
            style={{
              ...documentsStyles.tab,
              ...(activeTab === 'published' && documentsStyles.tabActive),
            }}
            onClick={() => setActiveTab('published')}
          >
            Published Documents ({documents.published.length})
          </button>
          <button
            style={{
              ...documentsStyles.tab,
              ...(activeTab === 'assigned' && documentsStyles.tabActive),
            }}
            onClick={() => setActiveTab('assigned')}
          >
            Assigned to Sign ({documents.assigned.length})
          </button>
          <button
            style={{
              ...documentsStyles.tab,
              ...(activeTab === 'draft' && documentsStyles.tabActive),
            }}
            onClick={() => setActiveTab('draft')}
          >
            Draft Documents ({documents.draft.length})
          </button>
        </div>

        {/* Search */}
        <div style={documentsStyles.searchContainer}>
          <input
            type="text"
            placeholder="🔍 Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={documentsStyles.searchInput}
            onFocus={(e) => {
              e.target.style.borderColor = colors.secondary;
              e.target.style.boxShadow = `0 0 0 3px ${colors.primaryVeryLight}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.gray300;
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Documents Table */}
        <div style={documentsStyles.tableWrapper}>
          <table style={documentsStyles.table}>
            <thead style={documentsStyles.thead}>
              <tr>
                <th style={documentsStyles.th}>Document Name</th>
                <th style={documentsStyles.th}>Signers</th>
                <th style={documentsStyles.th}>Status</th>
                <th style={documentsStyles.th}>Created</th>
                {activeTab === 'assigned' && <th style={documentsStyles.th}>Due Date</th>}
                <th style={documentsStyles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getCurrentDocuments().length > 0 ? (
                getCurrentDocuments().map(doc => (
                  <tr
                    key={doc.id}
                    style={documentsStyles.tr}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = colors.gray50;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={documentsStyles.td}>
                      <div style={documentsStyles.docName}>
                        <span>📄</span>
                        {doc.name}
                      </div>
                    </td>
                    <td style={documentsStyles.td}>{doc.signers}</td>
                    <td style={documentsStyles.td}>
                      <span
                        style={{
                          ...documentsStyles.statusBadge,
                          ...(doc.status === 'signed'
                            ? documentsStyles.statusSigned
                            : doc.status === 'pending'
                            ? documentsStyles.statusPending
                            : documentsStyles.statusDraft),
                        }}
                      >
                        {doc.status === 'signed'
                          ? '✓ Signed'
                          : doc.status === 'pending'
                          ? '⏳ Pending'
                          : 'Draft'}
                      </span>
                    </td>
                    <td style={documentsStyles.td}>
                      {new Date(doc.created).toLocaleDateString()}
                    </td>
                    {activeTab === 'assigned' && (
                      <td style={documentsStyles.td}>
                        {doc.dueDate &&
                          new Date(doc.dueDate).toLocaleDateString()}
                      </td>
                    )}
                    <td style={documentsStyles.td}>
                      <div style={documentsStyles.actions}>
                        {activeTab === 'assigned' ? (
                          <a
                            href={`/document-sign/${doc.id}`}
                            style={{
                              ...documentsStyles.actionButton,
                              ...documentsStyles.signButton,
                            }}
                            onMouseOver={(e) => {
                              e.target.style.opacity = '0.9';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.opacity = '1';
                            }}
                          >
                            Sign
                          </a>
                        ) : (
                          <>
                            <a
                              href={`/documents/${doc.id}`}
                              style={documentsStyles.actionButton}
                              onMouseOver={(e) => {
                                e.target.style.backgroundColor =
                                  colors.primaryVeryLight;
                              }}
                              onMouseOut={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                              }}
                            >
                              View
                            </a>
                            <a
                              href={`/documents/${doc.id}/share`}
                              style={documentsStyles.actionButton}
                              onMouseOver={(e) => {
                                e.target.style.backgroundColor =
                                  colors.primaryVeryLight;
                              }}
                              onMouseOut={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                              }}
                            >
                              Share
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      ...documentsStyles.td,
                      ...documentsStyles.emptyRow,
                    }}
                  >
                    <p>📭 No {activeTab} documents found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Documents;

export default Documents;
