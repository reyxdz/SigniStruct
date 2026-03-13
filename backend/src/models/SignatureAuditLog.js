const mongoose = require('mongoose');

const signatureAuditLogSchema = new mongoose.Schema(
  {
    signer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    document_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      index: true
    },
    action: {
      type: String,
      enum: [
        'certificate_generated',
        'certificate_revoked',
        'certificate_renewed',
        'certificate_expired',
        'certificate_expiry_notification',
        'signature_created',
        'field_signed_cryptographic',
        'document_signed',
        'signature_verified',
        'document_verified',
        'signature_revoked'
      ],
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    ip_address: {
      type: String,
      default: null
    },
    user_agent: {
      type: String,
      default: null
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success'
    },
    error_message: {
      type: String,
      default: null
    },
    certificate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserCertificate',
      default: null
    },
    signature_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DocumentSignature',
      default: null
    }
  },
  {
    collection: 'signature_audit_log',
    timestamps: true
  }
);

// Indexes for efficient queries and audit trail
signatureAuditLogSchema.index({ timestamp: -1 });
signatureAuditLogSchema.index({ action: 1 });
signatureAuditLogSchema.index({ signer_id: 1 });
signatureAuditLogSchema.index({ document_id: 1 });
signatureAuditLogSchema.index({ timestamp: -1, action: 1 });

const SignatureAuditLog = mongoose.model('SignatureAuditLog', signatureAuditLogSchema);

module.exports = SignatureAuditLog;
