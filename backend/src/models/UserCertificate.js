const mongoose = require('mongoose');

const userCertificateSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    certificate_id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    public_key: {
      type: String,
      required: true
    },
    private_key_encrypted: {
      type: String,
      required: true
    },
    certificate_pem: {
      type: String,
      required: true
    },
    issuer: {
      type: String,
      default: 'SigniStruct'
    },
    subject: {
      type: String,
      required: true
    },
    serial_number: {
      type: String,
      required: true,
      unique: true
    },
    not_before: {
      type: Date,
      required: true
    },
    not_after: {
      type: Date,
      required: true
    },
    fingerprint_sha256: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['active', 'revoked', 'expired'],
      default: 'active',
      index: true
    },
    revoked_at: {
      type: Date,
      default: null
    },
    revocation_reason: {
      type: String,
      default: null
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'users_certificates'
  }
);

// Indexes for efficient queries
userCertificateSchema.index({ user_id: 1, status: 1 });
userCertificateSchema.index({ created_at: -1 });
userCertificateSchema.index({ not_after: 1 }); // For expiry checks

const UserCertificate = mongoose.model('UserCertificate', userCertificateSchema);

module.exports = UserCertificate;
