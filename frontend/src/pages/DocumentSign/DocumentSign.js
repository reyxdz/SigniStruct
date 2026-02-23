import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius, transitions } from '../../theme';
import { FiEdit, FiUsers, FiUpload, FiX, FiCheck, FiClock } from 'react-icons/fi';

const DocumentSign = ({ documentId }) => {
  const [signatureType, setSignatureType] = useState('draw');
  const [isAgreed, setIsAgreed] = useState(false);
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const document = {
    id: documentId || 1,
    name: 'Employment Contract',
    owner: 'Acme Corporation',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
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
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submitSignature = () => {
    if (!isAgreed) {
      alert('Please agree to the terms before signing');
      return;
    }
    alert('Document signed successfully! It will be sent to the next signer.');
  };

  const signStyles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.lightGray,
      padding: `${spacing.xl} ${spacing['2xl']}`,
    },
    content: {
      maxWidth: '1400px',
      margin: '0 auto',
    },
    header: {
      marginBottom: spacing['2xl'],
    },
    title: {
      fontSize: typography.sizes['3xl'],
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      margin: 0,
    },
    owner: {
      fontSize: typography.sizes.sm,
      color: colors.gray600,
      marginTop: spacing.xs,
    },
    signContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr 400px',
      gap: spacing.lg,
    },
    preview: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      boxShadow: colors.shadowMd,
    },
    docInfo: {
      marginBottom: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottom: `2px solid ${colors.gray200}`,
    },
    docTitle: {
      fontSize: typography.sizes['2xl'],
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      margin: 0,
      marginBottom: spacing.xs,
    },
    docMeta: {
      fontSize: typography.sizes.sm,
      color: colors.gray600,
    },
    docContent: {
      fontSize: typography.sizes.sm,
      lineHeight: '1.6',
      color: colors.gray700,
      marginBottom: spacing.lg,
      padding: spacing.lg,
      backgroundColor: colors.gray50,
      borderRadius: borderRadius.md,
      maxHeight: '300px',
      overflow: 'auto',
    },
    signersList: {
      marginTop: spacing.lg,
    },
    signersTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      margin: 0,
      marginBottom: spacing.md,
    },
    signerItem: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.gray50,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
      borderLeft: `4px solid ${colors.gray300}`,
    },
    signerItemCurrent: {
      borderLeftColor: colors.primary,
      backgroundColor: colors.primaryVeryLight,
    },
    signerBadge: {
      fontSize: typography.sizes.lg,
      minWidth: '24px',
    },
    signerInfo: {
      flex: 1,
    },
    signerName: {
      fontWeight: typography.weights.medium,
      color: colors.gray900,
      fontSize: typography.sizes.sm,
    },
    signerEmail: {
      fontSize: typography.sizes.xs,
      color: colors.gray500,
    },
    signerStatus: {
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.medium,
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.full,
      backgroundColor: colors.warningLight,
      color: '#B45309',
    },
    signerStatusSigned: {
      backgroundColor: colors.successLight || '#ECFDF5',
      color: '#047857',
    },
    panel: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      boxShadow: colors.shadowMd,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.lg,
      position: 'sticky',
      top: spacing.lg,
    },
    panelTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.gray900,
      margin: 0,
    },
    typeButtons: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: spacing.sm,
    },
    typeButton: {
      padding: `${spacing.sm} ${spacing.md}`,
      border: `2px solid ${colors.gray300}`,
      backgroundColor: colors.white,
      color: colors.gray700,
      borderRadius: borderRadius.md,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.medium,
      cursor: 'pointer',
      transition: transitions.fast,
    },
    typeButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryVeryLight,
      color: colors.primary,
    },
    signatureInput: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
    },
    canvas: {
      border: `2px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      backgroundColor: colors.white,
      cursor: 'crosshair',
    },
    textInput: {
      padding: `${spacing.sm} ${spacing.md}`,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      fontSize: typography.sizes.sm,
    },
    fileInputLabel: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      border: `2px dashed ${colors.primary}`,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primaryVeryLight,
      cursor: 'pointer',
      transition: transitions.fast,
    },
    fileInput: {
      display: 'none',
    },
    fileInputSpan: {
      fontWeight: typography.weights.medium,
      color: colors.primary,
    },
    hint: {
      fontSize: typography.sizes.xs,
      color: colors.gray600,
      textAlign: 'center',
    },
    clearButton: {
      padding: `${spacing.sm} ${spacing.md}`,
      backgroundColor: colors.gray100,
      color: colors.gray700,
      border: 'none',
      borderRadius: borderRadius.md,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      cursor: 'pointer',
      transition: transitions.fast,
    },
    agreementCheck: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    checkbox: {
      width: '20px',
      height: '20px',
      borderRadius: borderRadius.sm,
      cursor: 'pointer',
      flexShrink: 0,
      marginTop: '2px',
    },
    agreementText: {
      fontSize: typography.sizes.sm,
      color: colors.gray700,
      lineHeight: '1.5',
    },
    actions: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: spacing.md,
    },
    button: {
      padding: `${spacing.sm} ${spacing.md}`,
      border: 'none',
      borderRadius: borderRadius.md,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      cursor: 'pointer',
      transition: transitions.fast,
    },
    buttonSecondary: {
      backgroundColor: colors.gray100,
      color: colors.gray700,
    },
    buttonPrimary: {
      backgroundColor: colors.accent,
      color: colors.white,
    },
  };

  return (
    <div style={signStyles.container}>
      <div style={signStyles.content}>
        {/* Header */}
        <div style={signStyles.header}>
          <h1 style={signStyles.title}><FiEdit style={{ display: 'inline', marginRight: '12px' }} /> Sign Document</h1>
          <p style={signStyles.owner}>by {document.owner}</p>
        </div>

        {/* Main Container */}
        <div style={signStyles.signContainer}>
          {/* Document Preview */}
          <div style={signStyles.preview}>
            <div style={signStyles.docInfo}>
              <h2 style={signStyles.docTitle}>{document.name}</h2>
              <p style={signStyles.docMeta}>Created: {document.createdAt}</p>
            </div>

            <div style={signStyles.docContent}>
              {document.content}
            </div>

            {/* Signers List */}
            <div style={signStyles.signersList}>
              <h3 style={signStyles.signersTitle}>
                <FiUsers style={{ display: 'inline', marginRight: '8px' }} /> Signers ({document.signers.length})
              </h3>
              {document.signers.map((signer, idx) => (
                <div
                  key={signer.id}
                  style={{
                    ...signStyles.signerItem,
                    ...(idx === 0 && signStyles.signerItemCurrent),
                  }}
                >
                  <span style={signStyles.signerBadge}>
                    {signer.status === 'pending' ? <FiClock /> : <FiCheck />}
                  </span>
                  <div style={signStyles.signerInfo}>
                    <div style={signStyles.signerName}>{signer.name}</div>
                    <div style={signStyles.signerEmail}>{signer.email}</div>
                  </div>
                  <span
                    style={{
                      ...signStyles.signerStatus,
                      ...(signer.status === 'signed' &&
                        signStyles.signerStatusSigned),
                    }}
                  >
                    {signer.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Signature Panel */}
          <div style={signStyles.panel}>
            <h3 style={signStyles.panelTitle}>🖊️ Your Signature</h3>

            {/* Signature Type Selector */}
            <div style={signStyles.typeButtons}>
              <button
                style={{
                  ...signStyles.typeButton,
                  ...(signatureType === 'draw' && signStyles.typeButtonActive),
                }}
                onClick={() => setSignatureType('draw')}
              >
                <FiEdit style={{ display: 'inline', marginRight: '6px' }} /> Draw
              </button>
              <button
                style={{
                  ...signStyles.typeButton,
                  ...(signatureType === 'type' && signStyles.typeButtonActive),
                }}
                onClick={() => setSignatureType('type')}
              >
                Abc Type
              </button>
              <button
                style={{
                  ...signStyles.typeButton,
                  ...(signatureType === 'upload' && signStyles.typeButtonActive),
                }}
                onClick={() => setSignatureType('upload')}
              >
                <FiUpload style={{ display: 'inline', marginRight: '6px' }} /> Upload
              </button>
            </div>

            {/* Draw Signature */}
            {signatureType === 'draw' && (
              <div style={signStyles.signatureInput}>
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={120}
                  style={signStyles.canvas}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <p style={signStyles.hint}><FiEdit style={{ display: 'inline', marginRight: '6px' }} /> Draw your signature above</p>
                <button
                  style={signStyles.clearButton}
                  onClick={clearSignature}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = colors.gray200;
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = colors.gray100;
                  }}
                >
                  Clear
                </button>
              </div>
            )}

            {/* Type Signature */}
            {signatureType === 'type' && (
              <div style={signStyles.signatureInput}>
                <input
                  type="text"
                  placeholder="Type your full name"
                  style={signStyles.textInput}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.gray300;
                  }}
                />
                <p style={signStyles.hint}>
                  Your signature will be displayed professionally
                </p>
              </div>
            )}

            {/* Upload Signature */}
            {signatureType === 'upload' && (
              <div style={signStyles.signatureInput}>
                <label
                  style={signStyles.fileInputLabel}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary;
                    e.currentTarget.querySelector('span').style.color = colors.white;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primaryVeryLight;
                    e.currentTarget.querySelector('span').style.color = colors.primary;
                  }}
                >
                  <input type="file" accept="image/*" style={signStyles.fileInput} />
                  <span style={signStyles.fileInputSpan}>
                    <FiUpload style={{ display: 'inline', marginRight: '6px' }} /> Upload Signature Image
                  </span>
                </label>
                <p style={signStyles.hint}>PNG, JPG, or GIF</p>
              </div>
            )}

            {/* Agreement Checkbox */}
            <div style={signStyles.agreementCheck}>
              <input
                type="checkbox"
                id="agreement"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                style={signStyles.checkbox}
              />
              <label htmlFor="agreement" style={signStyles.agreementText}>
                I agree that this signature legally binds me to this document
              </label>
            </div>

            {/* Action Buttons */}
            <div style={signStyles.actions}>
              <button
                style={{
                  ...signStyles.button,
                  ...signStyles.buttonSecondary,
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = colors.gray200;
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = colors.gray100;
                }}
              >
                <FiX style={{ display: 'inline', marginRight: '6px' }} /> Cancel
              </button>
              <button
                style={{
                  ...signStyles.button,
                  ...signStyles.buttonPrimary,
                  opacity: isAgreed ? 1 : 0.6,
                }}
                onClick={submitSignature}
                disabled={!isAgreed}
                onMouseOver={(e) => {
                  if (isAgreed) {
                    e.target.style.opacity = '0.9';
                  }
                }}
                onMouseOut={(e) => {
                  if (isAgreed) {
                    e.target.style.opacity = '1';
                  }
                }}
              >
                <FiCheck style={{ display: 'inline', marginRight: '6px' }} /> Sign Document
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSign;
