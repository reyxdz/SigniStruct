const mongoose = require('mongoose');

const userSignatureSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    signature_image: {
      type: String,
      required: true
    },
    signature_type: {
      type: String,
      enum: ['handwritten', 'uploaded', 'printed'],
      required: true
    },
    is_default: {
      type: Boolean,
      default: false
    },
    file_name: {
      type: String,
      default: null
    },
    file_size: {
      type: Number,
      default: null
    },
    mime_type: {
      type: String,
      default: 'image/png'
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
userSignatureSchema.index({ user_id: 1, created_at: -1 });

// Ensure only one default signature per user
userSignatureSchema.pre('save', async function (next) {
  if (this.is_default) {
    await this.constructor.updateMany(
      { user_id: this.user_id, _id: { $ne: this._id } },
      { is_default: false }
    );
  }
  next();
});

const UserSignature = mongoose.model('UserSignature', userSignatureSchema);

module.exports = UserSignature;
