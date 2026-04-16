import React, { useState } from 'react';
import DocumentUploader from '../../components/Documents/DocumentUploader';
import DocumentList from '../../components/Documents/DocumentList';
import './DocumentsPage.css';


import { LuClipboardCheck, LuFileText, LuLock, LuPenTool, LuScroll } from 'react-icons/lu';

const DocumentsPage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('list');

  /**
   * Handle successful document upload
   * Triggers refresh of document list
   */
  const handleUploadSuccess = (newDocument) => {
    // Trigger refresh of document list
    setRefreshTrigger(prev => prev + 1);
    // Switch to list tab to show the new document
    setTimeout(() => {
      setActiveTab('list');
    }, 1000);
  };

  return (
    <div className="documents-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Document Management</h1>
          <p className="subtitle">
            Upload, manage, and prepare your documents for digital signing
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <ul className="tab-list">
          <li>
            <button
              className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              <span className="tab-icon"><LuClipboardCheck /></span>
              My Documents
            </button>
          </li>
          <li>
            <button
              className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <span className="tab-icon">⬆️</span>
              Upload Document
            </button>
          </li>
        </ul>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Documents List Tab */}
        {activeTab === 'list' && (
          <div className="tab-pane active">
            <DocumentList refreshTrigger={refreshTrigger} />
          </div>
        )}

        {/* Upload Document Tab */}
        {activeTab === 'upload' && (
          <div className="tab-pane active">
            <DocumentUploader onUploadSuccess={handleUploadSuccess} />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="info-section">
        <div className="info-card">
          <div className="info-icon"><LuFileText /></div>
          <h3>Supported Formats</h3>
          <p>PDF documents up to 50MB</p>
        </div>

        <div className="info-card">
          <div className="info-icon"><LuLock /></div>
          <h3>Secure Storage</h3>
          <p>Files are encrypted and backed up securely</p>
        </div>

        <div className="info-card">
          <div className="info-icon"><LuPenTool /></div>
          <h3>Easy Signing</h3>
          <p>Add multiple signers and track their progress</p>
        </div>

        <div className="info-card">
          <div className="info-icon"><LuScroll /></div>
          <h3>Audit Trail</h3>
          <p>Complete history of all document activities</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
