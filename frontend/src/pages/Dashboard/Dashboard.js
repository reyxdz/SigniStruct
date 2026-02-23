import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';

const Dashboard = () => {
  const [formsData] = useState({
    published: 5,
    draft: 2,
    totalResponses: 24,
  });

  const [documentsData] = useState({
    published: 8,
    assignedToSign: 3,
    draft: 1,
  });

  const [recentActivity] = useState([
    {
      id: 1,
      type: 'form',
      title: 'Customer Feedback Form',
      action: 'created',
      timestamp: '2 hours ago',
      icon: '📋',
    },
    {
      id: 2,
      type: 'document',
      title: 'Employment Contract',
      action: 'signed',
      timestamp: '4 hours ago',
      icon: '📄',
    },
    {
      id: 3,
      type: 'form',
      title: 'Event Registration',
      action: 'received 5 responses',
      timestamp: '1 day ago',
      icon: '📋',
    },
    {
      id: 4,
      type: 'document',
      title: 'NDA Agreement',
      action: 'pending signature',
      timestamp: '2 days ago',
      icon: '📄',
    },
  ]);

  const dashboardStyles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.lightGray,
      padding: `${spacing.xl} ${spacing['2xl']}`,
    },
    content: {
      maxWidth: '1400px',
      margin: '0 auto',
    },
    header: {
      marginBottom: spacing['3xl'],
    },
    greeting: {
      fontSize: typography.sizes['3xl'],
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: typography.sizes.base,
      color: colors.gray600,
      marginBottom: spacing.lg,
    },
    actionButtons: {
      display: 'flex',
      gap: spacing.md,
      flexWrap: 'wrap',
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
    sectionTitle: {
      fontSize: typography.sizes['2xl'],
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      marginBottom: spacing.lg,
      marginTop: spacing['2xl'],
    },
    cardsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: spacing.lg,
      marginBottom: spacing['3xl'],
    },
    statCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      boxShadow: colors.shadowMd,
      transition: transitions.fast,
    },
    statValue: {
      fontSize: typography.sizes['4xl'],
      fontWeight: typography.weights.bold,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: typography.sizes.sm,
      color: colors.gray600,
      marginBottom: spacing.md,
    },
    viewLink: {
      fontSize: typography.sizes.sm,
      color: colors.primary,
      textDecoration: 'none',
      fontWeight: typography.weights.medium,
      cursor: 'pointer',
      transition: transitions.fast,
      backgroundColor: 'transparent',
      border: 'none',
      padding: 0,
    },
    activityContainer: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      boxShadow: colors.shadowMd,
    },
    activityTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      marginBottom: spacing.lg,
      borderBottom: `2px solid ${colors.gray200}`,
      paddingBottom: spacing.md,
    },
    activityList: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
    },
    activityItem: {
      display: 'flex',
      alignItems: 'flex-start',
      padding: spacing.md,
      borderRadius: borderRadius.base,
      backgroundColor: colors.gray50,
      transition: transitions.fast,
    },
    activityIcon: {
      fontSize: '1.5rem',
      marginRight: spacing.md,
      flexShrink: 0,
    },
    activityContent: {
      flex: 1,
    },
    activityItemTitle: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.gray900,
      marginBottom: spacing.xs,
    },
    activityItemAction: {
      fontSize: typography.sizes.sm,
      color: colors.gray600,
    },
    activityTimestamp: {
      fontSize: typography.sizes.xs,
      color: colors.gray500,
      marginTop: spacing.xs,
    },
    sectionSubtitle: {
      fontSize: typography.sizes.sm,
      color: colors.gray600,
      marginTop: spacing.xs,
    },
    colorIndicator: {
      width: '4px',
      height: '100%',
      borderRadius: `${borderRadius.base} 0 0 ${borderRadius.base}`,
      marginRight: spacing.md,
      flexShrink: 0,
    },
  };

  const formCardColor = colors.primary;
  const docCardColor = colors.secondary;

  return (
    <div style={dashboardStyles.container}>
      <div style={dashboardStyles.content}>
        {/* Header Section */}
        <div style={dashboardStyles.header}>
          <h1 style={dashboardStyles.greeting}>Welcome back, John Doe! 👋</h1>
          <p style={dashboardStyles.subtitle}>
            Manage your forms and documents in one place
          </p>
          <div style={dashboardStyles.actionButtons}>
            <button
              style={{
                ...dashboardStyles.button,
                ...dashboardStyles.primaryButton,
              }}
              onMouseOver={(e) => {
                e.target.style.opacity = '0.9';
              }}
              onMouseOut={(e) => {
                e.target.style.opacity = '1';
              }}
            >
              + Create Form
            </button>
            <button
              style={{
                ...dashboardStyles.button,
                ...dashboardStyles.secondaryButton,
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = colors.gray50;
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = colors.white;
              }}
            >
              📤 Upload Document
            </button>
          </div>
        </div>

        {/* Forms Section */}
        <h2 style={dashboardStyles.sectionTitle}>📋 Forms Statistics</h2>
        <div style={dashboardStyles.cardsGrid}>
          <div
            style={dashboardStyles.statCard}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowLg;
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowMd;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={dashboardStyles.statValue}>
              {formsData.published}
            </div>
            <div style={dashboardStyles.statLabel}>Published Forms</div>
            <button style={dashboardStyles.viewLink} onClick={(e) => e.preventDefault()}>View all →</button>
            <p style={dashboardStyles.sectionSubtitle}>
              Active and collecting responses
            </p>
          </div>

          <div
            style={dashboardStyles.statCard}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowLg;
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowMd;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={dashboardStyles.statValue}>
              {formsData.draft}
            </div>
            <div style={dashboardStyles.statLabel}>Draft Forms</div>
            <button style={dashboardStyles.viewLink} onClick={(e) => e.preventDefault()}>View all →</button>
            <p style={dashboardStyles.sectionSubtitle}>
              Still in progress
            </p>
          </div>

          <div
            style={dashboardStyles.statCard}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowLg;
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowMd;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={dashboardStyles.statValue}>
              {formsData.totalResponses}
            </div>
            <div style={dashboardStyles.statLabel}>Total Responses</div>
            <button style={dashboardStyles.viewLink} onClick={(e) => e.preventDefault()}>View responses →</button>
            <p style={dashboardStyles.sectionSubtitle}>
              Collected from all forms
            </p>
          </div>
        </div>

        {/* Documents Section */}
        <h2 style={dashboardStyles.sectionTitle}>📄 Documents Statistics</h2>
        <div style={dashboardStyles.cardsGrid}>
          <div
            style={dashboardStyles.statCard}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowLg;
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowMd;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={dashboardStyles.statValue}>
              {documentsData.published}
            </div>
            <div style={dashboardStyles.statLabel}>Published Documents</div>
            <button style={dashboardStyles.viewLink} onClick={(e) => e.preventDefault()}>View all →</button>
            <p style={dashboardStyles.sectionSubtitle}>
              Ready for signing
            </p>
          </div>

          <div
            style={dashboardStyles.statCard}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowLg;
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowMd;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ ...dashboardStyles.statValue, color: colors.accent }}>
              {documentsData.assignedToSign}
            </div>
            <div style={dashboardStyles.statLabel}>Assigned to Sign</div>
            <button style={dashboardStyles.viewLink} onClick={(e) => e.preventDefault()}>Sign now →</button>
            <p style={dashboardStyles.sectionSubtitle}>
              Waiting for your signature
            </p>
          </div>

          <div
            style={dashboardStyles.statCard}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowLg;
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowMd;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={dashboardStyles.statValue}>
              {documentsData.draft}
            </div>
            <div style={dashboardStyles.statLabel}>Draft Documents</div>
            <button style={dashboardStyles.viewLink} onClick={(e) => e.preventDefault()}>View all →</button>
            <p style={dashboardStyles.sectionSubtitle}>
              Not yet published
            </p>
          </div>
        </div>

        {/* Activity Section */}
        <h2 style={dashboardStyles.sectionTitle}>🕐 Recent Activity</h2>
        <div style={dashboardStyles.activityContainer}>
          <div style={dashboardStyles.activityTitle}>
            Latest Updates
          </div>
          <div style={dashboardStyles.activityList}>
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                style={{
                  ...dashboardStyles.activityItem,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.gray100;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = colors.gray50;
                }}
              >
                <div
                  style={{
                    ...dashboardStyles.colorIndicator,
                    backgroundColor:
                      activity.type === 'form' ? formCardColor : docCardColor,
                  }}
                />
                <div style={dashboardStyles.activityIcon}>
                  {activity.icon}
                </div>
                <div style={dashboardStyles.activityContent}>
                  <div style={dashboardStyles.activityItemTitle}>
                    {activity.title}
                  </div>
                  <div style={dashboardStyles.activityItemAction}>
                    {activity.action}
                  </div>
                  <div style={dashboardStyles.activityTimestamp}>
                    {activity.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
