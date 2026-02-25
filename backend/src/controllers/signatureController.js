const UserSignature = require('../models/UserSignature');
const { validationResult } = require('express-validator');

/**
 * Signature Controller
 * Handles all signature-related operations
 */

class SignatureController {
  /**
   * Create/Upload a new signature
   * POST /api/signatures/create
   */
  static async createSignature(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { signature_image, signature_type } = req.body;
      const user_id = req.user.id;

      // Validate signature image (basic length check for Base64)
      if (!signature_image || signature_image.length < 100) {
        return res.status(400).json({
          error: 'Invalid signature image. Image must be at least 100 characters.'
        });
      }

      // Calculate file size from Base64
      const file_size = Math.ceil((signature_image.length * 3) / 4);

      // Create new signature
      const newSignature = new UserSignature({
        user_id,
        signature_image,
        signature_type,
        file_size,
        mime_type: 'image/png'
      });

      // Save to database
      const savedSignature = await newSignature.save();

      return res.status(201).json({
        success: true,
        message: 'Signature created successfully',
        signature: {
          _id: savedSignature._id,
          signature_type: savedSignature.signature_type,
          is_default: savedSignature.is_default,
          created_at: savedSignature.created_at
        }
      });
    } catch (error) {
      console.error('Create signature error:', error);
      return res.status(500).json({
        error: 'Failed to create signature',
        message: error.message
      });
    }
  }

  /**
   * Get all signatures for the authenticated user
   * GET /api/signatures/user
   */
  static async getUserSignatures(req, res) {
    try {
      const user_id = req.user.id;

      const signatures = await UserSignature.find({ user_id })
        .sort({ created_at: -1 });

      return res.status(200).json({
        success: true,
        count: signatures.length,
        signatures
      });
    } catch (error) {
      console.error('Get user signatures error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve signatures',
        message: error.message
      });
    }
  }

  /**
   * Get a specific signature by ID
   * GET /api/signatures/:signatureId
   */
  static async getSignatureById(req, res) {
    try {
      const { signatureId } = req.params;
      const user_id = req.user.id;

      const signature = await UserSignature.findOne({
        _id: signatureId,
        user_id
      });

      if (!signature) {
        return res.status(404).json({
          error: 'Signature not found'
        });
      }

      return res.status(200).json({
        success: true,
        signature
      });
    } catch (error) {
      console.error('Get signature by ID error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve signature',
        message: error.message
      });
    }
  }

  /**
   * Set a signature as default
   * PUT /api/signatures/:signatureId/set-default
   */
  static async setDefaultSignature(req, res) {
    try {
      const { signatureId } = req.params;
      const user_id = req.user.id;

      // Verify signature belongs to user
      const signature = await UserSignature.findOne({
        _id: signatureId,
        user_id
      });

      if (!signature) {
        return res.status(404).json({
          error: 'Signature not found'
        });
      }

      // Set this one as default (pre-save hook handles unsetting others)
      signature.is_default = true;
      const updatedSignature = await signature.save();

      return res.status(200).json({
        success: true,
        message: 'Default signature updated',
        signature: {
          _id: updatedSignature._id,
          signature_type: updatedSignature.signature_type,
          is_default: updatedSignature.is_default
        }
      });
    } catch (error) {
      console.error('Set default signature error:', error);
      return res.status(500).json({
        error: 'Failed to set default signature',
        message: error.message
      });
    }
  }

  /**
   * Delete a signature
   * DELETE /api/signatures/:signatureId
   */
  static async deleteSignature(req, res) {
    try {
      const { signatureId } = req.params;
      const user_id = req.user.id;

      const signature = await UserSignature.findOne({
        _id: signatureId,
        user_id
      });

      if (!signature) {
        return res.status(404).json({
          error: 'Signature not found'
        });
      }

      // If deleting the default signature, set another as default if available
      if (signature.is_default) {
        const nextSignature = await UserSignature.findOne({
          user_id,
          _id: { $ne: signatureId }
        }).sort({ created_at: -1 });

        if (nextSignature) {
          nextSignature.is_default = true;
          await nextSignature.save();
        }
      }

      await UserSignature.deleteOne({ _id: signatureId });

      return res.status(200).json({
        success: true,
        message: 'Signature deleted successfully'
      });
    } catch (error) {
      console.error('Delete signature error:', error);
      return res.status(500).json({
        error: 'Failed to delete signature',
        message: error.message
      });
    }
  }

  /**
   * Get default signature for user
   * GET /api/signatures/default
   */
  static async getDefaultSignature(req, res) {
    try {
      const user_id = req.user.id;

      const defaultSignature = await UserSignature.findOne({
        user_id,
        is_default: true
      });

      if (!defaultSignature) {
        return res.status(404).json({
          error: 'No default signature set'
        });
      }

      return res.status(200).json({
        success: true,
        signature: defaultSignature
      });
    } catch (error) {
      console.error('Get default signature error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve default signature',
        message: error.message
      });
    }
  }
}

module.exports = SignatureController;
