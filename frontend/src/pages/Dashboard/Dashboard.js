import React, { useState } from 'react';

const Dashboard = () => {
  const [user] = useState({
    name: 'John Doe',
    email: 'john@example.com'
  });

  // Sample data
  const stats = {
    publishedForms: 5,
    draftForms: 2,
    publishedDocuments: 8,
    assignedDocuments: 3,
    draftDocuments: 1,
    formResponses: 24,
    pendingSignatures: 3
  };

  const recentForms = [
    { id: 1, name: 'Contact Form', responses: 8, created: '2 days ago' },
    { id: 2, name: 'Feedback Survey', responses: 12, created: '1 week ago' },
  ];

  const recentDocuments = [
    { id: 1, name: 'Service Agreement', signers: 2, status: 'pending', created: '3 days ago' },
    { id: 2, name: 'Proposal Document', signers: 1, status: 'signed', created: '1 week ago' },
  ];

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <h1>Welcome back, {user.name}!</h1>
        <p>Manage your forms and documents in one place</p>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn primary-btn">
          <span className="icon">+</span>
          <span className="text">Create Form</span>
        </button>
        <button className="action-btn secondary-btn">
          <span className="icon">📄</span>
          <span className="text">Upload Document</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Forms Section */}
        <div className="stats-section forms-section">
          <h2>Forms</h2>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-number">{stats.publishedForms}</div>
              <div className="stat-label">Published Forms</div>
              <a href="/forms?filter=published" className="stat-link">View all →</a>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.draftForms}</div>
              <div className="stat-label">Draft Forms</div>
              <a href="/forms?filter=draft" className="stat-link">View all →</a>
            </div>
            <div className="stat-card accent">
              <div className="stat-number">{stats.formResponses}</div>
              <div className="stat-label">Total Responses</div>
              <a href="/forms/responses" className="stat-link">View responses →</a>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="stats-section documents-section">
          <h2>Documents</h2>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-number">{stats.publishedDocuments}</div>
              <div className="stat-label">Published Documents</div>
              <a href="/documents?filter=published" className="stat-link">View all →</a>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.assignedDocuments}</div>
              <div className="stat-label">Assigned to Sign</div>
              <a href="/documents?filter=assigned" className="stat-link">Sign now →</a>
            </div>
            <div className="stat-card accent">
              <div className="stat-number">{stats.draftDocuments}</div>
              <div className="stat-label">Draft Documents</div>
              <a href="/documents?filter=draft" className="stat-link">View all →</a>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <div className="activity-column">
          <h3>Recent Forms</h3>
          <div className="activity-list">
            {recentForms.map(form => (
              <div key={form.id} className="activity-item form-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <div className="activity-title">{form.name}</div>
                  <div className="activity-meta">{form.responses} responses · {form.created}</div>
                </div>
                <a href={`/forms/${form.id}`} className="activity-action">Open →</a>
              </div>
            ))}
          </div>
        </div>

        <div className="activity-column">
          <h3>Recent Documents</h3>
          <div className="activity-list">
            {recentDocuments.map(doc => (
              <div key={doc.id} className="activity-item document-item">
                <div className="activity-icon">📄</div>
                <div className="activity-content">
                  <div className="activity-title">{doc.name}</div>
                  <div className="activity-meta">
                    {doc.signers} signer{doc.signers > 1 ? 's' : ''} · 
                    <span className={`status ${doc.status}`}>{doc.status}</span> · {doc.created}
                  </div>
                </div>
                <a href={`/documents/${doc.id}`} className="activity-action">View →</a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Actions Alert */}
      {stats.pendingSignatures > 0 && (
        <div className="pending-alert">
          <div className="alert-content">
            <strong>⚠️ {stats.pendingSignatures} documents waiting for your signature</strong>
            <p>Sign them now to keep your work up to date</p>
          </div>
          <a href="/documents?filter=assigned" className="alert-action">
            View Pending Signatures →
          </a>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
