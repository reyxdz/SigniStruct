import React from 'react';
import { FiDownload, FiRotateCcw, FiTrash2, FiEye, FiShield } from 'react-icons/fi';
import { colors, typography, transitions } from '../../theme';
import CertificateService from '../../services/certificateService';

/**
 * CertificateCard Component
 * Displays a single certificate with actions
 */
const CertificateCard = ({ 
  certificate, 
  onDownload, 
  onRenew, 
  onRevoke, 
  onViewDetails,
  isLoading = false 
}) => {
  const daysRemaining = CertificateService.getDaysRemaining(certificate.not_after);
  const isExpiringSoon = CertificateService.isExpiringsoon(certificate.not_after);
  const isExpired = CertificateService.isExpired(certificate.not_after);
  const isRevoked = certificate.status === 'revoked';
  const isSuperseded = certificate.status === 'superseded';

  const getStatusConfig = () => {
    if (isRevoked) return { color: colors.gray600, bg: '#F3F4F6', border: '#D1D5DB', label: 'Revoked' };
    if (isExpired) return { color: colors.error, bg: colors.errorLight, border: '#FECACA', label: 'Expired' };
    if (isSuperseded) return { color: colors.gray600, bg: '#F3F4F6', border: '#D1D5DB', label: 'Superseded' };
    if (isExpiringSoon) return { color: colors.warning, bg: colors.warningLight, border: '#FDE68A', label: 'Expiring Soon' };
    return { color: colors.success, bg: colors.successLight, border: '#A7F3D0', label: 'Active' };
  };

  const status = getStatusConfig();

  const handleDownload = async () => {
    try {
      const blob = await CertificateService.downloadCertificate(certificate.certificate_id);
      CertificateService.downloadFile(blob, `${certificate.certificate_id}.pem`);
      onDownload && onDownload(certificate);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download certificate');
    }
  };

  const isInactive = isRevoked || isExpired || isSuperseded;

  return (
    <div style={{
      ...styles.card,
      borderLeftColor: status.color,
      opacity: isInactive ? 0.75 : 1
    }}>
      {/* Header Row */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={{...styles.statusAvatar, backgroundColor: status.bg, color: status.color}}>
            <FiShield size={18} />
          </div>
          <div style={styles.headerInfo}>
            <p style={styles.subject}>{certificate.subject || 'Digital Certificate'}</p>
            <p style={styles.certId}>{certificate.certificate_id}</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={{
            ...styles.statusChip,
            backgroundColor: status.bg,
            color: status.color,
            borderColor: status.border,
          }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div style={styles.detailsGrid}>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Issuer</span>
          <span style={styles.detailValue}>{certificate.issuer || 'SigniStruct'}</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Serial Number</span>
          <span style={styles.detailValue}>{certificate.serial_number?.substring(0, 20)}...</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Created</span>
          <span style={styles.detailValue}>{new Date(certificate.created_at).toLocaleDateString()}</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Valid From</span>
          <span style={styles.detailValue}>{new Date(certificate.not_before).toLocaleDateString()}</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Expires</span>
          <span style={{...styles.detailValue, color: status.color, fontWeight: 600}}>
            {new Date(certificate.not_after).toLocaleDateString()}
            {!isExpired && !isRevoked && !isSuperseded && (
              <span style={styles.daysTag}> ({daysRemaining}d)</span>
            )}
          </span>
        </div>
        {certificate.fingerprint_sha256 && (
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Fingerprint</span>
            <span style={{...styles.detailValue, fontFamily: typography.monoFamily, fontSize: '11px'}}>
              {certificate.fingerprint_sha256.substring(0, 24)}...
            </span>
          </div>
        )}
        {certificate.status === 'superseded' && certificate.superseded_by && (
          <div style={{...styles.detailItem, gridColumn: '1 / -1'}}>
            <span style={styles.detailLabel}>Superseded By</span>
            <span style={styles.detailValue}>{certificate.superseded_by}</span>
          </div>
        )}
        {certificate.status === 'revoked' && certificate.revocation_reason && (
          <div style={{...styles.detailItem, gridColumn: '1 / -1'}}>
            <span style={styles.detailLabel}>Revocation Reason</span>
            <span style={{...styles.detailValue, color: colors.error}}>{certificate.revocation_reason}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isInactive && (
        <div style={styles.actions}>
          <button style={styles.actionBtn} onClick={onViewDetails} title="View Details" disabled={isLoading}>
            <FiEye size={15} />
            <span>Details</span>
          </button>
          <button style={styles.actionBtn} onClick={handleDownload} title="Download" disabled={isLoading}>
            <FiDownload size={15} />
            <span>Download</span>
          </button>
          <button style={styles.actionBtn} onClick={() => onRenew && onRenew(certificate)} title="Renew" disabled={isLoading}>
            <FiRotateCcw size={15} />
            <span>Renew</span>
          </button>
          <button
            style={{...styles.actionBtn, ...styles.revokeAction}}
            onClick={() => onRevoke && onRevoke(certificate)}
            title="Revoke"
            disabled={isLoading}
          >
            <FiTrash2 size={15} />
            <span>Revoke</span>
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#FAFBFC',
    borderRadius: '10px',
    border: `1px solid ${colors.gray200}`,
    borderLeft: '4px solid',
    overflow: 'hidden',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    minWidth: 0,
  },

  statusAvatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    flexShrink: 0,
  },

  headerInfo: {
    minWidth: 0,
    flex: 1,
  },

  subject: {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.gray900,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  certId: {
    fontSize: '11px',
    color: colors.gray500,
    margin: '2px 0 0 0',
    fontFamily: typography.monoFamily,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  headerRight: {
    flexShrink: 0,
    marginLeft: '12px',
  },

  statusChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid',
    whiteSpace: 'nowrap',
  },

  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    padding: '0 20px 16px',
  },

  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  detailLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },

  detailValue: {
    fontSize: '13px',
    color: colors.gray700,
    fontWeight: 500,
    wordBreak: 'break-all',
  },

  daysTag: {
    fontWeight: 400,
    opacity: 0.8,
  },

  actions: {
    display: 'flex',
    gap: '8px',
    padding: '12px 20px',
    borderTop: `1px solid ${colors.gray200}`,
    backgroundColor: colors.white,
  },

  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    borderRadius: '8px',
    border: `1px solid ${colors.gray300}`,
    backgroundColor: colors.white,
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    color: colors.gray700,
    transition: transitions.fast,
  },

  revokeAction: {
    color: colors.error,
    borderColor: '#FECACA',
    marginLeft: 'auto',
  },
};

export default CertificateCard;
