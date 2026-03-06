import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DocumentUploader from '../../components/Documents/DocumentUploader';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiFileText, FiCheck, FiClock, FiUpload } from 'react-icons/fi';

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

  // Fetch documents on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  /**
   * Fetch both user documents and assigned documents
   */
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch user's own documents (draft, published, etc.)
      const docsResponse = await api.get('/documents');
      if (docsResponse.data.success || docsResponse.data.documents) {
        const docs = docsResponse.data.documents || docsResponse.data.data || [];
        setAllDocuments(docs);
      }

      // Fetch documents assigned to user for signing
      try {
        const assignedResponse = await api.get('/documents/assigned');
        if (assignedResponse.data.success || assignedResponse.data.documents) {
          const assigned = assignedResponse.data.documents || assignedResponse.data.data || [];
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
    if (status === 'fully_signed') return 'signed';
    if (status === 'draft') return 'draft';
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
          <button
            style={documentsStyles.uploadButton}
            onClick={() => setShowUploadModal(true)}
            onMouseOver={(e) => {
              e.target.style.opacity = '0.9';
            }}
            onMouseOut={(e) => {
              e.target.style.opacity = '1';
            }}
          >
            <FiUpload style={{ display: 'inline', marginRight: '6px' }} /> Upload Document
          </button>
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
        </div>

        {/* Search */}
        <div style={documentsStyles.searchContainer}>
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
                {activeTab === 'assigned' && <th style={documentsStyles.th}>Progress</th>}
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
                          doc.owner_id || 'Unknown'
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
                      {activeTab === 'assigned' && (
                        <td style={documentsStyles.td}>
                          {doc.progress !== undefined ? (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                flex: 1,
                                height: '6px',
                                backgroundColor: colors.gray200,
                                borderRadius: '3px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${doc.progress}%`,
                                  backgroundColor: doc.progress === 100 ? colors.green : colors.secondary,
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                              <span style={{
                                fontSize: '12px',
                                fontWeight: '500',
                                minWidth: '35px',
                                color: doc.progress === 100 ? colors.green : colors.gray700
                              }}>
                                {doc.progress}%
                              </span>
                            </div>
                          ) : (
                            doc.dueDate && new Date(doc.dueDate).toLocaleDateString()
                          )}
                        </td>
                      )}
                      <td style={documentsStyles.td}>
                        <div style={documentsStyles.actions}>
                          {activeTab === 'assigned' ? (
                            <a
                              href={`/document-sign/${doc._id || doc.id}`}
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
                          ) : (
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
                              <a
                                href={`/documents/${doc._id || doc.id}/share`}
                                style={documentsStyles.actionButton}
                                onMouseOver={(e) => {
                                  e.target.style.backgroundColor =
                                    colors.primaryVeryLight;
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.backgroundColor = 'transparent';
                                }}
                              >
                                Share
                              </a>
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
    </div>
  );
};

export default Documents;
