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
      required: true,
      index: true
    },
    certificate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserCertificate',
      required: true,
      index: true
    },
    signature_hash: {
      type: String,
      required: true
    },
    user_signature_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserSignature',
      required: true
    },
    document_hash: {
      type: String,
      required: true
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
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: {
      type: String,
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
documentSignatureSchema.index({ timestamp: -1 });
documentSignatureSchema.index({ certificate_id: 1 });

const DocumentSignature = mongoose.model('DocumentSignature', documentSignatureSchema);

module.exports = DocumentSignature;
