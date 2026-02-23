const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: null
    },
    file_url: {
      type: String,
      required: true
    },
    original_filename: {
      type: String,
      required: true
    },
    file_hash_sha256: {
      type: String,
      required: true,
      unique: true
    },
    file_size: {
      type: Number,
      required: true
    },
    num_pages: {
      type: Number,
      default: 1
    },
    file_type: {
      type: String,
      default: 'application/pdf'
    },
    status: {
      type: String,
      enum: ['draft', 'pending_signature', 'partially_signed', 'fully_signed', 'archived'],
      default: 'draft',
      index: true
    },
    signers: [
      {
        user_id: mongoose.Schema.Types.ObjectId,
        email: String,
        signed_at: Date,
        signature_id: mongoose.Schema.Types.ObjectId,
        status: {
          type: String,
          enum: ['pending', 'signed', 'declined'],
          default: 'pending'
        }
      }
    ],
    created_at: {
      type: Date,
      default: Date.now,
      index: true
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    completed_at: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'documents'
  }
);

// Indexes for efficient queries
documentSchema.index({ owner_id: 1, status: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ created_at: -1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
