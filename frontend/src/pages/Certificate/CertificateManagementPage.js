import React, { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw, FiAlertCircle, FiShield, FiKey, FiCalendar, FiClock } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import CertificateService from '../../services/certificateService';
import CertificateCard from '../../components/dashboard/CertificateCard';
import ExpiryWarning from '../../components/dashboard/ExpiryWarning';
import RenewModal from '../../components/dashboard/RenewModal';
import CertificateDetailsModal from '../../components/dashboard/CertificateDetailsModal';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import './CertificateManagementPage.css';

/**
 * Certificate Management Page
 * Display, renew, download, and manage user certificates
 */
const CertificateManagementPage = () => {
  const { user } = useAuth();

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

      const activeCert = await CertificateService.getActiveCertificate();
      setActiveCertificate(activeCert);

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

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  // Auto-dismiss success after 4 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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

      setSuccess(`Certificate renewed successfully. New ID: ${result.new_certificate.certificate_id}`);
      setShowRenewModal(false);

      setTimeout(() => { loadCertificates(); }, 1500);
    } catch (err) {
      console.error('Renewal failed:', err);
      setError(err.response?.data?.error || 'Failed to renew certificate');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleRevoke = async (certificate) => {
    if (window.confirm('Are you sure you want to revoke this certificate? This action cannot be undone.')) {
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
      <div style={styles.centeredContainer}>
        <div style={styles.emptyCard}>
          <FiAlertCircle size={32} style={{ color: colors.gray400 }} />
          <p style={styles.emptyText}>Please log in to view your certificates</p>
        </div>
      </div>
    );
  }

  const daysRemaining = activeCertificate
    ? CertificateService.getDaysRemaining(activeCertificate.not_after)
    : 0;

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <FiShield size={22} style={{ color: colors.primary }} />
          <div>
            <h1 style={styles.pageTitle}>Certificate Management</h1>
            <p style={styles.pageSubtitle}>Manage your digital certificates and signing credentials</p>
          </div>
        </div>
        <button
          style={styles.refreshBtn}
          onClick={loadCertificates}
          disabled={loading}
          title="Refresh certificates"
        >
          <FiRefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Alert Messages */}
        {error && (
          <div style={styles.alertError}>
            <FiAlertCircle size={18} style={{ flexShrink: 0 }} />
            <span><strong>Error:</strong> {error}</span>
            <button style={styles.alertDismiss} onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        {success && (
          <div style={styles.alertSuccess}>
            <FiShield size={18} style={{ flexShrink: 0 }} />
            <span>{success}</span>
            <button style={styles.alertDismiss} onClick={() => setSuccess(null)}>&times;</button>
          </div>
        )}

        {loading ? (
          <div style={styles.loadingCard}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Loading your certificates...</p>
          </div>
        ) : activeCertificate ? (
          <>
            {/* Expiry Warning */}
            <ExpiryWarning
              daysRemaining={daysRemaining}
              expiryDate={activeCertificate.not_after}
              status={activeCertificate.status}
            />

            {/* Stats Grid */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={{...styles.statIcon, background: colors.primaryVeryLight, color: colors.primary}}>
                  <FiClock size={20} />
                </div>
                <div>
                  <p style={styles.statValue}>{daysRemaining}</p>
                  <p style={styles.statLabel}>Days Remaining</p>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statIcon, background: colors.successLight, color: colors.success}}>
                  <FiShield size={20} />
                </div>
                <div>
                  <p style={{...styles.statValue, color: colors.success}}>
                    {activeCertificate.status.charAt(0).toUpperCase() + activeCertificate.status.slice(1)}
                  </p>
                  <p style={styles.statLabel}>Status</p>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statIcon, background: '#EDE9FE', color: '#7C3AED'}}>
                  <FiKey size={20} />
                </div>
                <div>
                  <p style={styles.statValue}>RSA-2048</p>
                  <p style={styles.statLabel}>Key Type</p>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={{...styles.statIcon, background: colors.warningLight, color: colors.warning}}>
                  <FiCalendar size={20} />
                </div>
                <div>
                  <p style={styles.statValue}>{new Date(activeCertificate.created_at).toLocaleDateString()}</p>
                  <p style={styles.statLabel}>Created</p>
                </div>
              </div>
            </div>

            {/* Active Certificate */}
            <div style={styles.sectionCard}>
              <h3 style={styles.cardHeading}>Active Certificate</h3>
              <CertificateCard
                certificate={activeCertificate}
                onDownload={handleDownload}
                onRenew={handleRenew}
                onRevoke={handleRevoke}
                onViewDetails={handleViewDetails}
                isLoading={isRenewing || isRevoking}
              />
            </div>

            {/* Other Certificates */}
            {certificates.length > 1 && (
              <div style={styles.sectionCard}>
                <h3 style={styles.cardHeading}>
                  Previous Certificates ({certificates.length - 1})
                </h3>
                <div style={styles.certList}>
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
          </>
        ) : (
          <div style={styles.emptyCard}>
            <FiShield size={40} style={{ color: colors.gray400 }} />
            <h3 style={styles.emptyTitle}>No Active Certificate</h3>
            <p style={styles.emptyText}>
              You don't have an active certificate yet. A certificate will be automatically created during registration.
            </p>
          </div>
        )}

        {/* Help Section */}
        <div style={styles.sectionCard}>
          <h3 style={styles.cardHeading}>Quick Reference</h3>
          <div style={styles.helpGrid}>
            <div style={styles.helpCard}>
              <FiShield size={18} style={{ color: colors.primary, flexShrink: 0 }} />
              <div>
                <p style={styles.helpTitle}>About Certificates</p>
                <p style={styles.helpText}>
                  Your digital certificate contains your public key and is used to verify your signatures. It's automatically created when you register and expires after 5 years.
                </p>
              </div>
            </div>
            <div style={styles.helpCard}>
              <FiRefreshCw size={18} style={{ color: colors.primary, flexShrink: 0 }} />
              <div>
                <p style={styles.helpTitle}>Certificate Renewal</p>
                <p style={styles.helpText}>
                  Renew your certificate before it expires to maintain signing capabilities. Your signing history is preserved when you renew.
                </p>
              </div>
            </div>
            <div style={styles.helpCard}>
              <FiKey size={18} style={{ color: colors.primary, flexShrink: 0 }} />
              <div>
                <p style={styles.helpTitle}>Security</p>
                <p style={styles.helpText}>
                  Download your certificate in PEM format for backup. Never share your private key with anyone. Revoke a compromised certificate immediately.
                </p>
              </div>
            </div>
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
  page: {
    minHeight: '100vh',
    backgroundColor: '#F1F5F9',
    fontFamily: typography.fontFamily,
  },

  centeredContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#F1F5F9',
    padding: spacing.xl,
  },

  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.gray200}`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },

  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  pageTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: colors.gray900,
    margin: 0,
    lineHeight: 1.2,
  },

  pageSubtitle: {
    fontSize: '13px',
    color: colors.gray500,
    margin: '2px 0 0 0',
  },

  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.base,
    padding: '8px 16px',
    fontSize: '14px',
    color: colors.primary,
    cursor: 'pointer',
    transition: transitions.fast,
    fontWeight: 600,
  },

  mainContent: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '28px 24px 64px',
  },

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },

  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },

  statIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    flexShrink: 0,
  },

  statValue: {
    fontSize: '16px',
    fontWeight: 700,
    color: colors.gray900,
    margin: 0,
    lineHeight: 1.2,
  },

  statLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: colors.gray500,
    margin: '3px 0 0 0',
  },

  // Section Card
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },

  cardHeading: {
    fontSize: '16px',
    fontWeight: 700,
    color: colors.gray900,
    margin: '0 0 16px 0',
  },

  certList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  // Alerts
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
    borderRadius: '10px',
    backgroundColor: colors.errorLight,
    color: colors.error,
    fontSize: '14px',
    border: '1px solid #FECACA',
  },

  alertSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
    borderRadius: '10px',
    backgroundColor: colors.successLight,
    color: colors.success,
    fontSize: '14px',
    border: '1px solid #A7F3D0',
  },

  alertDismiss: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: 'inherit',
    padding: '0 4px',
    lineHeight: 1,
    opacity: 0.7,
  },

  // Loading
  loadingCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: '48px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },

  spinner: {
    width: '32px',
    height: '32px',
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

  // Empty
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: '48px 24px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    marginBottom: '20px',
  },

  emptyTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: colors.gray800,
    margin: 0,
  },

  emptyText: {
    fontSize: '14px',
    color: colors.gray500,
    margin: 0,
    maxWidth: '360px',
    lineHeight: 1.5,
  },

  // Help
  helpGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  helpCard: {
    display: 'flex',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    border: `1px solid ${colors.gray200}`,
  },

  helpTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.gray900,
    margin: '0 0 4px 0',
  },

  helpText: {
    fontSize: '13px',
    color: colors.gray600,
    margin: 0,
    lineHeight: 1.55,
  },
};

export default CertificateManagementPage;
