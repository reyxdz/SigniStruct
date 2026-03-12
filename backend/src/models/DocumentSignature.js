const mongoose = require('mongoose');

const documentSignatureSchema = new mongoose.Schema(
  {
    document_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true
    },
    signer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    recipient_email: {
      type: String,
      default: null,
      index: true
    },
    recipient_name: {
      type: String,
      default: null
    },
    signing_token: {
      type: String,
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'signed', 'declined', 'expired'],
      default: 'pending',
      index: true
    },
    certificate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserCertificate',
      default: null
    },
    signature_hash: {
      type: String,
      default: null
    },
    user_signature_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserSignature',
      default: null
    },
    document_hash: {
      type: String,
      default: null
    },
    signature_placement: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      page: Number
    },
    is_valid: {
      type: Boolean,
      default: true
    },
    verification_timestamp: {
      type: Date,
      default: null
    },
    fields: {
      type: [String],
      default: []
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: {
      type: String,
      default: null
    },
    // Phase 8.3.2: Cryptographic signing fields
    crypto_signature: {
      type: String,
      default: null,
      index: true // For signature lookup
    },
    content_hash: {
      type: String,
      default: null // SHA-256 of field content
    },
    signature_integrity_hash: {
      type: String,
      default: null // SHA-256 of the signature itself
    },
    algorithm: {
      type: String,
      enum: ['RSA-SHA256', 'RSA-SHA512', 'ECDSA', 'visual-only'],
      default: 'visual-only',
      index: true
    },
    verified: {
      type: Boolean,
      default: false // true = cryptographically verified
    },
    // Who verified this signature (could be system admin)
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'document_signatures'
  }
);

// Indexes for efficient queries
documentSignatureSchema.index({ document_id: 1, signer_id: 1 });
documentSignatureSchema.index({ document_id: 1, recipient_email: 1 });
documentSignatureSchema.index({ timestamp: -1 });
documentSignatureSchema.index({ certificate_id: 1 });

const DocumentSignature = mongoose.model('DocumentSignature', documentSignatureSchema);

module.exports = DocumentSignature;
