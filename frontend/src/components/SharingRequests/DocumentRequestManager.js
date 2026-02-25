import React, { useState, useEffect } from 'react';
import './DocumentRequestManager.css';

const DocumentRequestManager = ({ documentId, documentTitle, onClose }) => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [documentId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `/api/signing-requests/documents/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch signing requests');
      }

      const data = await response.json();
      setRequests(data.data.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `/api/signing-requests/documents/${documentId}/stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const handleRevoke = async (requestId) => {
    if (!window.confirm('Are you sure you want to revoke this signing request?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/signing-requests/${requestId}/revoke`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to revoke request');
      }

      // Update state
      setRequests(requests.map(r =>
        r._id === requestId ? { ...r, status: 'revoked' } : r
      ));

      await fetchStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendReminder = async (requestId, recipientEmail) => {
    try {
      const response = await fetch(
        `/api/signing-requests/${requestId}/remind`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send reminder');
      }

      const data = await response.json();
      // Update state
      setRequests(requests.map(r =>
        r._id === requestId
          ? {
              ...r,
              reminder_sent_count: data.data.reminder_count,
              last_reminder_sent_at: data.data.last_sent_at
            }
          : r
      ));

      alert(`Reminder sent to ${recipientEmail}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const getFilteredRequests = () => {
    if (activeTab === 'all') return requests;
    return requests.filter(r => r.status === activeTab);
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      accepted: '✓',
      declined: '✗',
      revoked: '🚫',
      expired: '⏰'
    };
    return icons[status] || '?';
  };

  const getTimeRemaining = (expirationDate) => {
    const expires = new Date(expirationDate);
    const now = new Date();
    const diff = expires - now;

    if (diff < 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return 'Expires soon';
  };

  const filteredRequests = getFilteredRequests();

  return (
    <div className="request-manager-container">
      <div className="manager-header">
        <h2>Manage Signing Requests</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-card pending-color">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card accepted-color">
            <div className="stat-number">{stats.accepted}</div>
            <div className="stat-label">Accepted</div>
          </div>
          <div className="stat-card declined-color">
            <div className="stat-number">{stats.declined}</div>
            <div className="stat-label">Declined</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.completion_percentage}%</div>
            <div className="stat-label">Complete</div>
          </div>
        </div>
      )}

      <div className="manager-tabs">
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({requests.length})
        </button>
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={`tab ${activeTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setActiveTab('accepted')}
        >
          Accepted ({requests.filter(r => r.status === 'accepted').length})
        </button>
        <button
          className={`tab ${activeTab === 'declined' ? 'active' : ''}`}
          onClick={() => setActiveTab('declined')}
        >
          Declined ({requests.filter(r => r.status === 'declined').length})
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="empty-state">
          <p>No {activeTab !== 'all' ? activeTab : ''} requests</p>
        </div>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Recipient Email</th>
                <th>Status</th>
                <th>Sent Date</th>
                <th>Expires</th>
                <th>Reminders</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(request => (
                <tr key={request._id} className={`row-${request.status}`}>
                  <td className="email-cell">{request.recipient_email}</td>
                  <td className="status-cell">
                    <span className={`badge status-${request.status}`}>
                      {getStatusIcon(request.status)} {request.status}
                    </span>
                  </td>
                  <td className="date-cell">
                    {new Date(request.created_at).toLocaleDateString()}
                  </td>
                  <td className="expiry-cell">
                    <span className={request.status === 'pending' ? 'expiry-text' : ''}>
                      {request.status === 'pending'
                        ? getTimeRemaining(request.expiration_date)
                        : new Date(request.expiration_date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="reminders-cell">
                    {request.reminder_sent_count > 0 && (
                      <span className="reminder-badge">{request.reminder_sent_count}</span>
                    )}
                    {request.status === 'pending' && (
                      <button
                        className="btn-icon"
                        onClick={() => handleSendReminder(request._id, request.recipient_email)}
                        title="Send reminder"
                      >
                        📧
                      </button>
                    )}
                  </td>
                  <td className="actions-cell">
                    {request.status === 'pending' && (
                      <button
                        className="btn-revoke"
                        onClick={() => handleRevoke(request._id)}
                        title="Revoke request"
                      >
                        Revoke
                      </button>
                    )}
                    {request.status !== 'pending' && (
                      <span className="status-final">✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="manager-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default DocumentRequestManager;
