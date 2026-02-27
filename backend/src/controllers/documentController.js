const Document = require('../models/Document');
const DocumentSignature = require('../models/DocumentSignature');
const UserSignature = require('../models/UserSignature');
const User = require('../models/User');
const SigningService = require('../services/signingService');
const { validationResult } = require('express-validator');

/**
 * Document Controller
 * Handles document signing and verification operations
 */
class DocumentController {
  /**
   * Sign a document with user's digital signature
   * POST /api/documents/:documentId/sign
   * @access Private
   * @body { userSignatureId, placement: { x, y, width, height, page } }
   */
  static async signDocument(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { documentId } = req.params;
      const { userSignatureId, placement } = req.body;
      const userId = req.user.id;
      const encryptionKey = process.env.MASTER_ENCRYPTION_KEY;

      // Validate encryption key
      if (!encryptionKey) {
        return res.status(500).json({
          success: false,
          error: 'Server configuration error: encryption key missing'
        });
      }

      // Verify document exists
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Verify user owns the document or is authorized to sign it
      const isOwner = document.owner_id.toString() === userId;
      const isSigner = document.signers && document.signers.some(
        signer => signer.user_id && signer.user_id.toString() === userId
      );

      if (!isOwner && !isSigner) {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to sign this document'
        });
      }

      // Verify user signature exists
      const userSignature = await UserSignature.findById(userSignatureId);
      if (!userSignature) {
        return res.status(404).json({
          success: false,
          error: 'User signature not found'
        });
      }

      // Check if user already signed this document
      const existingSignature = await DocumentSignature.findOne({
        document_id: documentId,
        signer_id: userId
      });

      if (existingSignature) {
        return res.status(409).json({
          success: false,
          error: 'You have already signed this document'
        });
      }

      // Call signing service
      const signatureResult = await SigningService.signDocument(
        documentId,
        userId,
        {
          userSignatureId,
          placement: placement || {}
        },
        encryptionKey,
        {
          ip_address: req.ip,
          user_agent: req.get('user-agent')
        }
      );

      // Get user info for response
      const user = await User.findById(userId).select('name email');

      return res.status(201).json({
        success: true,
        message: 'Document signed successfully',
        signature: {
          _id: signatureResult._id,
          document_id: signatureResult.document_id,
          signer_id: signatureResult.signer_id,
          signer_name: user.name,
          signer_email: user.email,
          is_valid: signatureResult.is_valid,
          verification_timestamp: signatureResult.verification_timestamp,
          placement: placement,
          created_at: new Date()
        }
      });
    } catch (error) {
      console.error('Sign document error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to sign document',
        message: error.message
      });
    }
  }

  /**
   * Get a single document by ID with full details and file data
   * GET /api/documents/:documentId
   * @access Private
   */
  static async getDocument(req, res) {
    try {
      // CRITICAL: Check if req.user exists
      if (!req.user || !req.user.id) {
        console.error('❌ CRITICAL: req.user is not set!');
        console.error('  req.user:', req.user);
        console.error('  req.userId:', req.userId);
        console.error('  req.headers.authorization:', req.headers.authorization ? 'Present' : 'Missing');
        return res.status(401).json({
          success: false,
          error: 'Authentication failed: req.user not set'
        });
      }

      const { documentId } = req.params;
      const userId = req.user.id;

      console.log('🔍 Fetching Document');
      console.log('  Requested ID:', documentId);
      console.log('  Requested ID Type:', typeof documentId);
      console.log('  User ID:', userId);
      console.log('  User ID Type:', typeof userId);

      // Verify document exists
      const document = await Document.findById(documentId);
      if (!document) {
        console.log('❌ Document Not Found in database');
        console.log('  Attempted to find: { _id: ObjectId("' + documentId + '") }');
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      console.log('  Found Document ID:', document._id);
      console.log('  Document Owner:', document.owner_id);
      console.log('  Document Owner Type:', typeof document.owner_id);
      console.log('  User ID:', userId);
      console.log('  User ID Type:', typeof userId);
      console.log('  Match:', document.owner_id.toString() === userId);

      // Verify user owns the document
      if (document.owner_id.toString() !== userId) {
        console.log('❌ Permission Denied - User does not own document');
        console.log('  Owner ID (from DB):', document.owner_id.toString());
        console.log('  User ID (from req):', userId);
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to view this document'
        });
      }

      console.log('✅ Document Retrieved');

      // Return document with all details
      return res.status(200).json({
        success: true,
        document: {
          _id: document._id,
          title: document.title,
          description: document.description,
          owner_id: document.owner_id,
          file_url: document.file_url,
          original_filename: document.original_filename,
          file_type: document.file_type,
          file_size: document.file_size,
          num_pages: document.num_pages || 1,
          status: document.status,
          fields: document.fields || [],
          signers: document.signers || [],
          created_at: document.created_at,
          updated_at: document.updated_at
        }
      });
    } catch (error) {
      console.error('❌ Get document error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve document',
        message: error.message
      });
    }
  }

  /**
   * Get document with file data as base64 for PDF viewer
   * GET /api/documents/:documentId/preview
   * Returns PDF file as base64 encoded data
   * @access Private
   */
  static async getDocumentPreview(req, res) {
    try {
      const { documentId } = req.params;
      const userId = req.user.id;
      const fs = require('fs');
      const path = require('path');

      // Verify document exists
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Verify user owns the document
      if (document.owner_id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to view this document'
        });
      }

      // Build file path from file_url
      // file_url format: /uploads/documents/filename.pdf
      const fileName = document.file_url.split('/').pop();
      const filePath = path.join(__dirname, '../../uploads/documents', fileName);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Document file not found on server'
        });
      }

      // Read file and convert to base64
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');

      // Return document with file data as base64
      return res.status(200).json({
        success: true,
        document: {
          _id: document._id,
          title: document.title,
          description: document.description,
          owner_id: document.owner_id,
          file_url: document.file_url,
          fileData: base64Data,
          original_filename: document.original_filename,
          file_type: document.file_type,
          file_size: document.file_size,
          num_pages: document.num_pages || 1,
          status: document.status,
          fields: document.fields || [],
          signers: document.signers || [],
          created_at: document.created_at,
          updated_at: document.updated_at
        }
      });
    } catch (error) {
      console.error('Get document preview error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve document preview',
        message: error.message
      });
    }
  }

  /**
   * Get all signatures on a document
   * GET /api/documents/:documentId/signatures
   * @access Private
   */
  static async getDocumentSignatures(req, res) {
    try {
      const { documentId } = req.params;

      // Verify document exists
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Get all signatures
      const signatures = await DocumentSignature.find({ document_id: documentId })
        .populate('signer_id', 'name email')
        .populate('user_signature_id', '_id signature_type')
        .populate('certificate_id', 'certificate_id not_before not_after')
        .sort({ created_at: -1 });

      // Calculate signature statistics
      const totalSignatures = signatures.length;
      const validSignatures = signatures.filter(sig => sig.is_valid).length;
      const requiredSigners = document.signers ? document.signers.length : 0;

      return res.status(200).json({
        success: true,
        document: {
          _id: documentId,
          title: document.title,
          status: document.status,
          created_at: document.created_at
        },
        signatures: signatures.map(sig => ({
          _id: sig._id,
          signer: {
            _id: sig.signer_id?._id,
            name: sig.signer_id?.name,
            email: sig.signer_id?.email
          },
          is_valid: sig.is_valid,
          verification_timestamp: sig.verification_timestamp,
          placement: sig.signature_placement,
          created_at: sig.created_at
        })),
        statistics: {
          total_signatures: totalSignatures,
          valid_signatures: validSignatures,
          required_signers: requiredSigners,
          signing_complete: totalSignatures === requiredSigners && validSignatures === requiredSigners
        }
      });
    } catch (error) {
      console.error('Get document signatures error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve document signatures',
        message: error.message
      });
    }
  }

  /**
   * Verify all signatures on a document
   * POST /api/documents/:documentId/verify
   * @access Private
   */
  static async verifyDocument(req, res) {
    try {
      const { documentId } = req.params;

      // Verify document exists
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Call verification service
      const verificationResult = await SigningService.verifyDocument(
        documentId,
        {
          ip_address: req.ip,
          user_agent: req.get('user-agent')
        }
      );

      return res.status(200).json({
        success: true,
        verification: {
          document_id: verificationResult.document_id,
          document_title: document.title,
          is_valid: verificationResult.is_valid,
          total_signatures: verificationResult.total_signatures,
          valid_signatures: verificationResult.valid_signatures,
          verification_timestamp: verificationResult.verification_timestamp,
          message: verificationResult.message,
          signatures: verificationResult.signatures.map(sig => ({
            signature_id: sig.signature_id,
            signer_id: sig.signer_id,
            is_valid: sig.is_valid,
            signature_valid: sig.signature_valid,
            certificate_valid: sig.certificate_valid,
            certificate_status: sig.certificate_status
          }))
        }
      });
    } catch (error) {
      console.error('Verify document error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify document',
        message: error.message
      });
    }
  }

  /**
   * Get details of a specific signature
   * GET /api/documents/:documentId/signatures/:signatureId
   * @access Private
   */
  static async getSignatureDetails(req, res) {
    try {
      const { documentId, signatureId } = req.params;

      // Verify document exists
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Get signature
      const signature = await DocumentSignature.findOne({
        _id: signatureId,
        document_id: documentId
      }).populate('signer_id', 'name email')
        .populate('certificate_id', 'certificate_id not_before not_after');

      if (!signature) {
        return res.status(404).json({
          success: false,
          error: 'Signature not found'
        });
      }

      return res.status(200).json({
        success: true,
        signature: {
          _id: signature._id,
          document_id: signature.document_id,
          signer: {
            _id: signature.signer_id._id,
            name: signature.signer_id.name,
            email: signature.signer_id.email
          },
          certificate_id: signature.certificate_id._id,
          certificate_valid_from: signature.certificate_id.not_before,
          certificate_valid_to: signature.certificate_id.not_after,
          is_valid: signature.is_valid,
          verification_timestamp: signature.verification_timestamp,
          placement: signature.signature_placement,
          created_at: signature.created_at
        }
      });
    } catch (error) {
      console.error('Get signature details error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve signature details',
        message: error.message
      });
    }
  }

  /**
   * Revoke a signature (mark as invalid)
   * POST /api/documents/:documentId/signatures/:signatureId/revoke
   * @access Private (only by document owner)
   */
  static async revokeSignature(req, res) {
    try {
      const { documentId, signatureId } = req.params;
      const userId = req.user.id;

      // Verify document exists
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Verify user is document owner
      if (document.owner_id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Only document owner can revoke signatures'
        });
      }

      // Get signature
      const signature = await DocumentSignature.findOne({
        _id: signatureId,
        document_id: documentId
      });

      if (!signature) {
        return res.status(404).json({
          success: false,
          error: 'Signature not found'
        });
      }

      // Mark as invalid
      signature.is_valid = false;
      signature.verification_timestamp = new Date();
      await signature.save();

      return res.status(200).json({
        success: true,
        message: 'Signature revoked successfully',
        signature: {
          _id: signature._id,
          is_valid: signature.is_valid,
          verification_timestamp: signature.verification_timestamp
        }
      });
    } catch (error) {
      console.error('Revoke signature error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to revoke signature',
        message: error.message
      });
    }
  }

  /**
   * Get all documents for the user
   * GET /api/documents
   * @access Private
   */
  static async getUserDocuments(req, res) {
    try {
      const userId = req.user.id;

      console.log('📋 Fetching User Documents');
      console.log('  User ID:', userId);
      console.log('  User ID Type:', typeof userId);

      // Fetch documents created by the user
      const documents = await Document.find({ owner_id: userId })
        .select('_id title owner_id signers status created_at updated_at')
        .sort({ created_at: -1 });

      console.log('✅ Query Complete');
      console.log('  Documents Found:', documents.length);
      
      if (documents.length > 0) {
        console.log('  First Document:');
        console.log('    _id:', documents[0]._id);
        console.log('    owner_id:', documents[0].owner_id);
        console.log('    title:', documents[0].title);
      } else {
        console.log('  ⚠️  No documents found for this user');
        // Try to fetch ALL documents to see if any exist
        const allDocs = await Document.find({}).limit(5);
        console.log('  Total documents in DB:', allDocs.length);
        if (allDocs.length > 0) {
          console.log('  Sample document owner:', allDocs[0].owner_id);
        }
      }

      return res.status(200).json({
        success: true,
        documents: documents || [],
        count: documents.length
      });
    } catch (error) {
      console.error('❌ Get user documents error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve documents',
        message: error.message
      });
    }
  }

  /**
   * Upload a new document
   * POST /api/documents/upload
   * @access Private
   */
  static async uploadDocument(req, res) {
    try {
      // CRITICAL: Check if req.user exists
      if (!req.user || !req.user.id) {
        console.error('❌ CRITICAL: req.user is not set during upload!');
        console.error('  req.user:', req.user);
        console.error('  req.headers.authorization:', req.headers.authorization ? 'Present' : 'Missing');
        return res.status(401).json({
          success: false,
          error: 'Authentication failed: req.user not set'
        });
      }

      const userId = req.user.id;
      const { title, description } = req.body;

      console.log('📄 Document Upload Started');
      console.log('  User ID:', userId);
      console.log('  User ID Type:', typeof userId);
      console.log('  Title:', title);
      console.log('  File:', req.file?.filename);

      // Validate title
      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Document title is required'
        });
      }

      // Validate file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided'
        });
      }

      // Generate a simple hash from filename (in production, use crypto for actual file hash)
      const crypto = require('crypto');
      const fileHash = crypto.createHash('sha256').update(req.file.filename + Date.now()).digest('hex');

      // Create new document
      const newDocument = new Document({
        owner_id: userId,
        title: title.trim(),
        description: description?.trim() || '',
        file_url: `/uploads/documents/${req.file.filename}`,
        original_filename: req.file.originalname,
        file_hash_sha256: fileHash,
        file_size: req.file.size,
        file_type: req.file.mimetype || 'application/pdf',
        status: 'draft',
        signers: []
      });

      console.log('  Document Model Created');
      console.log('    owner_id (Model):', newDocument.owner_id);
      console.log('    owner_id Type (Model):', typeof newDocument.owner_id);

      console.log('  Saving to database...');
      // Save document to database
      const savedDocument = await newDocument.save();

      console.log('✅ Document Saved');
      console.log('  Saved Document ID:', savedDocument._id);
      console.log('  Saved owner_id:', savedDocument.owner_id);
      console.log('  Saved owner_id Type:', typeof savedDocument.owner_id);
      console.log('  File URL:', savedDocument.file_url);

      return res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        document: {
          _id: savedDocument._id,
          title: savedDocument.title,
          status: savedDocument.status,
          created_at: savedDocument.created_at
        }
      });
    } catch (error) {
      console.error('❌ Upload document error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload document',
        message: error.message
      });
    }
  }
}

module.exports = DocumentController;
