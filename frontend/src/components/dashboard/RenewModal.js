import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { colors, spacing, typography, borderRadius } from '../../theme';

/**
 * RenewModal Component
 * Modal dialog for renewing certificates
 */
const RenewModal = ({ certificate, onRenew, onCancel, isLoading = false }) => {
  const [validityYears, setValidityYears] = useState(5);
  const [reason, setReason] = useState('');

  const handleRenew = () => {
    onRenew({
      certificateId: certificate.certificate_id,
      validityYears,
      reason
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Renew Certificate</h2>
          <button
            style={styles.closeBtn}
            onClick={onCancel}
            disabled={isLoading}
          >
            <FiX size={24} />
          </button>
        </div>

        <div style={styles.content}>
          <p style={styles.description}>
            Renewing your certificate will generate a new certificate with extended validity. 
            Your signing history will be maintained.
          </p>

          <div style={styles.detailBox}>
            <div style={styles.detailRow}>
              <span>Current Certificate ID:</span>
              <span>{certificate.certificate_id}</span>
            </div>
            <div style={styles.detailRow}>
              <span>Expires:</span>
              <span>{new Date(certificate.not_after).toLocaleDateString()}</span>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Validity Period (Years)</label>
            <select
              style={styles.select}
              value={validityYears}
              onChange={(e) => setValidityYears(Number(e.target.value))}
              disabled={isLoading}
            >
              <option value={1}>1 Year</option>
              <option value={2}>2 Years</option>
              <option value={3}>3 Years</option>
              <option value={5}>5 Years (Recommended)</option>
              <option value={10}>10 Years</option>
            </select>
            <p style={styles.hint}>
              The new certificate will be valid for {validityYears} year{validityYears !== 1 ? 's' : ''} 
              from the date of renewal.
            </p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Renewal Reason (Optional)</label>
            <textarea
              style={styles.textarea}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Scheduled renewal, Certificate expiring, etc."
              disabled={isLoading}
              rows={4}
            />
          </div>

          <div style={styles.infoBox}>
            <strong>What happens during renewal:</strong>
            <ul style={styles.list}>
              <li>A new RSA key pair will be generated</li>
              <li>The old certificate will be marked as superseded</li>
              <li>Your new certificate will be immediately active</li>
              <li>All audit trail and history will be preserved</li>
            </ul>
          </div>
        </div>

        <div style={styles.footer}>
          <button
            style={{ ...styles.btn, ...styles.cancelBtn }}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.btn, ...styles.renewBtn }}
            onClick={handleRenew}
            disabled={isLoading}
          >
            {isLoading ? 'Renewing...' : 'Renew Certificate'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.border}`
  },
  title: {
    margin: 0,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.gray900
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: spacing.xs,
    color: colors.gray600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      color: colors.gray900
    }
  },
  content: {
    padding: spacing.lg
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.gray700,
    marginBottom: spacing.lg,
    lineHeight: 1.6
  },
  detailBox: {
    backgroundColor: colors.lightGray,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
    color: colors.gray700
  },
  formGroup: {
    marginBottom: spacing.lg
  },
  label: {
    display: 'block',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray900,
    marginBottom: spacing.xs
  },
  select: {
    width: '100%',
    padding: spacing.md,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: spacing.md,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  hint: {
    fontSize: typography.sizes.xs,
    color: colors.gray600,
    marginTop: spacing.xs
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    fontSize: typography.sizes.sm,
    color: colors.gray800
  },
  list: {
    marginTop: spacing.sm,
    marginBottom: 0,
    paddingLeft: spacing.lg,
    color: colors.gray700
  },
  footer: {
    display: 'flex',
    gap: spacing.md,
    padding: spacing.lg,
    borderTop: `1px solid ${colors.border}`
  },
  btn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    border: 'none',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  cancelBtn: {
    backgroundColor: colors.lightGray,
    color: colors.gray900,
    border: `1px solid ${colors.border}`
  },
  renewBtn: {
    backgroundColor: colors.primary,
    color: colors.white,
    ':hover': {
      opacity: 0.9
    }
  }
};

export default RenewModal;
