import React, { useState } from 'react';

const DocumentSign = ({ documentId }) => {
  const [signatureType, setSignatureType] = useState('draw');
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const document = {
    id: documentId || 1,
    name: 'Employment Contract',
    owner: 'Acme Corporation',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...',
    signers: [
      { id: 1, name: 'You', email: 'your.email@example.com', status: 'pending' },
      { id: 2, name: 'John Doe', email: 'john@example.com', status: 'pending' }
    ],
    createdAt: new Date().toLocaleDateString()
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    setSignature(canvas.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const submitSignature = () => {
    alert('Document signed successfully! It will be sent to the next signer.');
  };

  return (
    <div className="document-sign">
      <div className="sign-header">
        <h1>Sign Document</h1>
        <span className="doc-owner">by {document.owner}</span>
      </div>

      <div className="sign-container">
        {/* Document Preview */}
        <div className="document-preview">
          <div className="doc-info">
            <h2>{document.name}</h2>
            <p>Created: {document.createdAt}</p>
          </div>

          <div className="doc-content">
            {document.content}
          </div>

          <div className="signers-list">
            <h3>Signers ({document.signers.length})</h3>
            {document.signers.map((signer, idx) => (
              <div key={signer.id} className={`signer-item ${idx === 0 ? 'current' : ''}`}>
                <span className="signer-badge">{signer.status === 'pending' ? '⏳' : '✓'}</span>
                <div className="signer-info">
                  <div className="signer-name">{signer.name}</div>
                  <div className="signer-email">{signer.email}</div>
                </div>
                <span className={`signer-status ${signer.status}`}>{signer.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signature Panel */}
        <div className="signature-panel">
          <h3>Add Your Signature</h3>

          {/* Signature Type Selector */}
          <div className="signature-types">
            <button
              className={`type-btn ${signatureType === 'draw' ? 'active' : ''}`}
              onClick={() => setSignatureType('draw')}
            >
              ✏️ Draw
            </button>
            <button
              className={`type-btn ${signatureType === 'type' ? 'active' : ''}`}
              onClick={() => setSignatureType('type')}
            >
              ABc Type
            </button>
            <button
              className={`type-btn ${signatureType === 'upload' ? 'active' : ''}`}
              onClick={() => setSignatureType('upload')}
            >
              📤 Upload
            </button>
          </div>

          {/* Draw Signature */}
          {signatureType === 'draw' && (
            <div className="signature-input draw">
              <canvas
                ref={canvasRef}
                width={300}
                height={150}
                className="signature-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              <p className="canvas-hint">Draw your signature in the box above</p>
              <button className="clear-btn" onClick={clearSignature}>Clear</button>
            </div>
          )}

          {/* Type Signature */}
          {signatureType === 'type' && (
            <div className="signature-input type">
              <input
                type="text"
                placeholder="Type your name"
                className="type-signature-input"
              />
              <p>Your signature will be displayed in a professional font</p>
            </div>
          )}

          {/* Upload Signature */}
          {signatureType === 'upload' && (
            <div className="signature-input upload">
              <label className="file-input-label">
                <input type="file" accept="image/*" />
                <span>Upload Signature Image</span>
              </label>
              <p>PNG, JPG, or PDF</p>
            </div>
          )}

          {/* Agreement Checkbox */}
          <div className="agreement-check">
            <label>
              <input type="checkbox" required />
              <span>I agree that this signature legally binds me</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="sign-actions">
            <button className="btn btn-secondary">Cancel</button>
            <button className="btn btn-primary" onClick={submitSignature}>Sign Document</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSign;
