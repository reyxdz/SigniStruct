const mongoose = require('mongoose');

/**
 * DocumentSigner Schema
 * Tracks individual signer status and metadata for multi-signer documents
 * Separate from DocumentSignature which stores the actual signature data
 */
const DocumentSignerSchema = new mongoose.Schema({
  document_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },

  signer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  signer_email: {
    type: String,
    required: true
  },

  signer_name: {
    type: String,
    default: null
  },

  // Signing order: 0 = can sign immediately, 1+ = must wait for previous signers
  signing_order: {
    type: Number,
    default: 0,
    min: 0
  },

  // Status: pending, signed, declined, expired
  status: {
    type: String,
    enum: ['pending', 'signed', 'declined', 'expired'],
    default: 'pending',
    index: true
  },

  // When can they start signing
  available_from: {
    type: Date,
    default: Date.now
  },

  // Deadline for signing
  signing_deadline: {
    type: Date,
    default: null
  },

  // When they actually signed (if signed)
  signed_at: {
    type: Date,
    default: null
  },

  // Reference to the actual signature document once signed
  signature_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentSignature',
    default: null
  },

  // Decline reason if declined
  decline_reason: {
    type: String,
    default: null
  },

  // Declined timestamp
  declined_at: {
    type: Date,
    default: null
  },

  // Reminder count (how many reminders sent)
  reminder_count: {
    type: Number,
    default: 0,
    min: 0
  },

  // Last reminder sent timestamp
  last_reminder_sent: {
    type: Date,
    default: null
  },

  // Signing method (sequential or parallel)
  signing_method: {
    type: String,
    enum: ['sequential', 'parallel'],
    default: 'sequential'
  },

  // Can signer add comments or requests before signing
  can_comment: {
    type: Boolean,
    default: true
  },

  // Comments/requests from signer
  comments: {
    type: [
      {
        message: String,
        created_at: {
          type: Date,
          default: Date.now
        },
        is_request: {
          type: Boolean,
          default: false
        }
      }
    ],
    default: []
  },

  // IP address where signed
  signed_from_ip: {
    type: String,
    default: null
  },

  // User agent when signed
  signed_from_user_agent: {
    type: String,
    default: null
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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
});

// Update timestamp on save
DocumentSignerSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// Index for finding pending signers
DocumentSignerSchema.index({ document_id: 1, status: 1 });

// Index for finding signers by user
DocumentSignerSchema.index({ signer_id: 1, status: 1 });

// Index for deadline-based queries
DocumentSignerSchema.index({ signing_deadline: 1, status: 1 });

// Index for finding expired signings
DocumentSignerSchema.index({ status: 1, signing_deadline: 1 });

module.exports = mongoose.model('DocumentSigner', DocumentSignerSchema);
