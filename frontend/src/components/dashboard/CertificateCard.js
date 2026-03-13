import React from 'react';
import { FiDownload, FiRotateCcw, FiTrash2, FiEye } from 'react-icons/fi';
import { colors, spacing, typography, borderRadius } from '../../theme';
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

  // Determine status color
  const getStatusColor = () => {
    if (isRevoked) return colors.gray600;
    if (isExpired) return colors.error;
    if (isExpiringSoon) return colors.warning;
    return colors.success;
  };

  // Determine status label
  const getStatusLabel = () => {
    if (isRevoked) return 'Revoked';
    if (isExpired) return 'Expired';
    if (isSuperseded) return 'Superseded';
    if (isExpiringSoon) return 'Expiring Soon';
    return 'Active';
  };

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

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h3 style={styles.title}>{certificate.subject || 'Digital Certificate'}</h3>
          <div style={{ ...styles.status, backgroundColor: getStatusColor(), color: '#fff' }}>
            {getStatusLabel()}
          </div>
        </div>
        <div style={styles.actions}>
          {!isRevoked && !isExpired && !isSuperseded && (
            <>
              <button
                style={styles.actionBtn}
                onClick={onViewDetails}
                title="View Details"
                disabled={isLoading}
              >
                <FiEye />
              </button>
              <button
                style={styles.actionBtn}
                onClick={handleDownload}
                title="Download Certificate"
                disabled={isLoading}
              >
                <FiDownload />
              </button>
              {!isExpired && (
                <button
                  style={styles.actionBtn}
                  onClick={() => onRenew && onRenew(certificate)}
                  title="Renew Certificate"
                  disabled={isLoading}
                >
                  <FiRotateCcw />
                </button>
              )}
              {!isExpired && (
                <button
                  style={{ ...styles.actionBtn, ...styles.revokeBtn }}
                  onClick={() => onRevoke && onRevoke(certificate)}
                  title="Revoke Certificate"
                  disabled={isLoading}
                >
                  <FiTrash2 />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div style={styles.details}>
        <div style={styles.detailRow}>
          <span style={styles.label}>Certificate ID:</span>
          <span style={styles.value}>{certificate.certificate_id}</span>
        </div>

        <div style={styles.detailRow}>
          <span style={styles.label}>Issuer:</span>
          <span style={styles.value}>{certificate.issuer || 'Self-Signed'}</span>
        </div>

        <div style={styles.detailRow}>
          <span style={styles.label}>Serial Number:</span>
          <span style={styles.value}>{certificate.serial_number?.substring(0, 20)}...</span>
        </div>

        <div style={styles.detailRow}>
          <span style={styles.label}>Created:</span>
          <span style={styles.value}>
            {new Date(certificate.created_at).toLocaleDateString()}
          </span>
        </div>

        <div style={styles.detailRow}>
          <span style={styles.label}>Not Before:</span>
          <span style={styles.value}>
            {new Date(certificate.not_before).toLocaleDateString()}
          </span>
        </div>

        <div style={styles.detailRow}>
          <span style={styles.label}>Expires:</span>
          <span style={{ ...styles.value, color: getStatusColor(), fontWeight: 'bold' }}>
            {new Date(certificate.not_after).toLocaleDateString()}
            {!isExpired && !isRevoked && !isSuperseded && (
              <span> {daysRemaining} days remaining</span>
            )}
          </span>
        </div>

        {certificate.fingerprint_sha256 && (
          <div style={styles.detailRow}>
            <span style={styles.label}>Fingerprint (SHA256):</span>
            <span style={styles.value}>{certificate.fingerprint_sha256.substring(0, 20)}...</span>
          </div>
        )}

        {certificate.status === 'superseded' && certificate.superseded_by && (
          <div style={styles.detailRow}>
            <span style={styles.label}>Superseded By:</span>
            <span style={styles.value}>{certificate.superseded_by}</span>
          </div>
        )}

        {certificate.status === 'revoked' && certificate.revocation_reason && (
          <div style={styles.detailRow}>
            <span style={styles.label}>Revocation Reason:</span>
            <span style={styles.value}>{certificate.revocation_reason}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${colors.border}`
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottom: `1px solid ${colors.border}`
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1
  },
  title: {
    margin: 0,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray900
  },
  status: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.sm,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    whiteSpace: 'nowrap'
  },
  actions: {
    display: 'flex',
    gap: spacing.sm
  },
  actionBtn: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.white,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    color: colors.gray700,
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: colors.lightGray,
      borderColor: colors.primary
    }
  },
  revokeBtn: {
    color: colors.error,
    borderColor: colors.error
  },
  details: {
    backgroundColor: colors.lightGray,
    padding: spacing.md,
    borderRadius: borderRadius.md
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottom: `1px solid ${colors.border}`
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray700,
    minWidth: '140px'
  },
  value: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    wordBreak: 'break-all',
    flex: 1,
    textAlign: 'right'
  }
};

export default CertificateCard;
