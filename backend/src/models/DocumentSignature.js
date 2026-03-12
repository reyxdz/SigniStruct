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
    },
    // Phase 8.3.3: Additional metadata fields
    signature_metadata: {
      ip_address: String, // IP where signature was created
      user_agent: String, // Browser/client info
      duration_ms: Number, // Time to sign (milliseconds)
      attempts: { type: Number, default: 1 }, // Number of signing attempts
      last_attempt_at: Date, // When last attempt was made
      failure_reason: String // Why signing failed (if applicable)
    },
    verification_metadata: {
      verified_timestamp: Date, // When cryptographic verification occurred
      verification_duration_ms: Number, // Time to verify
      tamper_detected_at: Date, // When tampering was detected
      verification_attempts: { type: Number, default: 0 }
    },
    signature_chain: {
      previous_signature_id: mongoose.Schema.Types.ObjectId, // For ordered signatures
      next_signature_id: mongoose.Schema.Types.ObjectId,
      sequence_number: Number // Order in signing sequence
    },
    revocation_info: {
      is_revoked: { type: Boolean, default: false },
      revoked_at: Date,
      revoked_by: mongoose.Schema.Types.ObjectId,
      revocation_reason: String
    }
  },
  {
    timestamps: true,
    collection: 'document_signatures'
  }
);

// Phase 8.3.3: Additional indexes for enhanced querying
documentSignatureSchema.index({ 'signature_metadata.ip_address': 1 });
documentSignatureSchema.index({ 'verification_metadata.verified_timestamp': -1 });
documentSignatureSchema.index({ 'signature_chain.sequence_number': 1 });
documentSignatureSchema.index({ 'revocation_info.is_revoked': 1 });
documentSignatureSchema.index({ algorithm: 1, verified: 1 }); // Composite for crypto queries
documentSignatureSchema.index({ document_id: 1, algorithm: 1 }); // Document crypto signatures

// Phase 8.3.3: Static query builder methods
documentSignatureSchema.statics.findCryptoSignatures = function(documentId) {
  return this.find({
    document_id: documentId,
    algorithm: { $ne: 'visual-only' }
  });
};

documentSignatureSchema.statics.findVerifiedSignatures = function(documentId) {
  return this.find({
    document_id: documentId,
    verified: true,
    $or: [
      { algorithm: { $eq: 'RSA-SHA256' } },
      { algorithm: { $eq: 'RSA-SHA512' } }
    ]
  });
};

documentSignatureSchema.statics.findTamperedSignatures = function(documentId) {
  return this.find({
    document_id: documentId,
    algorithm: { $ne: 'visual-only' },
    verified: false,
    'content_hash': { $exists: true, $ne: null }
  });
};

documentSignatureSchema.statics.findActiveSignatures = function(documentId) {
  return this.find({
    document_id: documentId,
    status: 'signed',
    'revocation_info.is_revoked': false
  });
};

documentSignatureSchema.statics.findSignaturesByAlgorithm = function(documentId, algorithm) {
  return this.find({
    document_id: documentId,
    algorithm: algorithm
  });
};

documentSignatureSchema.statics.findSignaturesByUser = function(userId) {
  return this.find({
    signer_id: userId,
    status: 'signed'
  });
};

// Phase 8.3.3: Instance methods
documentSignatureSchema.methods.isCryptoSignature = function() {
  return this.algorithm && this.algorithm !== 'visual-only';
};

documentSignatureSchema.methods.isTampered = function() {
  return this.verified === false && this.content_hash !== null;
};

documentSignatureSchema.methods.isRevoked = function() {
  return this.revocation_info && this.revocation_info.is_revoked === true;
};

documentSignatureSchema.methods.getVerificationStatus = function() {
  if (this.isRevoked()) return 'revoked';
  if (!this.isCryptoSignature()) return 'visual-only';
  if (this.verified === false) return 'tampered';
  if (this.verified === true && !this.isTampered()) return 'verified';
  return 'unknown';
};

documentSignatureSchema.methods.getSignatureType = function() {
  return this.algorithm || 'visual-only';
};

documentSignatureSchema.methods.canBeVerified = function() {
  return this.isCryptoSignature() && 
         this.content_hash !== null && 
         this.crypto_signature !== null &&
         !this.isRevoked();
};

documentSignatureSchema.methods.markAsTampered = function(tamperedAt = new Date()) {
  this.verified = false;
  this.verification_metadata = this.verification_metadata || {};
  this.verification_metadata.tamper_detected_at = tamperedAt;
  return this;
};

documentSignatureSchema.methods.markAsVerified = function(verifiedBy, verifiedAt = new Date()) {
  this.verified = true;
  this.verified_by = verifiedBy;
  this.verification_metadata = this.verification_metadata || {};
  this.verification_metadata.verified_timestamp = verifiedAt;
  return this;
};

documentSignatureSchema.methods.revokeSignature = function(revokedBy, reason = 'No reason provided') {
  this.revocation_info = this.revocation_info || {};
  this.revocation_info.is_revoked = true;
  this.revocation_info.revoked_at = new Date();
  this.revocation_info.revoked_by = revokedBy;
  this.revocation_info.revocation_reason = reason;
  return this;
};

// Phase 8.3.3: Virtual for signature age in days
documentSignatureSchema.virtual('signature_age_days').get(function() {
  if (!this.timestamp) return null;
  const now = new Date();
  const diffTime = Math.abs(now - this.timestamp);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Phases 8.3.3: Aggregate statistics
documentSignatureSchema.statics.getDocumentSignatureStatistics = function(documentId) {
  return this.aggregate([
    { $match: { document_id: new mongoose.Types.ObjectId(documentId) } },
    {
      $group: {
        _id: '$algorithm',
        count: { $sum: 1 },
        verified_count: {
          $sum: { $cond: [{ $eq: ['$verified', true] }, 1, 0] }
        },
        tampered_count: {
          $sum: { $cond: [{ $eq: ['$verified', false] }, 1, 0] }
        },
        revoked_count: {
          $sum: { $cond: [{ $eq: ['$revocation_info.is_revoked', true] }, 1, 0] }
        }
      }
    }
  ]);
};

const DocumentSignature = mongoose.model('DocumentSignature', documentSignatureSchema);

module.exports = DocumentSignature;
