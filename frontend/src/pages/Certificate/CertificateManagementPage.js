import React, { useState, useEffect, useContext, useCallback } from 'react';
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { AuthContext } from '../../contexts/AuthContext';
import CertificateService from '../../services/certificateService';
import CertificateCard from '../../components/Dashboard/CertificateCard';
import ExpiryWarning from '../../components/Dashboard/ExpiryWarning';
import RenewModal from '../../components/Dashboard/RenewModal';
import CertificateDetailsModal from '../../components/Dashboard/CertificateDetailsModal';
import { colors, spacing, typography, borderRadius } from '../../theme';
import './CertificateManagementPage.css';

/**
 * Certificate Management Page
 * Display, renew, download, and manage user certificates
 */
const CertificateManagementPage = () => {
  const { user } = useContext(AuthContext);

  // State
  const [certificates, setCertificates] = useState([]);
  const [activeCertificate, setActiveCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const loadCertificates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get active certificate
      const activeCert = await CertificateService.getActiveCertificate();
      setActiveCertificate(activeCert);

      // Get all certificates
      if (user?.id) {
        const allCerts = await CertificateService.getAllCertificates(user.id);
        setCertificates(allCerts);
      }
    } catch (err) {
      console.error('Failed to load certificates:', err);
      setError('Failed to load certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load certificates on mount
  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const handleRenew = (certificate) => {
    setSelectedCertificate(certificate);
    setShowRenewModal(true);
  };

  const handleRenewConfirm = async (renewData) => {
    try {
      setIsRenewing(true);
      setError(null);

      const result = await CertificateService.renewCertificate(
        renewData.certificateId,
        renewData.validityYears,
        renewData.reason
      );

      setSuccess(`Certificate renewed successfully! New certificate ID: ${result.new_certificate.certificate_id}`);
      setShowRenewModal(false);

      // Reload certificates
      setTimeout(() => {
        loadCertificates();
      }, 1500);
    } catch (err) {
      console.error('Renewal failed:', err);
      setError(err.response?.data?.error || 'Failed to renew certificate');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleRevoke = async (certificate) => {
    if (window.confirm(`Are you sure you want to revoke this certificate? This action cannot be undone.`)) {
      try {
        setIsRevoking(true);
        setError(null);

        await CertificateService.revokeCertificate(
          certificate.certificate_id,
          'User requested revocation'
        );

        setSuccess('Certificate revoked successfully');
        loadCertificates();
      } catch (err) {
        console.error('Revocation failed:', err);
        setError(err.response?.data?.error || 'Failed to revoke certificate');
      } finally {
        setIsRevoking(false);
      }
    }
  };

  const handleViewDetails = (certificate) => {
    setSelectedCertificate(certificate);
    setShowDetailsModal(true);
  };

  const handleDownload = async (certificate) => {
    try {
      const blob = await CertificateService.downloadCertificate(certificate.certificate_id);
      CertificateService.downloadFile(blob, `${certificate.certificate_id}.pem`);
      setSuccess('Certificate downloaded successfully');
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download certificate');
    }
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <p>Please log in to view your certificates</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Certificate Management</h1>
          <p style={styles.subtitle}>Manage your digital certificates and signing credentials</p>
        </div>
        <button
          style={styles.refreshBtn}
          onClick={loadCertificates}
          disabled={loading}
          title="Refresh certificates"
        >
          <FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div style={styles.alertBox('error')}>
          <FiAlertCircle style={styles.alertIcon} />
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {success && (
        <div style={styles.alertBox('success')}>
          <div>
            <strong>Success:</strong> {success}
          </div>
        </div>
      )}

      {/* Active Certificate Section */}
      {loading ? (
        <div style={styles.loadingBox}>
          <p>Loading your certificates...</p>
        </div>
      ) : activeCertificate ? (
        <>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Your Active Certificate</h2>
            <ExpiryWarning
              daysRemaining={CertificateService.getDaysRemaining(activeCertificate.not_after)}
              expiryDate={activeCertificate.not_after}
              status={activeCertificate.status}
            />
            <CertificateCard
              certificate={activeCertificate}
              onDownload={handleDownload}
              onRenew={handleRenew}
              onRevoke={handleRevoke}
              onViewDetails={handleViewDetails}
              isLoading={isRenewing || isRevoking}
            />
          </div>

          {/* Certificate Information */}
          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <div style={styles.infoValue}>
                {CertificateService.getDaysRemaining(activeCertificate.not_after)}
              </div>
              <div style={styles.infoLabel}>Days Remaining</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoValue}>
                {activeCertificate.certificate_id.substring(0, 15)}...
              </div>
              <div style={styles.infoLabel}>Certificate ID</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoValue}>
                {new Date(activeCertificate.created_at).toLocaleDateString()}
              </div>
              <div style={styles.infoLabel}>Created</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoValue}>
                {activeCertificate.status.charAt(0).toUpperCase() + activeCertificate.status.slice(1)}
              </div>
              <div style={styles.infoLabel}>Status</div>
            </div>
          </div>
        </>
      ) : (
        <div style={styles.noCertBox}>
          <FiAlertCircle style={styles.noCertIcon} />
          <h3>No Active Certificate</h3>
          <p>You don't have an active certificate yet. A certificate will be automatically created during registration.</p>
        </div>
      )}

      {/* Other Certificates */}
      {certificates.length > 1 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Other Certificates</h2>
          <div style={styles.certificateList}>
            {certificates
              .filter(cert => cert.certificate_id !== activeCertificate?.certificate_id)
              .map(cert => (
                <CertificateCard
                  key={cert.certificate_id}
                  certificate={cert}
                  onDownload={handleDownload}
                  onRenew={handleRenew}
                  onRevoke={handleRevoke}
                  onViewDetails={handleViewDetails}
                  isLoading={isRenewing || isRevoking}
                />
              ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div style={styles.helpSection}>
        <h3 style={styles.helpTitle}>Need Help?</h3>
        <div style={styles.helpGrid}>
          <div style={styles.helpCard}>
            <div style={styles.helpCardTitle}>About Certificates</div>
            <p style={styles.helpCardText}>
              Your digital certificate contains your public key and is used to verify your signatures. 
              It's automatically created when you register and expires after 5 years.
            </p>
          </div>
          <div style={styles.helpCard}>
            <div style={styles.helpCardTitle}>Certificate Renewal</div>
            <p style={styles.helpCardText}>
              Renew your certificate before it expires to maintain signing capabilities. 
              Your signing history is preserved when you renew.
            </p>
          </div>
          <div style={styles.helpCard}>
            <div style={styles.helpCardTitle}>Certificate Download</div>
            <p style={styles.helpCardText}>
              Download your certificate in PEM format for backup or use in other applications. 
              Never share your private key with anyone.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRenewModal && selectedCertificate && (
        <RenewModal
          certificate={selectedCertificate}
          onRenew={handleRenewConfirm}
          onCancel={() => setShowRenewModal(false)}
          isLoading={isRenewing}
        />
      )}

      {showDetailsModal && selectedCertificate && (
        <CertificateDetailsModal
          certificate={selectedCertificate}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: spacing.lg,
    backgroundColor: colors.lightGray,
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing['2xl'],
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  title: {
    margin: 0,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray900
  },
  subtitle: {
    margin: `${spacing.sm} 0 0 0`,
    fontSize: typography.sizes.sm,
    color: colors.gray600
  },
  refreshBtn: {
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.white,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    transition: 'all 0.2s'
  },
  alertBox: (type) => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    ...(type === 'error' && {
      backgroundColor: '#fee2e2',
      borderLeft: `4px solid ${colors.error}`,
      color: colors.error
    }),
    ...(type === 'success' && {
      backgroundColor: '#dcfce7',
      borderLeft: `4px solid ${colors.success}`,
      color: colors.success
    })
  }),
  alertIcon: {
    fontSize: '20px',
    flexShrink: 0
  },
  loadingBox: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    textAlign: 'center',
    color: colors.gray600
  },
  section: {
    marginBottom: spacing['2xl']
  },
  sectionTitle: {
    margin: 0,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray900,
    marginBottom: spacing.lg
  },
  certificateList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: spacing.lg
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing['2xl']
  },
  infoCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  infoValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.sm
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray600
  },
  noCertBox: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    textAlign: 'center',
    color: colors.gray600
  },
  noCertIcon: {
    fontSize: '48px',
    color: colors.warning,
    marginBottom: spacing.md
  },
  helpSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing['2xl']
  },
  helpTitle: {
    margin: 0,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray900,
    marginBottom: spacing.lg
  },
  helpGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: spacing.lg
  },
  helpCard: {
    padding: spacing.lg,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    borderLeft: `4px solid ${colors.primary}`
  },
  helpCardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray900,
    marginBottom: spacing.sm
  },
  helpCardText: {
    margin: 0,
    fontSize: typography.sizes.sm,
    color: colors.gray700,
    lineHeight: 1.6
  }
};

export default CertificateManagementPage;
