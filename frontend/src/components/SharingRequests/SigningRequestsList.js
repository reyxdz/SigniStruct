import React, { useState, useEffect } from 'react';
import './SigningRequestsList.css';


import { LuHourglass, LuCheck, LuX, LuClock, LuMailbox } from 'react-icons/lu';

const SigningRequestsList = ({ onRequestAction }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, accepted, declined

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/signing-requests/my-requests', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch signing requests');
      }

      const data = await response.json();
      setRequests(data.data.requests || []);
    } catch (err) {
      setError(err.message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      const response = await fetch(
        `/api/signing-requests/${requestId}/accept`,
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
        throw new Error(errorData.message || 'Failed to accept request');
      }

      // Update local state
      setRequests(requests.map(r => 
        r._id === requestId ? { ...r, status: 'accepted' } : r
      ));

      onRequestAction?.('accept', requestId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDecline = async (requestId) => {
    const reason = prompt('Please provide a reason for declining (optional):');
    if (reason === null) return; // User cancelled

    try {
      const response = await fetch(
        `/api/signing-requests/${requestId}/decline`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ reason })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to decline request');
      }

      // Update local state
      setRequests(requests.map(r => 
        r._id === requestId ? { ...r, status: 'declined' } : r
      ));

      onRequestAction?.('decline', requestId);
    } catch (err) {
      alert(err.message);
    }
  };

  const getFilteredRequests = () => {
    if (filter === 'all') return requests;
    return requests.filter(r => r.status === filter);
  };

  const filteredRequests = getFilteredRequests();

  const now = new Date();
  const getTimeRemaining = (expirationDate) => {
    const expires = new Date(expirationDate);
    const diff = expires - now;
    
    if (diff < 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Expires soon';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', icon: <LuHourglass /> },
      accepted: { label: 'Accepted', icon: <LuCheck /> },
      declined: { label: 'Declined', icon: <LuX /> },
      expired: { label: 'Expired', icon: <LuClock /> }
    };
    return statusConfig[status] || { label: status, icon: '?' };
  };

  if (loading) {
    return (
      <div className="signing-requests-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading signing requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="signing-requests-container">
      <div className="requests-header">
        <h2>Signing Requests</h2>
        <button className="refresh-btn" onClick={fetchRequests} title="Refresh">
          ↻
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filter-tabs">
        <button
          className={`tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({requests.length})
        </button>
        <button
          className={`tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={`tab ${filter === 'accepted' ? 'active' : ''}`}
          onClick={() => setFilter('accepted')}
        >
          Accepted ({requests.filter(r => r.status === 'accepted').length})
        </button>
        <button
          className={`tab ${filter === 'declined' ? 'active' : ''}`}
          onClick={() => setFilter('declined')}
        >
          Declined ({requests.filter(r => r.status === 'declined').length})
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><LuMailbox /></div>
          <p>No {filter !== 'all' ? filter : ''} requests</p>
          <small>Check back later for signing requests from document owners</small>
        </div>
      ) : (
        <div className="requests-list">
          {filteredRequests.map(request => {
            const statusInfo = getStatusBadge(request.status);
            const canRespond = request.status === 'pending';

            return (
              <div key={request._id} className={`request-card status-${request.status}`}>
                <div className="request-header">
                  <div className="request-title-section">
                    <h3 className="request-title">{request.document_id.title}</h3>
                    <span className={`status-badge status-${request.status}`}>
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>
                  <div className="request-sender">
                    <p className="sender-name">{request.sender_id.full_name || 'User'}</p>
                    <p className="sender-email">{request.sender_id.email}</p>
                  </div>
                </div>

                {request.message && (
                  <div className="request-message">
                    <p>{request.message}</p>
                  </div>
                )}

                <div className="request-details">
                  <div className="detail-item">
                    <span className="detail-label">Expires:</span>
                    <span className="detail-value">
                      {request.status === 'pending' 
                        ? getTimeRemaining(request.expiration_date)
                        : new Date(request.expiration_date).toLocaleDateString()}
                    </span>
                  </div>
                  {request.accepted_at && (
                    <div className="detail-item">
                      <span className="detail-label">Accepted:</span>
                      <span className="detail-value">
                        {new Date(request.accepted_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {request.declined_at && (
                    <div className="detail-item">
                      <span className="detail-label">Declined:</span>
                      <span className="detail-value">
                        {new Date(request.declined_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {canRespond && (
                  <div className="request-actions">
                    <button
                      className="btn btn-accept"
                      onClick={() => handleAccept(request._id)}
                    >
                      Accept & Sign
                    </button>
                    <button
                      className="btn btn-decline"
                      onClick={() => handleDecline(request._id)}
                    >
                      Decline
                    </button>
                  </div>
                )}

                {request.status === 'pending' && new Date(request.expiration_date) < new Date() && (
                  <div className="alert alert-warning">
                    This request has expired
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SigningRequestsList;
