import React, { useState } from 'react';
import { FiX, FiRotateCcw, FiShield, FiCalendar, FiInfo } from 'react-icons/fi';
import { colors, typography, transitions } from '../../theme';

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
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && !isLoading && onCancel()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>
              <FiRotateCcw size={18} />
            </div>
            <div>
              <h2 style={styles.title}>Renew Certificate</h2>
              <p style={styles.subtitle}>Generate a new certificate with extended validity</p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onCancel} disabled={isLoading}>
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Current Certificate Info */}
          <div style={styles.currentCert}>
            <div style={styles.currentCertRow}>
              <FiShield size={14} style={{ color: colors.gray500 }} />
              <span style={styles.currentCertLabel}>Current Certificate</span>
              <span style={styles.currentCertValue}>{certificate.certificate_id}</span>
            </div>
            <div style={styles.currentCertRow}>
              <FiCalendar size={14} style={{ color: colors.gray500 }} />
              <span style={styles.currentCertLabel}>Expires</span>
              <span style={styles.currentCertValue}>{new Date(certificate.not_after).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Form */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Validity Period</label>
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
              The new certificate will be valid for {validityYears} year{validityYears !== 1 ? 's' : ''} from the date of renewal.
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
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div style={styles.infoBox}>
            <FiInfo size={16} style={{ color: colors.primary, flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p style={styles.infoTitle}>What happens during renewal</p>
              <ul style={styles.infoList}>
                <li>A new RSA key pair will be generated</li>
                <li>The old certificate will be marked as superseded</li>
                <li>Your new certificate will be immediately active</li>
                <li>All audit trail and history will be preserved</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
          <button style={styles.renewBtn} onClick={handleRenew} disabled={isLoading}>
            <FiRotateCcw size={14} />
            <span>{isLoading ? 'Renewing...' : 'Renew Certificate'}</span>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(2px)',
  },

  modal: {
    backgroundColor: colors.white,
    borderRadius: '14px',
    width: '90%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: `1px solid ${colors.gray200}`,
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },

  headerIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: colors.primaryVeryLight,
    color: colors.primary,
    flexShrink: 0,
  },

  title: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    color: colors.gray900,
    lineHeight: 1.2,
  },

  subtitle: {
    margin: '3px 0 0 0',
    fontSize: '13px',
    color: colors.gray500,
  },

  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: colors.gray400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: transitions.fast,
  },

  content: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },

  currentCert: {
    padding: '12px 16px',
    borderRadius: '10px',
    backgroundColor: '#F8FAFC',
    border: `1px solid ${colors.gray200}`,
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  currentCertRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  },

  currentCertLabel: {
    color: colors.gray500,
    fontWeight: 500,
    minWidth: '100px',
  },

  currentCertValue: {
    color: colors.gray800,
    fontWeight: 600,
    fontFamily: typography.monoFamily,
    fontSize: '12px',
  },

  formGroup: {
    marginBottom: '20px',
  },

  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: colors.gray800,
    marginBottom: '6px',
  },

  select: {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid ${colors.gray300}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    backgroundColor: colors.white,
    color: colors.gray800,
    outline: 'none',
    transition: transitions.fast,
  },

  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid ${colors.gray300}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical',
    color: colors.gray800,
    outline: 'none',
    transition: transitions.fast,
  },

  hint: {
    fontSize: '12px',
    color: colors.gray500,
    marginTop: '6px',
    marginBottom: 0,
    lineHeight: 1.4,
  },

  infoBox: {
    display: 'flex',
    gap: '10px',
    backgroundColor: colors.primaryVeryLight,
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #BFDBFE',
  },

  infoTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: colors.gray800,
    margin: '0 0 6px 0',
  },

  infoList: {
    margin: 0,
    paddingLeft: '18px',
    fontSize: '13px',
    color: colors.gray600,
    lineHeight: 1.7,
  },

  footer: {
    display: 'flex',
    gap: '10px',
    padding: '16px 24px',
    borderTop: `1px solid ${colors.gray200}`,
    backgroundColor: '#FAFBFC',
  },

  cancelBtn: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '8px',
    border: `1px solid ${colors.gray300}`,
    backgroundColor: colors.white,
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    color: colors.gray700,
    transition: transitions.fast,
  },

  renewBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: transitions.fast,
  },
};

export default RenewModal;
