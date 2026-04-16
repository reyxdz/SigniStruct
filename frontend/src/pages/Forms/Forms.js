import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiFileText } from 'react-icons/fi';

const Forms = () => {
  const [activeTab, setActiveTab] = useState('published');
  const [searchTerm, setSearchTerm] = useState('');

  const forms = {
    published: [
      { id: 1, name: 'Contact Form', responses: 8, created: '2024-02-15', status: 'active' },
      { id: 2, name: 'Feedback Survey', responses: 12, created: '2024-02-10', status: 'active' },
      { id: 3, name: 'Registration Form', responses: 5, created: '2024-02-05', status: 'active' },
    ],
    draft: [
      { id: 4, name: 'New Inquiry Form', responses: 0, created: '2024-02-20', status: 'draft' },
      { id: 5, name: 'Application Form', responses: 0, created: '2024-02-18', status: 'draft' },
    ]
  };

  const getCurrentForms = () => {
    return forms[activeTab].filter(form =>
      form.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const formsStyles = {
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
    createButton: {
      backgroundColor: colors.primary,
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
      color: colors.primary,
      borderBottomColor: colors.primary,
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
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: spacing.lg,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      boxShadow: colors.shadowMd,
      transition: transitions.fast,
      cursor: 'pointer',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.lg,
    },
    cardTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      margin: 0,
    },
    menuButton: {
      background: 'none',
      border: 'none',
      fontSize: typography.sizes.lg,
      cursor: 'pointer',
      color: colors.gray500,
      transition: transitions.fast,
    },
    cardContent: {
      display: 'flex',
      gap: spacing.lg,
      marginBottom: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottom: `1px solid ${colors.gray200}`,
    },
    stat: {
      flex: 1,
    },
    statLabel: {
      fontSize: typography.sizes.xs,
      color: colors.gray600,
      marginBottom: spacing.xs,
      display: 'block',
    },
    statValue: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.primary,
    },
    cardFooter: {
      display: 'flex',
      gap: spacing.md,
    },
    action: {
      flex: 1,
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      textAlign: 'center',
      borderRadius: borderRadius.md,
      textDecoration: 'none',
      transition: transitions.fast,
      border: 'none',
      cursor: 'pointer',
    },
    actionPrimary: {
      backgroundColor: colors.primaryVeryLight,
      color: colors.primary,
    },
    actionSecondary: {
      backgroundColor: colors.gray100,
      color: colors.gray700,
    },
    emptyState: {
      textAlign: 'center',
      padding: `${spacing['3xl']} ${spacing['2xl']}`,
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      boxShadow: colors.shadowMd,
    },
    emptyText: {
      fontSize: typography.sizes.lg,
      color: colors.gray600,
      marginBottom: spacing.lg,
    },
  };

  return (
    <div style={formsStyles.container}>
      <div style={formsStyles.content}>
        {/* Header */}
        <div style={formsStyles.header}>
          <h1 style={formsStyles.title}><FiFileText style={{ display: 'inline', marginRight: '12px' }} /> Forms</h1>
          <button
            style={formsStyles.createButton}
            onMouseOver={(e) => {
              e.target.style.opacity = '0.9';
            }}
            onMouseOut={(e) => {
              e.target.style.opacity = '1';
            }}
          >
            + Create New Form
          </button>
        </div>

        {/* Tabs */}
        <div style={formsStyles.tabs}>
          <button
            style={{
              ...formsStyles.tab,
              ...(activeTab === 'published' && formsStyles.tabActive),
            }}
            onClick={() => setActiveTab('published')}
          >
            Published Forms ({forms.published.length})
          </button>
          <button
            style={{
              ...formsStyles.tab,
              ...(activeTab === 'draft' && formsStyles.tabActive),
            }}
            onClick={() => setActiveTab('draft')}
          >
            Draft Forms ({forms.draft.length})
          </button>
        </div>

        {/* Search */}
        <div style={formsStyles.searchContainer}>
          <input
            type="text"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={formsStyles.searchInput}
            onFocus={(e) => {
              e.target.style.borderColor = colors.primary;
              e.target.style.boxShadow = `0 0 0 3px ${colors.primaryVeryLight}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.gray300;
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Forms Grid */}
        <div style={formsStyles.grid}>
          {getCurrentForms().length > 0 ? (
            getCurrentForms().map(form => (
              <div
                key={form.id}
                style={formsStyles.card}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = colors.shadowLg;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = colors.shadowMd;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={formsStyles.cardHeader}>
                  <h3 style={formsStyles.cardTitle}>{form.name}</h3>
                  <button
                    style={formsStyles.menuButton}
                    onMouseOver={(e) => {
                      e.target.style.color = colors.gray700;
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = colors.gray500;
                    }}
                  >
                    ⋯
                  </button>
                </div>

                <div style={formsStyles.cardContent}>
                  <div style={formsStyles.stat}>
                    <span style={formsStyles.statLabel}>Responses</span>
                    <span style={formsStyles.statValue}>{form.responses}</span>
                  </div>
                  <div style={formsStyles.stat}>
                    <span style={formsStyles.statLabel}>Created</span>
                    <span style={formsStyles.statValue}>
                      {new Date(form.created).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={formsStyles.cardFooter}>
                  <a
                    href={`/forms/${form.id}`}
                    style={{
                      ...formsStyles.action,
                      ...formsStyles.actionPrimary,
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = colors.primary;
                      e.target.style.color = colors.white;
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = colors.primaryVeryLight;
                      e.target.style.color = colors.primary;
                    }}
                  >
                    View Details
                  </a>
                  <a
                    href={`/form-builder/${form.id}`}
                    style={{
                      ...formsStyles.action,
                      ...formsStyles.actionSecondary,
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = colors.gray200;
                      e.target.style.color = colors.gray900;
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = colors.gray100;
                      e.target.style.color = colors.gray700;
                    }}
                  >
                    {activeTab === 'draft' ? 'Edit' : 'Duplicate'}
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div style={{ ...formsStyles.emptyState, gridColumn: '1/-1' }}>
              <p style={formsStyles.emptyText}>
                No {activeTab} forms found
              </p>
              {activeTab === 'published' && (
                <button style={formsStyles.createButton}>
                  Create your first form
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Forms;
