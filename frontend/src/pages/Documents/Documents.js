import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import DocumentUploader from '../../components/Documents/DocumentUploader';
import CertificateManagementPage from '../Certificate/CertificateManagementPage';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiFileText, FiCheck, FiClock, FiUpload, FiShield, FiDownload, FiSearch, FiCheckCircle, FiAlertCircle, FiX, FiTrash2, FiEdit } from 'react-icons/fi';
import { useToast } from '../../contexts/ToastContext';

/**
 * Documents Page
 * Displays user's documents with filtering and search capabilities
 */
const Documents = () => {
  const [activeTab, setActiveTab] = useState('published');
  const [searchTerm, setSearchTerm] = useState('');
  const [allDocuments, setAllDocuments] = useState([]);
  const [assignedDocuments, setAssignedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [assignedFilter, setAssignedFilter] = useState('all');
  const verifyFileRef = useRef(null);
  const { toast, confirm } = useToast();

  // Fetch documents on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Refresh documents when page becomes visible (e.g., returning from signing)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📄 Documents page became visible - refreshing data');
        fetchAllData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  /**
   * Fetch both user documents and assigned documents
   */
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching all documents...');
      
      // Fetch user's own documents (draft, published, etc.)
      const docsResponse = await api.get('/documents');
      if (docsResponse.data.success || docsResponse.data.documents) {
        const docs = docsResponse.data.documents || docsResponse.data.data || [];
        console.log('  ✅ User documents fetched:', docs.length);
        setAllDocuments(docs);
      }

      // Fetch documents assigned to user for signing
      try {
        const assignedResponse = await api.get('/documents/assigned');
        if (assignedResponse.data.success || assignedResponse.data.documents) {
          const assigned = assignedResponse.data.documents || assignedResponse.data.data || [];
          console.log('  ✅ Assigned documents fetched:', assigned.length);
          assigned.forEach(doc => {
            console.log(`     "${doc.title}": signingStatus=${doc.signingStatus}`);
          });
          setAssignedDocuments(assigned);
        }
      } catch (assignedErr) {
        console.error('Failed to fetch assigned documents:', assignedErr);
        // Don't fail entire load if assigned endpoint fails
        setAssignedDocuments([]);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError('Failed to load documents');
      setAllDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter documents by status and search term
   */
  const getFilteredDocuments = () => {
    let filtered = [];

    // Use different source depending on tab
    if (activeTab === 'assigned') {
      // Show documents assigned to user for signing
      filtered = assignedDocuments;

      // Apply status filter
      if (assignedFilter === 'signed') {
        filtered = filtered.filter(doc => doc.signingStatus === 'signed');
      } else if (assignedFilter === 'unsigned') {
        filtered = filtered.filter(doc => doc.signingStatus !== 'signed');
      }
    } else if (activeTab === 'published') {
      // Show documents published by user
      filtered = allDocuments.filter(doc => 
        doc.status && ['fully_signed', 'partially_signed', 'pending_signature'].includes(doc.status)
      );
    } else if (activeTab === 'draft') {
      // Show user's draft documents
      filtered = allDocuments.filter(doc => 
        doc.status === 'draft'
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  /**
   * Get signer count for a document
   */
  const getSignerCount = (doc) => {
    return doc.signers?.length || 0;
  };

  /**
   * Get document status display
   */
  const getStatusDisplay = (status) => {
    const statusMap = {
      draft: 'Draft',
      pending_signature: 'Pending',
      partially_signed: 'Partially Signed',
      fully_signed: 'Signed',
      archived: 'Archived'
    };
    return statusMap[status] || status;
  };

  /**
   * Get document status for styling
   */
  const getStatusType = (status) => {
    console.log(`  🔍 getStatusType: mapping "${status}"`);
    if (status === 'fully_signed' || status === 'signed') {
      console.log(`     → mapped to "signed"`);
      return 'signed';
    }
    if (status === 'draft') {
      console.log(`     → mapped to "draft"`);
      return 'draft';
    }
    console.log(`     → mapped to "pending"`);
    return 'pending';
  };

  /**
   * Count documents by category
   */
  const getDocumentCount = (category) => {
    if (category === 'published') {
      return allDocuments.filter(doc => {
        return doc.status && ['fully_signed', 'partially_signed', 'pending_signature'].includes(doc.status);
      }).length;
    } else if (category === 'assigned') {
      return assignedDocuments.length;
    } else if (category === 'draft') {
      return allDocuments.filter(doc => {
        return doc.status === 'draft';
      }).length;
    }
    return 0;
  };

  /**
   * Handle successful document upload
   */
  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    fetchAllData(); // Refresh all documents
  };

  /**
   * Download signed PDF with embedded certificates
   */
  const handleDownload = async (docId, docTitle) => {
    try {
      setDownloadingId(docId);
      const response = await api.get(`/documents/${docId}/download-signed`, {
        responseType: 'blob'
      });

      // Create blob and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${docTitle}_signed.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download document. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  /**
   * Handle Upload & Verify file selection
   */
  const handleVerifyUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.warning('Please upload a PDF file.');
      return;
    }

    try {
      setVerifyLoading(true);
      setVerifyResult(null);
      setShowVerifyModal(true);

      const formData = new FormData();
      formData.append('document', file);

      const response = await api.post('/verification/verify-uploaded', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setVerifyResult(response.data.data);
      } else {
        setVerifyResult({ error: response.data.message || 'Verification failed' });
      }
    } catch (err) {
      console.error('Verify upload error:', err);
      setVerifyResult({ error: err.response?.data?.message || 'Failed to verify document' });
    } finally {
      setVerifyLoading(false);
      // Reset file input
      if (verifyFileRef.current) verifyFileRef.current.value = '';
    }
  };

  /**
   * Delete a draft document
   */
  const handleDelete = async (docId, docTitle) => {
    const confirmed = await confirm(`Are you sure you want to delete "${docTitle}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }
    try {
      await api.delete(`/documents/${docId}`);
      fetchAllData(); // Refresh list
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.error || 'Failed to delete document.');
    }
  };

  const documentsStyles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.lightGray,
      padding: `${spacing.xl} ${spacing['2xl']}`,
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing['3xl'],
    },
    title: {
      fontSize: typography.sizes['3xl'],
      fontWeight: typography.weights.bold,
      color: colors.gray900,
    },
    uploadButton: {
      backgroundColor: colors.secondary,
      color: colors.white,
      padding: `${spacing.sm} ${spacing.lg}`,
      border: 'none',
      borderRadius: borderRadius.md,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      cursor: 'pointer',
      transition: transitions.fast,
    },
    tabs: {
      display: 'flex',
      gap: spacing.lg,
      marginBottom: spacing.xl,
      borderBottom: `2px solid ${colors.gray200}`,
    },
    tab: {
      background: 'none',
      border: 'none',
      padding: `${spacing.md} 0`,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.gray600,
      cursor: 'pointer',
      transition: transitions.fast,
      borderBottom: `3px solid transparent`,
      marginBottom: '-2px',
    },
    tabActive: {
      color: colors.secondary,
      borderBottom: `3px solid ${colors.secondary}`,
    },
    searchContainer: {
      marginBottom: spacing.xl,
    },
    searchInput: {
      width: '100%',
      maxWidth: '400px',
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: typography.sizes.sm,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      backgroundColor: colors.white,
      transition: transitions.fast,
    },
    tableWrapper: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      boxShadow: colors.shadowMd,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: typography.sizes.sm,
    },
    thead: {
      backgroundColor: colors.gray50,
      borderBottom: `2px solid ${colors.gray200}`,
    },
    th: {
      padding: spacing.md,
      textAlign: 'left',
      fontWeight: typography.weights.bold,
      color: colors.gray700,
    },
    tr: {
      borderBottom: `1px solid ${colors.gray200}`,
      transition: transitions.fast,
    },
    trHover: {
      backgroundColor: colors.gray50,
    },
    td: {
      padding: spacing.md,
      color: colors.gray700,
    },
    docName: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      fontWeight: typography.weights.medium,
      color: colors.primary,
    },
    statusBadge: {
      display: 'inline-block',
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.full,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.medium,
    },
    statusPending: {
      backgroundColor: colors.warningLight,
      color: '#B45309',
    },
    statusSigned: {
      backgroundColor: colors.successLight || '#ECFDF5',
      color: '#047857',
    },
    statusDraft: {
      backgroundColor: colors.gray100,
      color: colors.gray600,
    },
    actions: {
      display: 'flex',
      gap: spacing.sm,
    },
    actionButton: {
      padding: `${spacing.xs} ${spacing.sm}`,
      fontSize: typography.sizes.xs,
      border: `1px solid ${colors.primary}`,
      borderRadius: borderRadius.md,
      backgroundColor: 'transparent',
      color: colors.primary,
      cursor: 'pointer',
      transition: transitions.fast,
    },
    signButton: {
      backgroundColor: colors.accent,
      color: colors.white,
      border: `1px solid ${colors.accent}`,
    },
    emptyRow: {
      textAlign: 'center',
      padding: `${spacing['3xl']} ${spacing['2xl']}`,
      color: colors.gray600,
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing['2xl'],
      maxWidth: '600px',
      width: '90%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xl,
      paddingBottom: spacing.lg,
      borderBottom: `1px solid ${colors.gray200}`,
    },
    modalTitle: {
      fontSize: typography.sizes['2xl'],
      fontWeight: typography.weights.bold,
      color: colors.gray900,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: colors.gray600,
      padding: 0,
    },
  };

  return (
    <div style={documentsStyles.container}>
      <div style={documentsStyles.content}>
        {/* Header */}
        <div style={documentsStyles.header}>
          <h1 style={documentsStyles.title}><FiFileText style={{ display: 'inline', marginRight: '12px' }} /> Documents</h1>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <button
              style={{
                ...documentsStyles.uploadButton,
                backgroundColor: 'transparent',
                color: colors.secondary,
                border: `1px solid ${colors.secondary}`,
              }}
              onClick={() => verifyFileRef.current?.click()}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = colors.primaryVeryLight;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FiSearch style={{ display: 'inline', marginRight: '6px' }} /> Upload & Verify
            </button>
            <input
              type="file"
              ref={verifyFileRef}
              accept=".pdf"
              onChange={handleVerifyUpload}
              style={{ display: 'none' }}
            />
            <button
              style={documentsStyles.uploadButton}
              onClick={() => setShowUploadModal(true)}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <FiUpload style={{ display: 'inline', marginRight: '6px' }} /> Upload Document
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={documentsStyles.tabs}>
          <button
            style={{
              ...documentsStyles.tab,
              ...(activeTab === 'published' && documentsStyles.tabActive),
            }}
            onClick={() => setActiveTab('published')}
          >
            Published Documents ({getDocumentCount('published')})
          </button>
          <button
            style={{
              ...documentsStyles.tab,
              ...(activeTab === 'assigned' && documentsStyles.tabActive),
            }}
            onClick={() => setActiveTab('assigned')}
          >
            Assigned to Sign ({getDocumentCount('assigned')})
          </button>
          <button
            style={{
              ...documentsStyles.tab,
              ...(activeTab === 'draft' && documentsStyles.tabActive),
            }}
            onClick={() => setActiveTab('draft')}
          >
            Draft Documents ({getDocumentCount('draft')})
          </button>
          <button
            style={{
              ...documentsStyles.tab,
              ...(activeTab === 'certificates' && documentsStyles.tabActive),
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
            onClick={() => setActiveTab('certificates')}
          >
            <FiShield size={14} /> Certificates
          </button>
        </div>

        {/* Certificates Tab */}
        {activeTab === 'certificates' ? (
          <CertificateManagementPage />
        ) : (
        <>
        {/* Search */}
        <div style={{ ...documentsStyles.searchContainer, display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <input
            type="text"
            placeholder="🔍 Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={documentsStyles.searchInput}
            onFocus={(e) => {
              e.target.style.borderColor = colors.secondary;
              e.target.style.boxShadow = `0 0 0 3px ${colors.primaryVeryLight}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.gray300;
              e.target.style.boxShadow = 'none';
            }}
          />
          {activeTab === 'assigned' && (
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              {[{ key: 'all', label: 'All' }, { key: 'signed', label: 'Signed' }, { key: 'unsigned', label: 'Unsigned' }].map(f => (
                <button
                  key={f.key}
                  onClick={() => setAssignedFilter(f.key)}
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    fontSize: typography.sizes.xs,
                    fontWeight: assignedFilter === f.key ? typography.weights.semibold : typography.weights.medium,
                    border: `1px solid ${assignedFilter === f.key ? colors.secondary : colors.gray300}`,
                    borderRadius: borderRadius.md,
                    backgroundColor: assignedFilter === f.key ? colors.secondary : 'transparent',
                    color: assignedFilter === f.key ? colors.white : colors.gray600,
                    cursor: 'pointer',
                    transition: transitions.fast,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Documents Table */}
        <div style={documentsStyles.tableWrapper}>
          <table style={documentsStyles.table}>
            <thead style={documentsStyles.thead}>
              <tr>
                <th style={documentsStyles.th}>Document Name</th>
                <th style={documentsStyles.th}>{activeTab === 'assigned' ? 'Owner' : 'Signers'}</th>
                <th style={documentsStyles.th}>Status</th>
                <th style={documentsStyles.th}>Created</th>
                <th style={documentsStyles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && getFilteredDocuments().length > 0 ? (
                getFilteredDocuments().map(doc => {
                  // For assigned documents, use signingStatus; otherwise use status
                  const displayStatus = activeTab === 'assigned' ? doc.signingStatus : doc.status;
                  const statusType = getStatusType(displayStatus);
                  return (
                    <tr
                      key={doc._id || doc.id}
                      style={documentsStyles.tr}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = colors.gray50;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={documentsStyles.td}>
                        <div style={documentsStyles.docName}>
                          <FiFileText style={{ marginRight: '8px' }} />
                          {doc.title}
                        </div>
                      </td>
                      <td style={documentsStyles.td}>
                        {activeTab === 'assigned' ? (
                          doc.ownerName || 'Unknown'
                        ) : (
                          getSignerCount(doc)
                        )}
                      </td>
                      <td style={documentsStyles.td}>
                        <span
                          style={{
                            ...documentsStyles.statusBadge,
                            ...(statusType === 'signed'
                              ? documentsStyles.statusSigned
                              : statusType === 'pending'
                              ? documentsStyles.statusPending
                              : documentsStyles.statusDraft),
                          }}
                        >
                          {statusType === 'signed'
                            ? <><FiCheck style={{ display: 'inline', marginRight: '4px' }} /> Signed</>
                            : statusType === 'pending'
                            ? <><FiClock style={{ display: 'inline', marginRight: '4px' }} /> Pending</>
                            : 'Draft'}
                        </span>
                      </td>
                      <td style={documentsStyles.td}>
                        {new Date(doc.created_at || doc.created).toLocaleDateString()}
                      </td>
                      <td style={documentsStyles.td}>
                        <div style={documentsStyles.actions}>
                          {activeTab === 'assigned' ? (
                            <>
                              {displayStatus === 'signed' ? (
                                // Show View button for already signed documents
                                <a
                                  href={`/documents/${doc._id || doc.id}/sign/${doc.signing_token}`}
                                  style={{
                                    ...documentsStyles.actionButton,
                                    backgroundColor: colors.gray100,
                                    color: colors.gray700,
                                    border: `1px solid ${colors.gray300}`,
                                  }}
                                  onMouseOver={(e) => {
                                    e.target.style.opacity = '0.9';
                                    e.target.style.backgroundColor = colors.gray200;
                                  }}
                                  onMouseOut={(e) => {
                                    e.target.style.opacity = '1';
                                    e.target.style.backgroundColor = colors.gray100;
                                  }}
                                >
                                  View
                                </a>
                              ) : (
                                // Show Sign button for pending documents
                                <a
                                  href={`/documents/${doc._id || doc.id}/sign/${doc.signing_token}`}
                                  style={{
                                    ...documentsStyles.actionButton,
                                    ...documentsStyles.signButton,
                                  }}
                                  onMouseOver={(e) => {
                                    e.target.style.opacity = '0.9';
                                  }}
                                  onMouseOut={(e) => {
                                    e.target.style.opacity = '1';
                                  }}
                                >
                                  Sign
                                </a>
                              )}
                              {/* Verify button for assigned documents (recipients verify before signing) */}
                              <a
                                href={`/documents/${doc._id || doc.id}/verify`}
                                style={{...documentsStyles.actionButton, backgroundColor: colors.info, color: colors.white, border: `1px solid ${colors.info}`}}
                                onMouseOver={(e) => {
                                  e.target.style.opacity = '0.9';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.opacity = '1';
                                }}
                              >
                                Verify
                              </a>
                            </>
                          ) : activeTab === 'published' ? (
                            <>
                              <a
                                href={`/documents/${doc._id || doc.id}/editor`}
                                style={documentsStyles.actionButton}
                                onMouseOver={(e) => {
                                  e.target.style.backgroundColor =
                                    colors.primaryVeryLight;
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.backgroundColor = 'transparent';
                                }}
                              >
                                View
                              </a>
                              <button
                                onClick={() => handleDownload(doc._id || doc.id, doc.title)}
                                disabled={downloadingId === (doc._id || doc.id)}
                                style={{
                                  ...documentsStyles.actionButton,
                                  opacity: downloadingId === (doc._id || doc.id) ? 0.6 : 1,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                onMouseOver={(e) => {
                                  if (downloadingId !== (doc._id || doc.id))
                                    e.currentTarget.style.backgroundColor = colors.primaryVeryLight;
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <FiDownload size={12} />
                                {downloadingId === (doc._id || doc.id) ? 'Downloading...' : 'Download'}
                              </button>
                              {/* Verify button for published documents (publishers verify after signing) */}
                              <a
                                href={`/documents/${doc._id || doc.id}/verify`}
                                style={{...documentsStyles.actionButton, backgroundColor: colors.info, color: colors.white, border: `1px solid ${colors.info}`}}
                                onMouseOver={(e) => {
                                  e.target.style.opacity = '0.9';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.opacity = '1';
                                }}
                              >
                                Verify
                              </a>
                            </>
                          ) : (
                            <>
                              <a
                                href={`/documents/${doc._id || doc.id}/editor`}
                                style={{
                                  ...documentsStyles.actionButton,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    colors.primaryVeryLight;
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <FiEdit size={12} />
                                Edit
                              </a>
                              <button
                                onClick={() => handleDelete(doc._id || doc.id, doc.title)}
                                style={{
                                  ...documentsStyles.actionButton,
                                  color: colors.error,
                                  border: `1px solid ${colors.error}`,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.backgroundColor = '#FEF2F2';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <FiTrash2 size={12} />
                                Delete
                              </button>
                              {/* Draft documents: no Verify button */}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      ...documentsStyles.td,
                      ...documentsStyles.emptyRow,
                    }}
                  >
                    <p>
                      {loading
                        ? 'Loading documents...'
                        : error
                        ? `Error: ${error}`
                        : `No ${activeTab} documents found`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={documentsStyles.modalOverlay} onClick={() => setShowUploadModal(false)}>
          <div style={documentsStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={documentsStyles.modalHeader}>
              <h2 style={documentsStyles.modalTitle}>Upload Document</h2>
              <button
                style={documentsStyles.closeButton}
                onClick={() => setShowUploadModal(false)}
              >
                ✕
              </button>
            </div>
            <DocumentUploader onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>
      )}

      {/* Upload & Verify Modal */}
      {showVerifyModal && (
        <div style={documentsStyles.modalOverlay} onClick={() => { setShowVerifyModal(false); setVerifyResult(null); }}>
          <div
            style={{ ...documentsStyles.modalContent, maxWidth: '700px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={documentsStyles.modalHeader}>
              <h2 style={documentsStyles.modalTitle}>
                <FiShield style={{ display: 'inline', marginRight: '8px', color: colors.secondary }} />
                Document Verification
              </h2>
              <button
                style={documentsStyles.closeButton}
                onClick={() => { setShowVerifyModal(false); setVerifyResult(null); }}
              >
                ✕
              </button>
            </div>

            {verifyLoading ? (
              <div style={{ textAlign: 'center', padding: spacing['3xl'] }}>
                <div style={{ fontSize: '48px', marginBottom: spacing.md }}>🔍</div>
                <p style={{ color: colors.gray600, fontSize: typography.sizes.md }}>Verifying document signatures...</p>
                <p style={{ color: colors.gray400, fontSize: typography.sizes.sm, marginTop: spacing.xs }}>This may take a moment</p>
              </div>
            ) : verifyResult?.error ? (
              <div style={{ textAlign: 'center', padding: spacing['2xl'] }}>
                <FiAlertCircle size={48} style={{ color: colors.error, marginBottom: spacing.md }} />
                <p style={{ color: colors.error, fontWeight: typography.weights.semibold, fontSize: typography.sizes.lg }}>
                  Verification Error
                </p>
                <p style={{ color: colors.gray600, marginTop: spacing.sm }}>{verifyResult.error}</p>
              </div>
            ) : verifyResult ? (
              <div>
                {/* Status Banner */}
                <div style={{
                  padding: spacing.lg,
                  borderRadius: borderRadius.lg,
                  marginBottom: spacing.lg,
                  background: verifyResult.verified
                    ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                    : !verifyResult.is_signistruct_document
                    ? 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)'
                    : 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
                  color: colors.white,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                }}>
                  {verifyResult.verified ? (
                    <FiCheckCircle size={32} />
                  ) : (
                    <FiAlertCircle size={32} />
                  )}
                  <div>
                    <p style={{ fontWeight: typography.weights.bold, fontSize: typography.sizes.lg, margin: 0 }}>
                      {verifyResult.verified
                        ? 'All Signatures Verified'
                        : !verifyResult.is_signistruct_document
                        ? 'Not a SigniStruct Document'
                        : 'Verification Incomplete'}
                    </p>
                    <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: typography.sizes.sm }}>
                      {verifyResult.message || (
                        verifyResult.summary
                          ? `${verifyResult.summary.verified_signatures} of ${verifyResult.summary.total_signatures} signature(s) verified`
                          : ''
                      )}
                    </p>
                  </div>
                </div>

                {/* Document Info */}
                {verifyResult.document_info && (
                  <div style={{
                    backgroundColor: colors.gray50,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    marginBottom: spacing.lg,
                  }}>
                    <p style={{ margin: 0, fontWeight: typography.weights.semibold, color: colors.gray900 }}>
                      {verifyResult.document_info.title}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: typography.sizes.xs, color: colors.gray500 }}>
                      Document ID: {verifyResult.document_info.document_id}
                    </p>
                    {verifyResult.document_info.signed_at && (
                      <p style={{ margin: '2px 0 0 0', fontSize: typography.sizes.xs, color: colors.gray500 }}>
                        Downloaded: {new Date(verifyResult.document_info.signed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Database Match */}
                {verifyResult.database_match && (
                  <div style={{
                    padding: spacing.sm + ' ' + spacing.md,
                    borderRadius: borderRadius.md,
                    marginBottom: spacing.lg,
                    border: `1px solid ${verifyResult.database_match.found ? '#A7F3D0' : colors.gray200}`,
                    backgroundColor: verifyResult.database_match.found ? '#ECFDF5' : colors.gray50,
                    fontSize: typography.sizes.sm,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                  }}>
                    {verifyResult.database_match.found ? (
                      <>
                        <FiCheckCircle size={16} style={{ color: '#059669', flexShrink: 0 }} />
                        <span style={{ color: '#065F46' }}>
                          Document found in SigniStruct database
                          {verifyResult.database_match.hash_matches
                            ? ' — file hash matches ✓'
                            : ' — file hash does not match ⚠️'}
                        </span>
                      </>
                    ) : (
                      <>
                        <FiAlertCircle size={16} style={{ color: colors.gray500, flexShrink: 0 }} />
                        <span style={{ color: colors.gray600 }}>Document not found in this SigniStruct instance</span>
                      </>
                    )}
                  </div>
                )}

                {/* Tamper Warning */}
                {verifyResult.content_integrity?.tamper_warning && (
                  <div style={{
                    padding: spacing.md,
                    borderRadius: borderRadius.md,
                    marginBottom: spacing.lg,
                    border: '1px solid #FECACA',
                    backgroundColor: '#FEF2F2',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: spacing.sm,
                  }}>
                    <FiAlertCircle size={18} style={{ color: colors.error, flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ margin: 0, fontWeight: typography.weights.semibold, fontSize: typography.sizes.sm, color: colors.error }}>
                        ⚠️ Possible Tampering Detected
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: typography.sizes.xs, color: '#991B1B' }}>
                        {verifyResult.content_integrity.tamper_warning}
                      </p>
                    </div>
                  </div>
                )}

                {/* Signatures List */}
                {verifyResult.signatures && verifyResult.signatures.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.gray900, marginBottom: spacing.sm }}>
                      Signatures ({verifyResult.signatures.length})
                    </h3>
                    {verifyResult.signatures.map((sig, idx) => (
                      <div key={idx} style={{
                        padding: spacing.md,
                        borderRadius: borderRadius.md,
                        border: `1px solid ${colors.gray200}`,
                        borderLeft: `4px solid ${sig.signature_valid ? '#10B981' : colors.error}`,
                        marginBottom: spacing.sm,
                        backgroundColor: '#FAFBFC',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: typography.weights.semibold, color: colors.gray900, fontSize: typography.sizes.sm }}>
                              {sig.signer_name}
                            </p>
                            <p style={{ margin: '2px 0 0 0', fontSize: typography.sizes.xs, color: colors.gray500 }}>
                              {sig.signer_email}
                            </p>
                          </div>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: `${spacing.xs} ${spacing.sm}`,
                            borderRadius: borderRadius.full,
                            fontSize: typography.sizes.xs,
                            fontWeight: typography.weights.semibold,
                            backgroundColor: sig.signature_valid ? '#ECFDF5' : '#FEF2F2',
                            color: sig.signature_valid ? '#059669' : colors.error,
                          }}>
                            {sig.signature_valid ? <><FiCheck size={12} /> Verified</> : <><FiX size={12} /> Invalid</>}
                          </span>
                        </div>
                        {sig.errors && sig.errors.length > 0 && (
                          <div style={{ marginTop: spacing.sm }}>
                            {sig.errors.map((err, errIdx) => (
                              <p key={errIdx} style={{ margin: '2px 0', fontSize: typography.sizes.xs, color: colors.error }}>
                                ⚠ {err}
                              </p>
                            ))}
                          </div>
                        )}
                        {sig.certificate_info && (
                          <div style={{ marginTop: spacing.sm, fontSize: typography.sizes.xs, color: colors.gray500 }}>
                            <span>Certificate: {sig.certificate_valid ? '✓ Valid' : '✗ Invalid'}</span>
                            <span style={{ margin: '0 8px' }}>•</span>
                            <span>Algorithm: {sig.algorithm}</span>
                            {sig.signed_at && (
                              <>
                                <span style={{ margin: '0 8px' }}>•</span>
                                <span>Signed: {new Date(sig.signed_at).toLocaleString()}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
