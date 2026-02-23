import React, { useState } from 'react';

const Documents = () => {
  const [activeTab, setActiveTab] = useState('published');
  const [searchTerm, setSearchTerm] = useState('');

  const documents = {
    published: [
      { id: 1, name: 'Service Agreement', signers: 2, status: 'pending', created: '2024-02-15' },
      { id: 2, name: 'Proposal Document', signers: 1, status: 'signed', created: '2024-02-10' },
      { id: 3, name: 'Contract Template', signers: 3, status: 'pending', created: '2024-02-05' },
    ],
    assigned: [
      { id: 4, name: 'Employment Contract', signers: 1, status: 'pending', created: '2024-02-20', dueDate: '2024-02-27' },
      { id: 5, name: 'Lease Agreement', signers: 2, status: 'pending', created: '2024-02-18', dueDate: '2024-02-25' },
    ],
    draft: [
      { id: 6, name: 'NDA Document', signers: 0, status: 'draft', created: '2024-02-20' },
    ]
  };

  const getCurrentDocuments = () => {
    return documents[activeTab].filter(doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="documents-container">
      <div className="documents-header">
        <h1>Documents</h1>
        <button className="upload-doc-btn">📤 Upload Document</button>
      </div>

      {/* Tab Navigation */}
      <div className="documents-tabs">
        <button
          className={`tab ${activeTab === 'published' ? 'active' : ''}`}
          onClick={() => setActiveTab('published')}
        >
          Published Documents ({documents.published.length})
        </button>
        <button
          className={`tab ${activeTab === 'assigned' ? 'active' : ''}`}
          onClick={() => setActiveTab('assigned')}
        >
          Assigned to Sign ({documents.assigned.length})
        </button>
        <button
          className={`tab ${activeTab === 'draft' ? 'active' : ''}`}
          onClick={() => setActiveTab('draft')}
        >
          Draft Documents ({documents.draft.length})
        </button>
      </div>

      {/* Search */}
      <div className="documents-search">
        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Documents Table */}
      <div className="documents-table-wrapper">
        <table className="documents-table">
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Signers</th>
              <th>Status</th>
              <th>Created</th>
              {activeTab === 'assigned' && <th>Due Date</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {getCurrentDocuments().length > 0 ? (
              getCurrentDocuments().map(doc => (
                <tr key={doc.id} className={`doc-row ${doc.status}`}>
                  <td className="doc-name">
                    <span className="doc-icon">📄</span>
                    {doc.name}
                  </td>
                  <td>{doc.signers}</td>
                  <td>
                    <span className={`status-badge ${doc.status}`}>
                      {doc.status === 'signed' ? '✓ Signed' : doc.status === 'pending' ? '⏳ Pending' : 'Draft'}
                    </span>
                  </td>
                  <td>{new Date(doc.created).toLocaleDateString()}</td>
                  {activeTab === 'assigned' && <td>{doc.dueDate && new Date(doc.dueDate).toLocaleDateString()}</td>}
                  <td className="doc-actions">
                    {activeTab === 'assigned' ? (
                      <a href={`/document-sign/${doc.id}`} className="action-btn sign">Sign</a>
                    ) : (
                      <>
                        <a href={`/documents/${doc.id}`} className="action-btn">View</a>
                        <a href={`/documents/${doc.id}/share`} className="action-btn">Share</a>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-row">
                  <p>No {activeTab} documents found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Documents;
