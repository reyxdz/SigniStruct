import React, { useState, useEffect } from 'react';
import { FiX, FiShield, FiClock } from 'react-icons/fi';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import CertificateService from '../../services/certificateService';

/**
 * CertificateDetailsModal Component
 * Modal dialog displaying certificate details and audit history
 */
const CertificateDetailsModal = ({ certificate, onClose }) => {
  const [auditHistory, setAuditHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (certificate && activeTab === 'history') {
      const loadAuditHistory = async () => {
        try {
          setIsLoading(true);
          const data = await CertificateService.getCertificateAuditHistory(
            certificate.certificate_id
          );
          setAuditHistory(data.history || []);
        } catch (error) {
          console.error('Failed to load audit history:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadAuditHistory();
    }
  }, [activeTab, certificate]);

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>
              <FiShield size={18} />
            </div>
            <h2 style={styles.title}>Certificate Details</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'details' && styles.activeTab)
            }}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'history' && styles.activeTab)
            }}
            onClick={() => setActiveTab('history')}
          >
            Audit History
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeTab === 'details' && (
            <div style={styles.detailsGrid}>
              <DetailRow label="Certificate ID" value={certificate.certificate_id} mono />
              <DetailRow label="Subject" value={certificate.subject || 'N/A'} />
              <DetailRow label="Issuer" value={certificate.issuer || 'SigniStruct'} />
              <DetailRow label="Serial Number" value={certificate.serial_number || 'N/A'} mono />
              <DetailRow
                label="Status"
                value={certificate.status}
                highlight={certificate.status === 'active'}
              />
              <DetailRow
                label="Created"
                value={new Date(certificate.created_at).toLocaleString()}
              />
              <DetailRow
                label="Valid From"
                value={new Date(certificate.not_before).toLocaleString()}
              />
              <DetailRow
                label="Expires"
                value={new Date(certificate.not_after).toLocaleString()}
              />
              {certificate.fingerprint_sha256 && (
                <DetailRow
                  label="SHA-256 Fingerprint"
                  value={certificate.fingerprint_sha256}
                  mono
                  fullWidth
                />
              )}
              {certificate.metadata && (
                <DetailRow
                  label="Key Size"
                  value={`${certificate.metadata.key_size || 2048}-bit RSA`}
                />
              )}
              {certificate.superseded_by && (
                <DetailRow label="Superseded By" value={certificate.superseded_by} mono />
              )}
              {certificate.revocation_reason && (
                <DetailRow
                  label="Revocation Reason"
                  value={certificate.revocation_reason}
                  error
                  fullWidth
                />
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div style={styles.historyTab}>
              {isLoading ? (
                <div style={styles.loadingState}>
                  <div style={styles.spinner} />
                  <p style={styles.loadingText}>Loading audit history...</p>
                </div>
              ) : auditHistory.length === 0 ? (
                <div style={styles.emptyState}>
                  <FiClock size={28} style={{ color: colors.gray400 }} />
                  <p style={styles.emptyText}>No audit history found</p>
                </div>
              ) : (
                <div style={styles.timeline}>
                  {auditHistory.map((entry, index) => (
                    <div key={index} style={styles.timelineItem}>
                      <div style={styles.timelineDot} />
                      {index < auditHistory.length - 1 && <div style={styles.timelineLine} />}
                      <div style={styles.timelineContent}>
                        <p style={styles.timelineAction}>{entry.action}</p>
                        <p style={styles.timelineTime}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                        {entry.details && (
                          <div style={styles.timelineDetails}>
                            {Object.entries(entry.details).map(([key, value]) => (
                              <div key={key} style={styles.timelineDetailRow}>
                                <span style={styles.timelineDetailKey}>{key}:</span>
                                <span style={styles.timelineDetailValue}>
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.closeFooterBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for detail rows
const DetailRow = ({ label, value, highlight = false, mono = false, error = false, fullWidth = false }) => (
  <div style={{
    ...styles.detailRow,
    ...(fullWidth && { gridColumn: '1 / -1' })
  }}>
    <span style={styles.detailLabel}>{label}</span>
    <span style={{
      ...styles.detailValue,
      ...(highlight && { color: colors.success, fontWeight: 600 }),
      ...(mono && { fontFamily: typography.monoFamily, fontSize: '12px' }),
      ...(error && { color: colors.error })
    }}>
      {highlight && typeof value === 'string'
        ? value.charAt(0).toUpperCase() + value.slice(1)
        : value
      }
    </span>
  </div>
);

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
    maxWidth: '620px',
    maxHeight: '85vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: `1px solid ${colors.gray200}`,
    flexShrink: 0,
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
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

  tabs: {
    display: 'flex',
    borderBottom: `1px solid ${colors.gray200}`,
    flexShrink: 0,
  },

  tab: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    color: colors.gray500,
    borderBottom: '2px solid transparent',
    transition: transitions.fast,
  },

  activeTab: {
    color: colors.primary,
    borderBottomColor: colors.primary,
  },

  content: {
    flex: 1,
    overflow: 'auto',
    padding: '20px 24px',
  },

  // Details Tab
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '14px',
  },

  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },

  detailLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },

  detailValue: {
    fontSize: '14px',
    color: colors.gray800,
    fontWeight: 500,
    wordBreak: 'break-word',
  },

  // History Tab
  historyTab: {
    minHeight: '250px',
  },

  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '250px',
    gap: '12px',
  },

  spinner: {
    width: '28px',
    height: '28px',
    border: `3px solid ${colors.gray200}`,
    borderTopColor: colors.primary,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  loadingText: {
    fontSize: '14px',
    color: colors.gray500,
    margin: 0,
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '250px',
    gap: '8px',
  },

  emptyText: {
    fontSize: '14px',
    color: colors.gray500,
    margin: 0,
  },

  timeline: {
    display: 'flex',
    flexDirection: 'column',
  },

  timelineItem: {
    display: 'flex',
    position: 'relative',
    paddingBottom: '20px',
  },

  timelineDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: colors.primary,
    marginRight: '16px',
    marginTop: '4px',
    flexShrink: 0,
    zIndex: 1,
  },

  timelineLine: {
    position: 'absolute',
    left: '4px',
    top: '14px',
    bottom: 0,
    width: '2px',
    backgroundColor: colors.gray200,
  },

  timelineContent: {
    flex: 1,
    paddingBottom: '4px',
  },

  timelineAction: {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.gray900,
    margin: '0 0 2px 0',
  },

  timelineTime: {
    fontSize: '12px',
    color: colors.gray500,
    margin: '0 0 8px 0',
  },

  timelineDetails: {
    backgroundColor: '#F8FAFC',
    padding: '10px 14px',
    borderRadius: '8px',
    border: `1px solid ${colors.gray200}`,
    fontSize: '12px',
  },

  timelineDetailRow: {
    display: 'flex',
    marginBottom: '4px',
  },

  timelineDetailKey: {
    fontWeight: 600,
    color: colors.gray600,
    marginRight: '8px',
    minWidth: '80px',
  },

  timelineDetailValue: {
    color: colors.gray600,
    flex: 1,
    wordBreak: 'break-word',
  },

  footer: {
    padding: '16px 24px',
    borderTop: `1px solid ${colors.gray200}`,
    backgroundColor: '#FAFBFC',
    flexShrink: 0,
  },

  closeFooterBtn: {
    width: '100%',
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

// Inject spinner keyframes if not already present
if (typeof document !== 'undefined' && !document.querySelector('[data-cert-modal-styles]')) {
  const styleSheet = document.createElement('style');
  styleSheet.setAttribute('data-cert-modal-styles', 'true');
  styleSheet.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(styleSheet);
}

export default CertificateDetailsModal;
