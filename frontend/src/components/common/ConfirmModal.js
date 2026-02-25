import React from 'react';
import './ConfirmModal.css';

/**
 * ConfirmModal Component
 * Reusable confirmation dialog with themed styling
 */
const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="modal-close-btn"
            onClick={onCancel}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p>{message}</p>
        </div>

        <div className="modal-footer">
          <button
            className="modal-btn modal-btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`modal-btn modal-btn-confirm ${isDangerous ? 'modal-btn-danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
