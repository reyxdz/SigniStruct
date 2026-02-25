const mongoose = require('mongoose');

const SigningRequestSchema = new mongoose.Schema(
  {
    document_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true
    },
    recipient_email: {
      type: String,
      required: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired', 'revoked'],
      default: 'pending',
      index: true
    },
    share_token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      // 32-character random token for secure share link
      default: () => require('crypto').randomBytes(16).toString('hex')
    },
    expiration_date: {
      type: Date,
      required: true,
      index: true
    },
    message: {
      type: String,
      maxlength: 500,
      default: ''
    },
    accepted_at: {
      type: Date,
      default: null
    },
    decline_reason: {
      type: String,
      maxlength: 500,
      default: ''
    },
    declined_at: {
      type: Date,
      default: null
    },
    reminder_sent_count: {
      type: Number,
      default: 0,
      min: 0
    },
    last_reminder_sent_at: {
      type: Date,
      default: null
    },
    document_snapshot: {
      title: String,
      owner_name: String,
      owner_email: String,
      file_hash: String,
      signature_count: Number
    },
    metadata: {
      sent_from_ip: String,
      user_agent: String
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
    collection: 'signing_requests',
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Compound indexes for efficient queries
SigningRequestSchema.index({ document_id: 1, status: 1 });
SigningRequestSchema.index({ recipient_email: 1, status: 1 });
SigningRequestSchema.index({ sender_id: 1, created_at: -1 });
SigningRequestSchema.index({ expiration_date: 1, status: 1 });

// Virtual for checking if expired
SigningRequestSchema.virtual('is_expired').get(function () {
  return this.status === 'pending' && new Date() > this.expiration_date;
});

// Ensure virtuals are included in JSON
SigningRequestSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('SigningRequest', SigningRequestSchema);
