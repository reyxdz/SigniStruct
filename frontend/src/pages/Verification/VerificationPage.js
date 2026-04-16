import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiArrowLeft, FiCheck, FiX, FiDownload, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

import { LuCheck, LuX, LuCircleCheck, LuCircleX } from 'react-icons/lu';

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
      link.parentChild.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download certificate');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingMessage}>Verifying document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <FiAlertCircle style={styles.errorIcon} />
          <h2 style={styles.errorTitle}>Verification Failed</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button style={styles.backButton} onClick={() => navigate('/documents')}>
            <FiArrowLeft style={{ marginRight: spacing.sm }} />
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  if (!verification) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <p style={styles.errorMessage}>No verification data available</p>
          <button style={styles.backButton} onClick={() => navigate('/documents')}>
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  const isValid = verification.is_valid;
  const statusColor = isValid ? colors.success : colors.warning;
  const statusIcon = isValid ? <FiCheckCircle style={{fontSize: '28px'}} /> : <FiAlertCircle style={{fontSize: '28px'}} />;

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <div style={styles.header}>
        <button 
          onClick={() => navigate('/documents')} 
          style={styles.backBtn}
        >
          <FiArrowLeft style={{ marginRight: spacing.sm }} />
          Back
        </button>
        <h1 style={styles.title}>Document Verification</h1>
        <button 
          style={styles.downloadBtn}
          onClick={handleDownloadCertificate}
          disabled={downloading}
        >
          <FiDownload style={{ marginRight: spacing.sm }} />
          {downloading ? 'Downloading...' : 'Download Certificate'}
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Overall Status */}
        <div style={{ ...styles.statusCard, borderLeftColor: statusColor }}>
          <div style={styles.statusHeader}>
            <div style={styles.statusIconContainer}>
              {statusIcon}
            </div>
            <div style={styles.statusInfo}>
              <h2 style={styles.statusTitle}>Verification Process Done</h2>
              <p style={styles.statusSubtitle}>
                {verification.document_title || 'Document'}
              </p>
            </div>
          </div>

          <div style={styles.statusDetails}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Overall Status:</span>
              <span style={{...styles.detailValue, color: isValid ? colors.success : colors.warning}}>
                {isValid ? <><LuCheck /> All Signatures Valid</> : `${verification.verified_count}/${verification.signature_count} Signatures Valid`}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Signatures:</span>
              <span style={styles.detailValue}>
                {verification.verified_count} of {verification.signature_count} verified
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Verification Date:</span>
              <span style={styles.detailValue}>
                {new Date(verification.timestamp || verification.verification_timestamp).toLocaleString()}
              </span>
            </div>
            {verification.details?.message && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Summary:</span>
                <span style={styles.detailValue}>{verification.details.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Document Integrity */}
        {verification.document_integrity && (
          <div style={styles.integrityCard}>
            <h3 style={styles.cardTitle}>Document Integrity</h3>
            <div style={{...styles.integrityStatus, 
              backgroundColor: verification.document_integrity.valid ? colors.successLight : colors.errorLight
            }}>
              <div style={styles.integrityStatusContent}>
                {verification.document_integrity.valid ? (
                  <>
                    <FiCheckCircle style={{ color: colors.success, fontSize: '24px' }} />
                    <div>
                      <p style={{...styles.integrityLabel, color: colors.success}}><LuCheck /> Document Intact</p>
                      <p style={styles.integrityDetails}>No tampering detected</p>
                    </div>
                  </>
                ) : (
                  <>
                    <FiX style={{ color: colors.error, fontSize: '24px' }} />
                    <div>
                      <p style={{...styles.integrityLabel, color: colors.error}}><LuX /> Document Tampered</p>
                      <p style={styles.integrityDetails}>Document content has been modified</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Signatures Breakdown */}
        <div style={styles.signaturesCard}>
          <h3 style={styles.cardTitle}>
            Signatures Breakdown ({verification.signature_count} total)
          </h3>
          <p style={styles.cardDescription}>
            {verification.signed_count !== undefined 
              ? `${verification.signed_count} signed, ${verification.unsigned_count} pending`
              : 'Shows all signatures on this document with their verification status'}
          </p>
          
          {verification.signatures && verification.signatures.length > 0 ? (
            <div>
              {/* Signed Signatures Section */}
              {verification.signatures.filter(sig => sig.is_valid || (sig.status !== 'pending')).length > 0 && (
                <div style={styles.signatureSection}>
                  <h4 style={styles.sectionTitle}><LuCircleCheck /> Signed & Verified</h4>
                  <div style={styles.signaturesList}>
                    {verification.signatures
                      .filter(sig => sig.is_valid && sig.status !== 'pending')
                      .map((sig, index) => (
                        <div key={`signed-${index}`} style={styles.signatureItem}>
                          <div style={styles.signatureHeader}>
                            <div style={{
                              ...styles.signatureBadge,
                              backgroundColor: colors.successLight
                            }}>
                              <FiCheck style={{ color: colors.success, fontSize: '20px' }} />
                            </div>
                            <div style={styles.signatureInfo}>
                              <p style={styles.signerName}>
                                {sig.signer?.email || sig.signer_email || 'Signer'}
                              </p>
                              <p style={styles.signatureFieldLabel}>
                                {sig.field_label || 'Document Signature'}
                              </p>
                            </div>
                          </div>
                          
                          <div style={styles.signatureDetails}>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Status:</span>
                              <span style={{...styles.detailValue, color: colors.success}}>
                                <><LuCheck /> Verified</>
                              </span>
                            </div>
                            {sig.signed_at && (
                              <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>Signed:</span>
                                <span style={styles.detailValue}>
                                  {new Date(sig.signed_at).toLocaleString()}
                                </span>
                              </div>
                            )}
                            {sig.certificate_valid !== undefined && (
                              <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>Certificate:</span>
                                <span style={{...styles.detailValue, color: sig.certificate_valid ? colors.success : colors.error}}>
                                  {sig.certificate_valid ? <><LuCheck /> Active</> : <><LuX /> Invalid</>}
                                </span>
                              </div>
                            )}
                            {sig.certificate_expire_date && (
                              <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>Expires:</span>
                                <span style={styles.detailValue}>
                                  {new Date(sig.certificate_expire_date).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Pending/Unsigned Signatures Section */}
              {verification.signatures.filter(sig => sig.status === 'pending' || (!sig.is_valid && sig.errors?.some(e => e.includes('not yet')))).length > 0 && (
                <div style={styles.signatureSection}>
                  <h4 style={styles.sectionTitle}>⏳ Pending Signatures</h4>
                  <div style={styles.signaturesList}>
                    {verification.signatures
                      .filter(sig => sig.status === 'pending' || (!sig.is_valid && sig.errors?.some(e => e.includes('not yet'))))
                      .map((sig, index) => (
                        <div key={`pending-${index}`} style={styles.signatureItem}>
                          <div style={styles.signatureHeader}>
                            <div style={{
                              ...styles.signatureBadge,
                              backgroundColor: colors.warningLight
                            }}>
                              <FiAlertCircle style={{ color: colors.warning, fontSize: '20px' }} />
                            </div>
                            <div style={styles.signatureInfo}>
                              <p style={styles.signerName}>
                                {sig.signer?.email || sig.signer_email || 'Pending Signature'}
                              </p>
                              <p style={styles.signatureFieldLabel}>
                                {sig.field_label || 'Awaiting Signature'}
                              </p>
                            </div>
                          </div>
                          
                          <div style={styles.signatureDetails}>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Status:</span>
                              <span style={{...styles.detailValue, color: colors.warning}}>
                                ⏳ Awaiting Signature
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Invalid Signatures Section */}
              {verification.signatures.filter(sig => !sig.is_valid && sig.status !== 'pending' && !sig.errors?.some(e => e.includes('not yet'))).length > 0 && (
                <div style={styles.signatureSection}>
                  <h4 style={styles.sectionTitle}><LuCircleX /> Invalid Signatures</h4>
                  <div style={styles.signaturesList}>
                    {verification.signatures
                      .filter(sig => !sig.is_valid && sig.status !== 'pending' && !sig.errors?.some(e => e.includes('not yet')))
                      .map((sig, index) => (
                        <div key={`invalid-${index}`} style={styles.signatureItem}>
                          <div style={styles.signatureHeader}>
                            <div style={{
                              ...styles.signatureBadge,
                              backgroundColor: colors.errorLight
                            }}>
                              <FiX style={{ color: colors.error, fontSize: '20px' }} />
                            </div>
                            <div style={styles.signatureInfo}>
                              <p style={styles.signerName}>
                                {sig.signer?.email || sig.signer_email || 'Unknown Signer'}
                              </p>
                              <p style={styles.signatureFieldLabel}>
                                {sig.field_label || 'Document Signature'}
                              </p>
                            </div>
                          </div>
                          
                          <div style={styles.signatureDetails}>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Status:</span>
                              <span style={{...styles.detailValue, color: colors.error}}>
                                <><LuX /> Invalid</>
                              </span>
                            </div>
                            {sig.signed_at && (
                              <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>Signed:</span>
                                <span style={styles.detailValue}>
                                  {new Date(sig.signed_at).toLocaleString()}
                                </span>
                              </div>
                            )}
                            {sig.errors && sig.errors.length > 0 && (
                              <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>Issues:</span>
                                <span style={{...styles.detailValue, color: colors.error}}>
                                  {sig.errors.join(' | ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={styles.noSignatures}>No signatures on this document</p>
          )}
        </div>

        {/* Document Hash */}
        {verification.document_hash && (
          <div style={styles.hashCard}>
            <h3 style={styles.cardTitle}>Document Hash (SHA-256)</h3>
            <div style={styles.hashDisplay}>
              <code style={styles.hashCode}>{verification.document_hash}</code>
            </div>
            <p style={styles.hashInfo}>
              This hash can be used to verify document authenticity and detect tampering.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Inline Styles
 */
const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: colors.lightGray,
    fontFamily: typography.fontFamily,
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing.lg} ${spacing['2xl']}`,
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.gray200}`,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },

  backBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.sizes.sm,
    cursor: 'pointer',
    transition: transitions.fast,
    color: colors.gray700,
  },

  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray900,
    margin: 0,
  },

  downloadBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    cursor: 'pointer',
    transition: transitions.fast,
  },

  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: colors.lightGray,
    padding: spacing['2xl'],
  },

  loadingMessage: {
    fontSize: typography.sizes.lg,
    color: colors.gray600,
  },

  content: {
    flex: 1,
    padding: `${spacing['2xl']} ${spacing['2xl']}`,
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
  },

  statusCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    marginBottom: spacing['2xl'],
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    borderLeft: `5px solid ${colors.success}`,
  },

  statusHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },

  statusIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    color: colors.success,
  },

  statusInfo: {
    flex: 1,
  },

  statusTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gray900,
    margin: 0,
  },

  statusSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    margin: `${spacing.xs} 0 0 0`,
  },

  statusDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: spacing.lg,
    paddingTop: spacing.lg,
    borderTop: `1px solid ${colors.gray200}`,
  },

  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  detailLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gray600,
  },

  detailValue: {
    fontSize: typography.sizes.sm,
    color: colors.gray900,
    fontWeight: typography.weights.medium,
  },

  integrityCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    marginBottom: spacing['2xl'],
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },

  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.gray900,
    marginBottom: spacing.lg,
    margin: 0,
  },

  cardDescription: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    marginBottom: spacing.lg,
    margin: `0 0 ${spacing.lg} 0`,
  },

  integrityStatus: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.successLight,
  },

  integrityStatusContent: {
    display: 'flex',
    gap: spacing.lg,
    alignItems: 'center',
  },

  integrityLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    margin: 0,
    color: colors.success,
  },

  integrityDetails: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    margin: `${spacing.xs} 0 0 0`,
  },

  signaturesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    marginBottom: spacing['2xl'],
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },

  signaturesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
  },

  signatureSection: {
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.gray700,
    margin: `0 0 ${spacing.md} 0`,
    paddingBottom: spacing.md,
    borderBottom: `2px solid ${colors.gray300}`,
  },

  signatureItem: {
    padding: spacing.lg,
    border: `1px solid ${colors.gray200}`,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray50,
  },

  signatureHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  signatureBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: colors.gray200,
    fontSize: '16px',
  },

  signatureInfo: {
    flex: 1,
  },

  signerName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.gray900,
    margin: 0,
  },

  signatureFieldLabel: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    margin: `${spacing.xs} 0 0 0`,
  },

  signatureDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTop: `1px solid ${colors.gray300}`,
  },

  noSignatures: {
    textAlign: 'center',
    color: colors.gray600,
    padding: spacing.xl,
  },

  hashCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },

  hashDisplay: {
    backgroundColor: colors.gray900,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'auto',
  },

  hashCode: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontFamily: typography.monoFamily,
    margin: 0,
    wordBreak: 'break-all',
  },

  hashInfo: {
    fontSize: typography.sizes.sm,
    color: colors.gray600,
    margin: 0,
  },

  errorBox: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    textAlign: 'center',
  },

  errorIcon: {
    fontSize: '48px',
    color: colors.error,
    marginBottom: spacing.lg,
  },

  errorTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gray900,
    margin: `0 0 ${spacing.md} 0`,
  },

  errorMessage: {
    fontSize: typography.sizes.base,
    color: colors.gray600,
    margin: `0 0 ${spacing.lg} 0`,
  },

  backButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    cursor: 'pointer',
    transition: transitions.fast,
  },
};

export default VerificationPage;
