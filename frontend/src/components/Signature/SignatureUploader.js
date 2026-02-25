import React, { useRef, useState } from 'react';
import './SignatureUploader.css';

/**
 * SignatureUploader Component
 * Allows users to upload a pre-made signature image
 */
const SignatureUploader = ({ onSignatureComplete, onCancel }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  /**
   * Allowed file types for signature images
   */
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  /**
   * Handle file input change
   */
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setError('');
    setPreview(null);

    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a valid image file (PNG, JPG, GIF)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }

    // Store file and create preview
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle file input click
   */
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle save (after preview)
   */
  const handleSave = () => {
    if (!preview) {
      setError('Please select an image first');
      return;
    }

    onSignatureComplete(preview, 'uploaded');
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onCancel();
  };

  /**
   * Handle clear
   */
  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="signature-uploader">
      <div className="uploader-container">
        <h3>Upload Signature Image</h3>
        <p className="upload-instructions">
          Upload a PNG, JPG, or GIF image of your signature (max 5MB)
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {!preview ? (
          <div className="upload-area" onClick={handleClick}>
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <p className="upload-text">Click to upload or drag and drop</p>
            <p className="upload-subtext">PNG, JPG, GIF (max 5MB)</p>
          </div>
        ) : (
          <div className="preview-container">
            <div className="preview-header">Preview</div>
            <div className="image-preview">
              <img src={preview} alt="Signature preview" />
            </div>
            <div className="preview-info">
              <p>File: {selectedFile?.name}</p>
              <p>Size: {(selectedFile?.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="uploader-actions">
          <button
            className="btn btn-secondary"
            onClick={preview ? handleClear : handleCancel}
          >
            {preview ? 'Clear' : 'Cancel'}
          </button>
          {!preview ? (
            <button className="btn btn-primary" onClick={handleClick}>
              Choose File
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSave}>
              Use This Signature
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignatureUploader;
