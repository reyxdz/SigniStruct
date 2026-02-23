const mongoose = require('mongoose');

const userSignatureSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    signature_type: {
      type: String,
      enum: ['drawn', 'uploaded', 'typed'],
      default: 'drawn'
    },
    is_default: {
      type: Boolean,
      default: false,
      index: true
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
    collection: 'user_signatures'
  }
);

// Indexes for efficient queries
userSignatureSchema.index({ user_id: 1, is_default: 1 });
userSignatureSchema.index({ created_at: -1 });

const UserSignature = mongoose.model('UserSignature', userSignatureSchema);

module.exports = UserSignature;
