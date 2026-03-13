import React, { useState, useEffect } from 'react';
import { FiX, FiLoader } from 'react-icons/fi';
import { colors, spacing, typography, borderRadius } from '../../theme';
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
      loadAuditHistory();
    }
  }, [activeTab, certificate]);

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

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Certificate Details</h2>
          <button
            style={styles.closeBtn}
            onClick={onClose}
          >
            <FiX size={24} />
          </button>
        </div>

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

        <div style={styles.content}>
          {activeTab === 'details' && (
            <div style={styles.detailsTab}>
              <DetailRow label="Certificate ID" value={certificate.certificate_id} />
              <DetailRow label="Subject" value={certificate.subject || 'N/A'} />
              <DetailRow label="Issuer" value={certificate.issuer || 'Self-Signed'} />
              <DetailRow label="Serial Number" value={certificate.serial_number || 'N/A'} />
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
                label="Not Before"
                value={new Date(certificate.not_before).toLocaleString()}
              />
              <DetailRow
                label="Not After (Expires)"
                value={new Date(certificate.not_after).toLocaleString()}
              />
              {certificate.fingerprint_sha256 && (
                <DetailRow
                  label="SHA256 Fingerprint"
                  value={certificate.fingerprint_sha256}
                  monospace
                />
              )}
              {certificate.certificate_type && (
                <DetailRow
                  label="Certificate Type"
                  value={certificate.certificate_type}
                />
              )}
              {certificate.metadata && (
                <DetailRow
                  label="Key Size"
                  value={`${certificate.metadata.key_size || 2048}-bit`}
                />
              )}
              {certificate.superseded_by && (
                <DetailRow
                  label="Superseded By"
                  value={certificate.superseded_by}
                />
              )}
              {certificate.revocation_reason && (
                <DetailRow
                  label="Revocation Reason"
                  value={certificate.revocation_reason}
                />
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div style={styles.historyTab}>
              {isLoading ? (
                <div style={styles.loading}>
                  <FiLoader style={styles.spinner} />
                  <p>Loading audit history...</p>
                </div>
              ) : auditHistory.length === 0 ? (
                <div style={styles.noHistory}>
                  No audit history found
                </div>
              ) : (
                <div style={styles.timeline}>
                  {auditHistory.map((entry, index) => (
                    <div key={index} style={styles.timelineItem}>
                      <div style={styles.timelineMarker} />
                      <div style={styles.timelineContent}>
                        <div style={styles.timelineAction}>{entry.action}</div>
                        <div style={styles.timelineTime}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                        {entry.details && (
                          <div style={styles.timelineDetails}>
                            {Object.entries(entry.details).map(([key, value]) => (
                              <div key={key} style={styles.detailItem}>
                                <span style={styles.detailKey}>{key}:</span>
                                <span style={styles.detailValue}>
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

        <div style={styles.footer}>
          <button
            style={styles.closeFooterBtn}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for detail rows
const DetailRow = ({ label, value, highlight = false, monospace = false }) => (
  <div style={styles.detailRow}>
    <span style={styles.detailLabel}>{label}:</span>
    <span style={{
      ...styles.detailValue,
      ...(highlight && { color: colors.success, fontWeight: 'bold' }),
      ...(monospace && { fontFamily: 'monospace', fontSize: '11px' })
    }}>
      {value}
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
    maxWidth: '700px',
    maxHeight: '85vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0
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
    justifyContent: 'center'
  },
  tabs: {
    display: 'flex',
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.lightGray,
    flexShrink: 0
  },
  tab: {
    flex: 1,
    padding: spacing.md,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray600,
    borderBottom: `3px solid transparent`,
    transition: 'all 0.2s'
  },
  activeTab: {
    color: colors.primary,
    borderBottomColor: colors.primary,
    backgroundColor: colors.white
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: spacing.lg
  },
  detailsTab: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: spacing.md
  },
  detailRow: {
    display: 'grid',
    gridTemplateColumns: '150px 1fr',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottom: `1px solid ${colors.border}`
  },
  detailLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray700
  },
  detailValue: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    wordBreak: 'break-word'
  },
  historyTab: {
    minHeight: '300px'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    color: colors.gray600
  },
  spinner: {
    fontSize: '32px',
    marginBottom: spacing.md,
    animation: 'spin 1s linear infinite'
  },
  noHistory: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    color: colors.gray600,
    fontSize: typography.sizes.sm
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column'
  },
  timelineItem: {
    display: 'flex',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottom: `1px solid ${colors.border}`
  },
  timelineMarker: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: colors.primary,
    marginRight: spacing.md,
    marginTop: '2px',
    flexShrink: 0
  },
  timelineContent: {
    flex: 1
  },
  timelineAction: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray900,
    marginBottom: spacing.xs
  },
  timelineTime: {
    fontSize: typography.sizes.xs,
    color: colors.gray600,
    marginBottom: spacing.sm
  },
  timelineDetails: {
    backgroundColor: colors.lightGray,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    fontSize: typography.sizes.xs
  },
  detailItem: {
    display: 'flex',
    marginBottom: spacing.xs
  },
  detailKey: {
    fontWeight: typography.weights.semibold,
    marginRight: spacing.sm,
    minWidth: '80px'
  },
  detailValue: {
    color: colors.gray600,
    flex: 1
  },
  footer: {
    display: 'flex',
    gap: spacing.md,
    padding: spacing.lg,
    borderTop: `1px solid ${colors.border}`,
    flexShrink: 0
  },
  closeFooterBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    border: 'none',
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default CertificateDetailsModal;
