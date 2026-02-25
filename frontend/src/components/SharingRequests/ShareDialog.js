import React, { useState } from 'react';
import './ShareDialog.css';

const ShareDialog = ({ documentId, documentTitle, onClose, onShareSuccess }) => {
  const [email, setEmail] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddRecipient = () => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check for duplicates
    if (recipients.some(r => r.email === email)) {
      setError('This email is already added');
      return;
    }

    setRecipients([...recipients, { id: Date.now(), email }]);
    setEmail('');
    setError('');
  };

  const handleRemoveRecipient = (id) => {
    setRecipients(recipients.filter(r => r.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRecipient();
    }
  };

  const handleShare = async () => {
    if (recipients.length === 0) {
      setError('Please add at least one recipient');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expirationDays));

      // Create signing requests for each recipient
      const results = [];
      for (const recipient of recipients) {
        const response = await fetch(
          `/api/signing-requests/documents/${documentId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              recipient_email: recipient.email,
              expiration_date: expirationDate.toISOString(),
              message: message
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create signing request');
        }

        const data = await response.json();
        results.push(data.data);
      }

      setSuccess(`Signing requests sent to ${recipients.length} recipient(s)`);
      
      // Clear form after success
      setTimeout(() => {
        onShareSuccess?.(results);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to share document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="share-dialog-overlay" onClick={onClose}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="share-dialog-header">
          <h2>Share Document for Signing</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="share-dialog-body">
          <div className="share-info">
            <p className="document-info">
              <strong>Document:</strong> {documentTitle}
            </p>
          </div>

          <div className="form-section">
            <label>Add Recipients</label>
            <div className="email-input-group">
              <input
                type="email"
                placeholder="Enter recipient email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <button 
                className="add-btn" 
                onClick={handleAddRecipient}
                disabled={loading}
              >
                Add
              </button>
            </div>

            {recipients.length > 0 && (
              <div className="recipients-list">
                <p className="recipients-label">Recipients ({recipients.length})</p>
                {recipients.map(recipient => (
                  <div key={recipient.id} className="recipient-item">
                    <span>{recipient.email}</span>
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveRecipient(recipient.id)}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-section">
            <label htmlFor="expiration">
              Expiration (days)
              <span className="info-icon" title="How long recipients have to sign">ⓘ</span>
            </label>
            <select
              id="expiration"
              value={expirationDays}
              onChange={(e) => setExpirationDays(e.target.value)}
              disabled={loading}
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          <div className="form-section">
            <label htmlFor="message">Message (Optional)</label>
            <textarea
              id="message"
              placeholder="Add a personal message to recipients"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
        </div>

        <div className="share-dialog-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleShare}
            disabled={loading || recipients.length === 0}
          >
            {loading ? 'Sending...' : `Share with ${recipients.length} ${recipients.length === 1 ? 'recipient' : 'recipients'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
