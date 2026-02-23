import React, { useState } from 'react';

const Forms = () => {
  const [activeTab, setActiveTab] = useState('published');
  const [searchTerm, setSearchTerm] = useState('');

  const forms = {
    published: [
      { id: 1, name: 'Contact Form', responses: 8, created: '2024-02-15', status: 'active' },
      { id: 2, name: 'Feedback Survey', responses: 12, created: '2024-02-10', status: 'active' },
      { id: 3, name: 'Registration Form', responses: 5, created: '2024-02-05', status: 'active' },
    ],
    draft: [
      { id: 4, name: 'New Inquiry Form', responses: 0, created: '2024-02-20', status: 'draft' },
      { id: 5, name: 'Application Form', responses: 0, created: '2024-02-18', status: 'draft' },
    ]
  };

  const getCurrentForms = () => {
    return forms[activeTab].filter(form =>
      form.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="forms-container">
      <div className="forms-header">
        <h1>Forms</h1>
        <button className="create-form-btn">+ Create New Form</button>
      </div>

      {/* Tab Navigation */}
      <div className="forms-tabs">
        <button
          className={`tab ${activeTab === 'published' ? 'active' : ''}`}
          onClick={() => setActiveTab('published')}
        >
          Published Forms ({forms.published.length})
        </button>
        <button
          className={`tab ${activeTab === 'draft' ? 'active' : ''}`}
          onClick={() => setActiveTab('draft')}
        >
          Draft Forms ({forms.draft.length})
        </button>
      </div>

      {/* Search */}
      <div className="forms-search">
        <input
          type="text"
          placeholder="Search forms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Forms Grid */}
      <div className="forms-grid">
        {getCurrentForms().length > 0 ? (
          getCurrentForms().map(form => (
            <div key={form.id} className="form-card">
              <div className="form-card-header">
                <h3>{form.name}</h3>
                <div className="form-menu">
                  <button className="menu-btn">⋯</button>
                </div>
              </div>

              <div className="form-card-content">
                <div className="form-stat">
                  <span className="stat-label">Responses</span>
                  <span className="stat-value">{form.responses}</span>
                </div>
                <div className="form-stat">
                  <span className="stat-label">Created</span>
                  <span className="stat-value">{new Date(form.created).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="form-card-footer">
                <a href={`/forms/${form.id}`} className="form-action">View Details</a>
                <a href={`/form-builder/${form.id}`} className="form-action edit">
                  {activeTab === 'draft' ? 'Edit' : 'Duplicate'}
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No {activeTab} forms found</p>
            {activeTab === 'published' && (
              <button className="create-form-btn">Create your first form</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Forms;
