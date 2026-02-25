import React, { useState } from 'react';
import axios from 'axios';
import './DocumentUploader.css';

const DocumentUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf'];
      const fileType = selectedFile.type;

      if (!allowedTypes.includes(fileType)) {
        setError('Only PDF files are allowed');
        setFile(null);
        setPreviewFileName('');
        return;
      }

      // Validate file size (50MB max)
      const maxSize = 52428800; // 50MB in bytes
      if (selectedFile.size > maxSize) {
        setError('File size must not exceed 50MB');
        setFile(null);
        setPreviewFileName('');
        return;
      }

      setFile(selectedFile);
      setPreviewFileName(selectedFile.name);
      setError('');
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleClearForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setPreviewFileName('');
    setError('');
    setSuccess('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    // Validation
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a document title');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());

      const response = await axios.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(`Document "${title}" uploaded successfully!`);
      handleClearForm();

      // Notify parent component of successful upload
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed';
      setError(`Upload error: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-uploader">
      <div className="uploader-container">
        <h2>Upload Document</h2>

        {error && <div className="uploader-alert error">{error}</div>}
        {success && <div className="uploader-alert success">{success}</div>}

        <form onSubmit={handleUpload} className="uploader-form">
          {/* File Input */}
          <div className="form-group">
            <label htmlFor="file-input" className="file-label">
              Select PDF File
            </label>
            <div className="file-input-wrapper">
              <input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                accept=".pdf"
                disabled={uploading}
                className="file-input"
              />
              <span className="file-name">
                {previewFileName || 'No file selected'}
              </span>
            </div>
            <p className="file-hint">PDF only, max 50MB</p>
          </div>

          {/* Title Input */}
          <div className="form-group">
            <label htmlFor="title-input">Document Title *</label>
            <input
              id="title-input"
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Enter document title"
              disabled={uploading}
              maxLength={100}
              className="form-input"
            />
          </div>

          {/* Description Input */}
          <div className="form-group">
            <label htmlFor="description-input">Description</label>
            <textarea
              id="description-input"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Enter optional document description"
              disabled={uploading}
              maxLength={500}
              rows={4}
              className="form-textarea"
            />
            <p className="char-count">{description.length}/500</p>
          </div>

          {/* Action Buttons */}
          <div className="button-group">
            <button
              type="submit"
              disabled={uploading || !file || !title.trim()}
              className="btn btn-primary"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
            <button
              type="button"
              onClick={handleClearForm}
              disabled={uploading}
              className="btn btn-secondary"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploader;
