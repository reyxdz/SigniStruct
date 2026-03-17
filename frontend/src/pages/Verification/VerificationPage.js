import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiArrowLeft, FiCheck, FiX, FiDownload, FiAlertCircle, FiCheckCircle, FiClock, FiShield, FiUser, FiCalendar, FiFileText } from 'react-icons/fi';

/**
 * Verification Page
 * Displays document verification results with tamper detection
 * Shows all signatures with their verification status
 * Allows downloading verification certificates
 */
const VerificationPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  // State
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  /**
   * Fetch document verification status
   */
  const fetchVerification = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/verification/documents/${documentId}/status`);
      
      if (response.data.success) {
        console.log('✅ Verification data received:', response.data.data);
        setVerification(response.data.data);
      } else {
        setError(response.data.message || 'Failed to verify document');
      }
    } catch (err) {
      console.error('Verification fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch verification data');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  // Fetch verification on mount
  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  /**
   * Download verification certificate
   */
  const handleDownloadCertificate = async () => {
    try {
      setDownloading(true);
      
      const response = await api.get(`/verification/documents/${documentId}/certificate`, {
        responseType: 'blob'
      });

      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${documentId}-verification-certificate.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download certificate');
    } finally {
      setDownloading(false);
    }
  };

  // Categorize signatures
  const getSignatureGroups = () => {
    if (!verification?.signatures) return { verified: [], pending: [], invalid: [] };
    
    const verified = verification.signatures.filter(sig => sig.is_valid && sig.status !== 'pending');
    const pending = verification.signatures.filter(sig => 
      sig.status === 'pending' || (!sig.is_valid && sig.errors?.some(e => e.includes('not yet')))
    );
    const invalid = verification.signatures.filter(sig => 
      !sig.is_valid && sig.status !== 'pending' && !sig.errors?.some(e => e.includes('not yet'))
    );
    
    return { verified, pending, invalid };
  };

  if (loading) {
    return (
      <div style={styles.centeredContainer}>
        <div style={styles.loadingWrapper}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Verifying document signatures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centeredContainer}>
        <div style={styles.errorCard}>
          <div style={styles.errorIconWrap}>
            <FiAlertCircle size={40} />
          </div>
          <h2 style={styles.errorTitle}>Verification Failed</h2>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.primaryBtn} onClick={() => navigate('/documents')}>
            <FiArrowLeft size={16} style={{ marginRight: '8px' }} />
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  if (!verification) {
    return (
      <div style={styles.centeredContainer}>
        <div style={styles.errorCard}>
          <p style={styles.errorText}>No verification data available</p>
          <button style={styles.primaryBtn} onClick={() => navigate('/documents')}>
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  const isValid = verification.is_valid;
  const { verified, pending, invalid } = getSignatureGroups();

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <button onClick={() => navigate('/documents')} style={styles.backBtn}>
          <FiArrowLeft size={16} />
          <span>Back</span>
        </button>
        <button
          style={styles.downloadBtn}
          onClick={handleDownloadCertificate}
          disabled={downloading}
        >
          <FiDownload size={16} />
          <span>{downloading ? 'Downloading...' : 'Download Certificate'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Page Title */}
        <div style={styles.pageHeader}>
          <FiShield size={24} style={{ color: colors.primary }} />
          <div>
            <h1 style={styles.pageTitle}>Document Verification</h1>
            <p style={styles.pageSubtitle}>{verification.document_title || 'Document'}</p>
          </div>
        </div>

        {/* Status Banner */}
        <div style={{
          ...styles.statusBanner,
          background: isValid 
            ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' 
            : 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)'
        }}>
          <div style={styles.statusBannerIcon}>
            {isValid ? <FiCheckCircle size={36} /> : <FiAlertCircle size={36} />}
          </div>
          <div style={styles.statusBannerContent}>
            <h2 style={styles.statusBannerTitle}>
              {isValid ? 'All Signatures Verified' : 'Verification Incomplete'}
            </h2>
            <p style={styles.statusBannerDesc}>
              {isValid 
                ? `All ${verification.signature_count} signature(s) have been cryptographically verified and are valid.`
                : `${verification.verified_count} of ${verification.signature_count} signature(s) verified. ${pending.length} pending, ${invalid.length} invalid.`
              }
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: colors.primaryVeryLight, color: colors.primary}}>
              <FiFileText size={20} />
            </div>
            <div>
              <p style={styles.statValue}>{verification.signature_count}</p>
              <p style={styles.statLabel}>Total Signatures</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: colors.successLight, color: colors.success}}>
              <FiCheck size={20} />
            </div>
            <div>
              <p style={styles.statValue}>{verified.length}</p>
              <p style={styles.statLabel}>Verified</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: colors.warningLight, color: colors.warning}}>
              <FiClock size={20} />
            </div>
            <div>
              <p style={styles.statValue}>{pending.length}</p>
              <p style={styles.statLabel}>Pending</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, background: colors.errorLight, color: colors.error}}>
              <FiX size={20} />
            </div>
            <div>
              <p style={styles.statValue}>{invalid.length}</p>
              <p style={styles.statLabel}>Invalid</p>
            </div>
          </div>
        </div>

        {/* Verification Details */}
        <div style={styles.detailsCard}>
          <h3 style={styles.cardHeading}>Verification Details</h3>
          <div style={styles.detailsGrid}>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Verification Date</span>
              <span style={styles.detailValue}>
                {new Date(verification.timestamp || verification.verification_timestamp).toLocaleString()}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Overall Status</span>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: isValid ? colors.successLight : colors.warningLight,
                color: isValid ? colors.success : colors.warning
              }}>
                {isValid ? '✓ Fully Verified' : '⏳ Partially Verified'}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.detailLabel}>Signatures</span>
              <span style={styles.detailValue}>
                {verification.verified_count} of {verification.signature_count} verified
              </span>
            </div>
            {verification.details?.message && (
              <div style={{...styles.detailItem, gridColumn: '1 / -1'}}>
                <span style={styles.detailLabel}>Summary</span>
                <span style={styles.detailValue}>{verification.details.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Document Integrity */}
        {verification.document_integrity && (
          <div style={styles.detailsCard}>
            <h3 style={styles.cardHeading}>Document Integrity</h3>
            <div style={{
              ...styles.integrityBanner,
              backgroundColor: verification.document_integrity.valid ? colors.successLight : colors.errorLight,
              borderColor: verification.document_integrity.valid ? '#A7F3D0' : '#FECACA'
            }}>
              {verification.document_integrity.valid ? (
                <>
                  <FiCheckCircle size={22} style={{ color: colors.success, flexShrink: 0 }} />
                  <div>
                    <p style={{...styles.integrityTitle, color: colors.success}}>Document Intact</p>
                    <p style={styles.integrityDesc}>No tampering has been detected. The document content is authentic.</p>
                  </div>
                </>
              ) : (
                <>
                  <FiAlertCircle size={22} style={{ color: colors.error, flexShrink: 0 }} />
                  <div>
                    <p style={{...styles.integrityTitle, color: colors.error}}>Tampering Detected</p>
                    <p style={styles.integrityDesc}>The document content has been modified after signing.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Signatures List */}
        <div style={styles.signaturesSection}>
          <h3 style={styles.cardHeading}>
            Signatures ({verification.signature_count})
          </h3>

          {verification.signatures && verification.signatures.length > 0 ? (
            <div style={styles.sigList}>
              {/* Verified Signatures */}
              {verified.length > 0 && (
                <div style={styles.sigGroup}>
                  <div style={styles.sigGroupHeader}>
                    <FiCheckCircle size={16} style={{ color: colors.success }} />
                    <span style={{...styles.sigGroupTitle, color: colors.success}}>
                      Verified ({verified.length})
                    </span>
                  </div>
                  {verified.map((sig, index) => (
                    <SignatureCard key={`verified-${index}`} sig={sig} type="verified" />
                  ))}
                </div>
              )}

              {/* Pending Signatures */}
              {pending.length > 0 && (
                <div style={styles.sigGroup}>
                  <div style={styles.sigGroupHeader}>
                    <FiClock size={16} style={{ color: colors.warning }} />
                    <span style={{...styles.sigGroupTitle, color: colors.warning}}>
                      Pending ({pending.length})
                    </span>
                  </div>
                  {pending.map((sig, index) => (
                    <SignatureCard key={`pending-${index}`} sig={sig} type="pending" />
                  ))}
                </div>
              )}

              {/* Invalid Signatures */}
              {invalid.length > 0 && (
                <div style={styles.sigGroup}>
                  <div style={styles.sigGroupHeader}>
                    <FiX size={16} style={{ color: colors.error }} />
                    <span style={{...styles.sigGroupTitle, color: colors.error}}>
                      Invalid ({invalid.length})
                    </span>
                  </div>
                  {invalid.map((sig, index) => (
                    <SignatureCard key={`invalid-${index}`} sig={sig} type="invalid" />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <FiFileText size={32} style={{ color: colors.gray400 }} />
              <p style={styles.emptyText}>No signatures on this document</p>
            </div>
          )}
        </div>

        {/* Document Hash */}
        {verification.document_hash && (
          <div style={styles.detailsCard}>
            <h3 style={styles.cardHeading}>Document Hash (SHA-256)</h3>
            <div style={styles.hashBlock}>
              <code style={styles.hashCode}>{verification.document_hash}</code>
            </div>
            <p style={styles.hashHint}>
              This cryptographic hash uniquely identifies the document. Any modification to the content will produce a different hash.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Signature Card Component
 */
const SignatureCard = ({ sig, type }) => {
  const typeConfig = {
    verified: {
      accent: colors.success,
      bg: colors.successLight,
      icon: <FiCheck size={18} />,
      statusText: 'Verified',
      borderColor: '#A7F3D0'
    },
    pending: {
      accent: colors.warning,
      bg: colors.warningLight,
      icon: <FiClock size={18} />,
      statusText: 'Awaiting Signature',
      borderColor: '#FDE68A'
    },
    invalid: {
      accent: colors.error,
      bg: colors.errorLight,
      icon: <FiX size={18} />,
      statusText: 'Invalid',
      borderColor: '#FECACA'
    }
  };

  const config = typeConfig[type];

  return (
    <div style={{
      ...styles.sigCard,
      borderLeftColor: config.accent
    }}>
      {/* Signer Info Row */}
      <div style={styles.sigCardTop}>
        <div style={styles.sigCardUser}>
          <div style={{
            ...styles.sigAvatar,
            backgroundColor: config.bg,
            color: config.accent
          }}>
            {config.icon}
          </div>
          <div>
            <p style={styles.sigEmail}>
              {sig.signer?.email || sig.signer_email || 'Unknown Signer'}
            </p>
            <p style={styles.sigType}>
              {sig.field_label || 'Document Signature'}
            </p>
          </div>
        </div>
        <span style={{
          ...styles.sigStatusChip,
          backgroundColor: config.bg,
          color: config.accent,
          borderColor: config.borderColor
        }}>
          {config.statusText}
        </span>
      </div>

      {/* Details Grid */}
      {type !== 'pending' && (
        <div style={styles.sigMeta}>
          {sig.signed_at && (
            <div style={styles.sigMetaItem}>
              <FiCalendar size={14} style={{ color: colors.gray400 }} />
              <span style={styles.sigMetaLabel}>Signed:</span>
              <span style={styles.sigMetaValue}>{new Date(sig.signed_at).toLocaleString()}</span>
            </div>
          )}
          {sig.certificate_valid !== undefined && sig.certificate_valid !== null && (
            <div style={styles.sigMetaItem}>
              <FiShield size={14} style={{ color: sig.certificate_valid ? colors.success : colors.error }} />
              <span style={styles.sigMetaLabel}>Certificate:</span>
              <span style={{
                ...styles.sigMetaValue,
                color: sig.certificate_valid ? colors.success : colors.error,
                fontWeight: 600
              }}>
                {sig.certificate_valid ? 'Active' : 'Invalid'}
              </span>
            </div>
          )}
          {sig.certificate_expire_date && (
            <div style={styles.sigMetaItem}>
              <FiCalendar size={14} style={{ color: colors.gray400 }} />
              <span style={styles.sigMetaLabel}>Expires:</span>
              <span style={styles.sigMetaValue}>
                {new Date(sig.certificate_expire_date).toLocaleDateString()}
              </span>
            </div>
          )}
          {sig.errors && sig.errors.length > 0 && type === 'invalid' && (
            <div style={{...styles.sigMetaItem, gridColumn: '1 / -1'}}>
              <FiAlertCircle size={14} style={{ color: colors.error }} />
              <span style={styles.sigMetaLabel}>Issues:</span>
              <span style={{...styles.sigMetaValue, color: colors.error}}>
                {sig.errors.join(' · ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Styles
 */
const styles = {
  // Layout
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

  // Top Bar
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 32px',
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.gray200}`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },

  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.base,
    padding: '8px 16px',
    fontSize: '14px',
    color: colors.gray700,
    cursor: 'pointer',
    transition: transitions.fast,
    fontWeight: 500,
  },

  downloadBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.base,
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: transitions.fast,
  },

  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.base,
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: transitions.fast,
  },

  // Main Content
  mainContent: {
    maxWidth: '860px',
    margin: '0 auto',
    padding: '32px 24px 64px',
  },

  // Page Header
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },

  pageTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: colors.gray900,
    margin: 0,
    lineHeight: 1.2,
  },

  pageSubtitle: {
    fontSize: '14px',
    color: colors.gray500,
    margin: '2px 0 0 0',
  },

  // Status Banner
  statusBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '24px 28px',
    borderRadius: '14px',
    marginBottom: '20px',
    color: colors.white,
  },

  statusBannerIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexShrink: 0,
  },

  statusBannerContent: {
    flex: 1,
  },

  statusBannerTitle: {
    fontSize: '20px',
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.3,
  },

  statusBannerDesc: {
    fontSize: '14px',
    margin: '6px 0 0 0',
    opacity: 0.92,
    lineHeight: 1.5,
  },

  // Stats Grid
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
    fontSize: '20px',
    fontWeight: 700,
    color: colors.gray900,
    margin: 0,
    lineHeight: 1,
  },

  statLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: colors.gray500,
    margin: '4px 0 0 0',
  },

  // Details Card
  detailsCard: {
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

  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },

  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  detailLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  detailValue: {
    fontSize: '14px',
    color: colors.gray800,
    fontWeight: 500,
  },

  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    width: 'fit-content',
  },

  // Integrity Banner
  integrityBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    padding: '16px 20px',
    borderRadius: '10px',
    border: '1px solid',
  },

  integrityTitle: {
    fontSize: '15px',
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.3,
  },

  integrityDesc: {
    fontSize: '13px',
    color: colors.gray600,
    margin: '4px 0 0 0',
    lineHeight: 1.5,
  },

  // Signatures Section
  signaturesSection: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },

  sigList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  sigGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  sigGroupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingBottom: '8px',
    borderBottom: `1px solid ${colors.gray200}`,
  },

  sigGroupTitle: {
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  // Signature Card
  sigCard: {
    padding: '16px 20px',
    borderRadius: '10px',
    backgroundColor: '#FAFBFC',
    border: `1px solid ${colors.gray200}`,
    borderLeft: '4px solid',
  },

  sigCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sigCardUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  sigAvatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    flexShrink: 0,
  },

  sigEmail: {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.gray900,
    margin: 0,
  },

  sigType: {
    fontSize: '12px',
    color: colors.gray500,
    margin: '2px 0 0 0',
  },

  sigStatusChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid',
    whiteSpace: 'nowrap',
  },

  sigMeta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: `1px solid ${colors.gray200}`,
  },

  sigMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
  },

  sigMetaLabel: {
    color: colors.gray500,
    fontWeight: 500,
  },

  sigMetaValue: {
    color: colors.gray700,
    fontWeight: 500,
  },

  // Hash
  hashBlock: {
    backgroundColor: colors.gray900,
    borderRadius: '8px',
    padding: '14px 18px',
    marginBottom: '12px',
    overflowX: 'auto',
  },

  hashCode: {
    color: '#93C5FD',
    fontSize: '12px',
    fontFamily: typography.monoFamily,
    wordBreak: 'break-all',
    lineHeight: 1.6,
  },

  hashHint: {
    fontSize: '13px',
    color: colors.gray500,
    margin: 0,
    lineHeight: 1.5,
  },

  // Empty & Loading
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '40px 20px',
  },

  emptyText: {
    fontSize: '14px',
    color: colors.gray500,
    margin: 0,
  },

  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },

  spinner: {
    width: '36px',
    height: '36px',
    border: `3px solid ${colors.gray200}`,
    borderTopColor: colors.primary,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  loadingText: {
    fontSize: '15px',
    color: colors.gray600,
    margin: 0,
  },

  // Error
  errorCard: {
    backgroundColor: colors.white,
    borderRadius: '14px',
    padding: '40px',
    textAlign: 'center',
    maxWidth: '420px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },

  errorIconWrap: {
    display: 'flex',
    justifyContent: 'center',
    color: colors.error,
    marginBottom: '16px',
  },

  errorTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: colors.gray900,
    margin: '0 0 8px 0',
  },

  errorText: {
    fontSize: '14px',
    color: colors.gray600,
    margin: '0 0 24px 0',
    lineHeight: 1.5,
  },
};

// Inject spinner keyframes
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
if (!document.querySelector('[data-verification-styles]')) {
  styleSheet.setAttribute('data-verification-styles', 'true');
  document.head.appendChild(styleSheet);
}

export default VerificationPage;
