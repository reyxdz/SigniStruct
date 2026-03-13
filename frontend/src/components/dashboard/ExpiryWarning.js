import React from 'react';
import { FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';
import { colors, spacing, typography, borderRadius } from '../../theme';

/**
 * ExpiryWarning Component
 * Displays certificate expiry status with visual warning
 */
const ExpiryWarning = ({ daysRemaining, expiryDate, status = 'active' }) => {
  if (status === 'revoked') {
    return (
      <div style={styles.container('revoked')}>
        <FiAlertCircle style={styles.icon('revoked')} />
        <div style={styles.content}>
          <div style={styles.title('revoked')}>Certificate Revoked</div>
          <div style={styles.description}>This certificate has been revoked and cannot be used for signing.</div>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div style={styles.container('expired')}>
        <FiAlertCircle style={styles.icon('expired')} />
        <div style={styles.content}>
          <div style={styles.title('expired')}>Certificate Expired</div>
          <div style={styles.description}>Your certificate expired on {new Date(expiryDate).toLocaleDateString()}. Please renew it.</div>
        </div>
      </div>
    );
  }

  if (daysRemaining <= 7 && daysRemaining > 0) {
    return (
      <div style={styles.container('critical')}>
        <FiAlertTriangle style={styles.icon('critical')} />
        <div style={styles.content}>
          <div style={styles.title('critical')}>Certificate Expires Soon</div>
          <div style={styles.description}>Your certificate will expire in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. Please renew it.</div>
        </div>
      </div>
    );
  }

  if (daysRemaining <= 30 && daysRemaining > 7) {
    return (
      <div style={styles.container('warning')}>
        <FiAlertTriangle style={styles.icon('warning')} />
        <div style={styles.content}>
          <div style={styles.title('warning')}>Certificate Expiring Soon</div>
          <div style={styles.description}>Your certificate will expire in {daysRemaining} days. Plan to renew it accordingly.</div>
        </div>
      </div>
    );
  }

  return null;
};

const styles = {
  container: (type) => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    ...(type === 'critical' && {
      backgroundColor: '#fee2e2',
      borderLeft: `4px solid ${colors.error}`,
      borderColor: colors.error
    }),
    ...(type === 'warning' && {
      backgroundColor: '#fef3c7',
      borderLeft: `4px solid ${colors.warning}`,
      borderColor: colors.warning
    }),
    ...(type === 'expired' && {
      backgroundColor: '#fecaca',
      borderLeft: `4px solid ${colors.error}`,
      borderColor: colors.error
    }),
    ...(type === 'revoked' && {
      backgroundColor: '#e5e7eb',
      borderLeft: `4px solid ${colors.gray600}`,
      borderColor: colors.gray600
    })
  }),
  icon: (type) => ({
    fontSize: '24px',
    flexShrink: 0,
    ...(type === 'critical' && { color: colors.error }),
    ...(type === 'warning' && { color: colors.warning }),
    ...(type === 'expired' && { color: colors.error }),
    ...(type === 'revoked' && { color: colors.gray600 })
  }),
  content: {
    flex: 1
  },
  title: (type) => ({
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
    ...(type === 'critical' && { color: colors.error }),
    ...(type === 'warning' && { color: colors.warning }),
    ...(type === 'expired' && { color: colors.error }),
    ...(type === 'revoked' && { color: colors.gray700 })
  }),
  description: {
    fontSize: typography.sizes.sm,
    color: colors.gray700,
    lineHeight: 1.5
  }
};

export default ExpiryWarning;
