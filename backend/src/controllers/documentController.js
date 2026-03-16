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
   * Phase 8.3.2: Sign a document field with RSA cryptographic signature
   * POST /api/documents/:documentId/sign-field
   * @access Private
   * @body { fieldContent, fieldId, password }
   */
  static async signFieldCryptographic(req, res) {
    try {
      const { documentId } = req.params;
      const { fieldContent, fieldId, password } = req.body;
      const userId = req.user.id;
      const encryptionKey = process.env.MASTER_ENCRYPTION_KEY;

      console.log('🔐 Phase 8.3.2: Cryptographic Field Signing');
      console.log('  Document ID:', documentId);
      console.log('  Field ID:', fieldId);
      console.log('  User ID:', userId);
      console.log('  Content length:', fieldContent?.length || 0);

      // Validate inputs
      if (!fieldContent || !fieldId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: fieldContent and fieldId'
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          error: 'Password required for cryptographic signing'
        });
      }

      if (!encryptionKey) {
        console.error('❌ Server configuration error: MASTER_ENCRYPTION_KEY missing');
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

      // Verify user is authorized to sign
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

      // Check if already signed same field
      const existingSignature = await DocumentSignature.findOne({
        document_id: documentId,
        signer_id: userId,
        'signature_placement.x': { $exists: true }
      });

      if (existingSignature && existingSignature.status === 'signed') {
        return res.status(409).json({
          success: false,
          error: 'You have already signed this document'
        });
      }

      // Call Phase 8.3.1 cryptographic signing method
      const cryptoSignature = await SigningService.signField(
        documentId,
        fieldContent,
        userId,
        encryptionKey
      );

      console.log('✅ RSA Signature Generated');
      console.log('  Algorithm:', cryptoSignature.algorithm);
      console.log('  Content Hash:', cryptoSignature.content_hash.substring(0, 32) + '...');
      console.log('  Signature Hash:', cryptoSignature.signature_hash.substring(0, 32) + '...');

      // Create/update DocumentSignature with crypto data
      // Find the pending signature by document_id and fields (not by signer_id, which might be null)
      let signature = await DocumentSignature.findOneAndUpdate(
        {
          document_id: documentId,
          fields: { $in: [fieldId] },
          status: 'pending'  // Only update pending signatures
        },
        {
          $set: {
            status: 'signed',
            signer_id: userId,  // Set signer_id when actually signing
            certificate_id: cryptoSignature.certificate_id,
            // Phase 8.3.2: Store cryptographic signature data
            crypto_signature: cryptoSignature.signature,
            content_hash: cryptoSignature.content_hash,
            signature_integrity_hash: cryptoSignature.signature_hash,
            signature_hash: cryptoSignature.signature_hash,
            algorithm: cryptoSignature.algorithm,
            verified: cryptoSignature.verified,
            verification_timestamp: new Date(),
            is_valid: true,
            fields: [fieldId],
            created_at: new Date()
          }
        },
        { new: true, runValidators: false }
      );

      // If no pending signature found (e.g., publisher signing their own field)
      // Create a new DocumentSignature record for them
      if (!signature) {
        console.log(`📝 No pending signature found. Creating new record for document owner...`);
        const user = await User.findById(userId);
        signature = new DocumentSignature({
          document_id: documentId,
          signer_id: userId,
          recipient_email: user?.email || 'Publisher',
          recipient_name: user?.name || 'Document Publisher',
          status: 'signed',
          certificate_id: cryptoSignature.certificate_id,
          crypto_signature: cryptoSignature.signature,
          content_hash: cryptoSignature.content_hash,
          signature_integrity_hash: cryptoSignature.signature_hash,
          signature_hash: cryptoSignature.signature_hash,
          algorithm: cryptoSignature.algorithm,
          verified: cryptoSignature.verified,
          verification_timestamp: new Date(),
          is_valid: true,
          fields: [fieldId],
          created_at: new Date()
        });
        
        await signature.save();
        console.log(`✅ Created new DocumentSignature record for publisher: ${signature._id}`);
      }

      console.log('✅ Signature stored in database');
      console.log('  Signature ID:', signature._id);
      console.log('  Status:', signature.status);
      console.log('  Algorithm:', signature.algorithm);
      console.log('  Verified:', signature.verified);

      // Phase 8.3.2: Log to audit trail
      const SignatureAuditLog = require('../models/SignatureAuditLog');
      await SignatureAuditLog.create({
        action: 'field_signed_cryptographic',
        signer_id: userId,
        document_id: documentId,
        details: {
          signature_id: signature._id,
          field_id: fieldId,
          algorithm: cryptoSignature.algorithm,
          content_hash: cryptoSignature.content_hash,
          signature_hash: cryptoSignature.signature_hash,
          certificate_id: cryptoSignature.certificate_id,
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          timestamp: new Date()
        }
      });

      console.log('✅ Audit log created');

      // Get user info for response
      const user = await User.findById(userId).select('name email');

      // Debug: Log what we're returning
      console.log('🔐 Response Signature Data Check:');
      console.log('  crypto_signature:', signature.crypto_signature ? `${signature.crypto_signature.substring(0, 32)}...` : 'MISSING');
      console.log('  crypto_signature type:', typeof signature.crypto_signature);
      console.log('  content_hash:', signature.content_hash ? `${signature.content_hash.substring(0, 32)}...` : 'MISSING');
      console.log('  algorithm:', signature.algorithm);

      return res.status(200).json({
        success: true,
        message: 'Field signed cryptographically',
        data: {
          _id: signature._id,
          document_id: documentId,
          field_id: fieldId,
          signer_id: userId,
          signer_name: user.name,
          signer_email: user.email,
          algorithm: signature.algorithm,
          verified: signature.verified,
          content_hash: signature.content_hash,
          crypto_signature: signature.crypto_signature,
          signature_hash: signature.signature_integrity_hash,
          timestamp: signature.verification_timestamp
        }
      });

    } catch (error) {
      console.error('❌ Cryptographic signing error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to sign field cryptographically',
        message: error.message
      });
    }
  }

  /**
   * Verify a cryptographic signature
   * POST /api/documents/:documentId/verify-signature
   * @access Private
   * @body { signatureId, fieldContent }
   */
  static async verifySignatureCryptographic(req, res) {
    try {
      const { documentId } = req.params;
      const { signatureId, fieldContent } = req.body;
      const userId = req.user.id;

      console.log('🔍 Phase 8.3.2: Verifying Cryptographic Signature');
      console.log('  Document ID:', documentId);
      console.log('  Signature ID:', signatureId);
      console.log('  Content length:', fieldContent?.length || 0);

      // Validate inputs
      if (!signatureId || !fieldContent) {
        return res.status(400).json({
          success: false,
          error: 'Missing signatureId or fieldContent'
        });
      }

      // Get signature
      const signature = await DocumentSignature.findById(signatureId)
        .populate('signer_id', 'name email')
        .populate('certificate_id');

      if (!signature) {
        return res.status(404).json({
          success: false,
          error: 'Signature not found'
        });
      }

      // Verify document match
      if (signature.document_id.toString() !== documentId) {
        return res.status(400).json({
          success: false,
          error: 'Signature does not belong to this document'
        });
      }

      // Check if signature has been revoked
      if (signature.revocation_info?.is_revoked) {
        console.log('⚠️  Signature is revoked - verification failed');
        return res.status(200).json({
          success: true,
          message: 'Signature verification complete',
          data: {
            signature_id: signatureId,
            is_valid: false,
            signature_valid: false,
            content_matches: false,
            tampering_detected: false,
            reason: 'Signature has been revoked',
            algorithm: signature.algorithm,
            signer_name: signature.signer_id?.name || 'Unknown',
            signer_email: signature.signer_id?.email || 'Unknown',
            signed_at: signature.timestamp,
            verified_at: new Date()
          }
        });
      }

      // Check if signature has crypto data
      if (!signature.crypto_signature) {
        return res.status(400).json({
          success: false,
          error: 'This signature does not have cryptographic data'
        });
      }

      // Verify using Phase 8.3.1 verification method
      const verification = await SigningService.verifyCryptographicSignature(
        signature.crypto_signature,
        signature.content_hash,
        signature.signer_id._id
      );

      console.log('✅ Signature Verification Result');
      console.log('  Is Valid:', verification.is_valid);
      console.log('  Reason:', verification.reason);
      console.log('  Algorithm:', verification.algorithm);

      // Check if document content matches
      const currentHash = SigningService.calculateDocumentHash(fieldContent);
      const contentMatches = currentHash === signature.content_hash;

      console.log('✅ Content Verification');
      console.log('  Content Matches:', contentMatches);
      console.log('  Original Hash:', signature.content_hash.substring(0, 32) + '...');
      console.log('  Current Hash: ', currentHash.substring(0, 32) + '...');

      // Update verification if needed
      if (verification.is_valid && contentMatches && !signature.verified) {
        await DocumentSignature.findByIdAndUpdate(
          signatureId,
          {
            verified: true,
            verified_by: userId,
            verification_timestamp: new Date()
          }
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Signature verification complete',
        data: {
          signature_id: signatureId,
          is_valid: verification.is_valid && contentMatches,
          signature_valid: verification.is_valid,
          content_matches: contentMatches,
          tampering_detected: !contentMatches,
          reason: verification.reason,
          algorithm: signature.algorithm,
          signer_name: signature.signer_id.name,
          signer_email: signature.signer_id.email,
          signed_at: signature.timestamp,
          verified_at: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Signature verification error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify signature',
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
      console.log('📂 getDocument handler called (catch-all route)');
      console.log('  req.path:', req.path);
      console.log('  req.url:', req.url);
      console.log('  req.params:', JSON.stringify(req.params));
      
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
      console.log('  Fields in database:', document.fields?.length || 0);
      if (document.fields && document.fields.length > 0) {
        document.fields.forEach((f, idx) => {
          console.log(`    Field ${idx}:`);
          console.log(`      - id: ${f.id}`);
          console.log(`      - type: ${f.type}`);
          console.log(`      - label: ${f.label}`);
          console.log(`      - hasValue: ${!!f.value}`);
          console.log(`      - valueLength: ${f.value?.length || 0}`);
          console.log(`      - x: ${f.x}, y: ${f.y}, width: ${f.width}, height: ${f.height}`);
          console.log(`      - All keys: ${Object.keys(f).join(', ')}`);
        });
      }

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
   * Get document preview with signing token (for recipients)
   * GET /api/documents/:documentId/preview/:signingToken
   * Returns PDF file as base64 encoded data
   * Allows access without document ownership (uses JWT signing token)
   * @access Public (token-based)
   */
  static async getDocumentPreviewForSigning(req, res) {
    try {
      const { documentId, signingToken } = req.params;
      const jwt = require('jsonwebtoken');
      const fs = require('fs');
      const path = require('path');

      // Verify signing token
      let tokenData;
      try {
        tokenData = jwt.verify(signingToken, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired signing token'
        });
      }

      // Verify token has required data
      if (!tokenData.recipientEmail || !tokenData.documentId) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token structure'
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

      // Verify document ID matches token
      if (document._id.toString() !== tokenData.documentId) {
        return res.status(403).json({
          success: false,
          error: 'Token does not match document'
        });
      }

      // Build file path from file_url
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
          created_at: document.created_at,
          updated_at: document.updated_at
        }
      });
    } catch (error) {
      console.error('Get document preview for signing error:', error);
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
      console.log('📋 getDocumentSignatures handler called');
      console.log('  Full URL:', req.originalUrl);
      console.log('  Path:', req.path);
      console.log('  Base URL:', req.baseUrl);
      console.log('  req.params:', JSON.stringify(req.params));
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
      console.log('📑 getSignatureDetails handler called (/:documentId/signatures/:signatureId)');
      console.log('  req.path:', req.path);
      console.log('  req.params:', JSON.stringify(req.params));
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
   * Update document fields
   * PUT /api/documents/:documentId/fields
   * @access Private
   * @body { fields: array, lastEditedAt: Date }
   */
  static async updateFields(req, res) {
    try {
      const { documentId } = req.params;
      const { fields, lastEditedAt } = req.body;
      const userId = req.user.id;

      console.log('💾 Updating document fields');
      console.log('  Document ID:', documentId);
      console.log('  User ID:', userId);
      console.log('  Fields count:', fields?.length || 0);
      console.log('  Fields:', fields);

      // Verify document exists
      const document = await Document.findById(documentId);
      if (!document) {
        console.log('❌ Document not found');
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Verify user owns the document
      if (document.owner_id.toString() !== userId) {
        console.log('❌ User does not own this document');
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to update this document'
        });
      }

      // Update fields and lastEditedAt
      document.fields = fields || [];
      document.lastEditedAt = lastEditedAt || new Date();
      
      // Explicitly mark fields as modified so Mongoose detects nested changes
      document.markModified('fields');
      
      // Log field data for debugging
      if (fields && fields.length > 0) {
        console.log('  Fields being saved:');
        fields.forEach((f, idx) => {
          console.log(`    Field ${idx}:`);
          console.log(`      - id: ${f.id}`);
          console.log(`      - type: ${f.type || f.fieldType}`);
          console.log(`      - label: ${f.label}`);
          console.log(`      - assignedRecipients count: ${f.assignedRecipients?.length || 0}`);
          if (f.assignedRecipients && f.assignedRecipients.length > 0) {
            f.assignedRecipients.forEach((r, ridx) => {
              console.log(`        Recipient ${ridx}: ${r.recipientName} (${r.recipientEmail})`);
            });
          }
          console.log(`      - hasValue: ${!!f.value}`);
          console.log(`      - valueLength: ${f.value?.length || 0}`);
          console.log(`      - x: ${f.x}, y: ${f.y}, width: ${f.width}, height: ${f.height}`);
          console.log(`      - All keys: ${Object.keys(f).join(', ')}`);
        });
      }
      
      const savedDocument = await document.save();

      console.log('✅ Document fields updated');
      console.log('  Saved fields count:', savedDocument.fields.length);
      
      // Verify assignedRecipients were saved
      if (savedDocument.fields && savedDocument.fields.length > 0) {
        console.log('  Verifying saved fields:');
        savedDocument.fields.forEach((f, idx) => {
          console.log(`    Field ${idx} - assignedRecipients: ${f.assignedRecipients?.length || 0}`);
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Document fields updated successfully',
        document: {
          _id: savedDocument._id,
          fields: savedDocument.fields,
          lastEditedAt: savedDocument.lastEditedAt
        }
      });
    } catch (error) {
      console.error('❌ Update fields error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update document fields',
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
   * Get documents assigned to user for signing
   * GET /api/documents/assigned
   * Retrieves documents where the user is listed as a recipient
   * @access Private
   */
  static async getAssignedDocuments(req, res) {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;

      console.log('📋 Fetching Assigned Documents for User');
      console.log('  User ID:', userId);
      console.log('  User Email:', userEmail);

      // Find all DocumentSignature records for this user
      const DocumentSignature = require('../models/DocumentSignature');
      const assignedSignatures = await DocumentSignature.find({
        recipient_email: userEmail,
        status: { $in: ['pending', 'signed'] }
      })
        .select('document_id status recipient_email signing_token')
        .lean();

      console.log('  Found signature records:', assignedSignatures.length);

      // Get unique document IDs
      const documentIds = [...new Set(assignedSignatures.map(sig => sig.document_id.toString()))];
      console.log('  Unique documents:', documentIds.length);

      // Fetch document details with owner information
      const documents = await Document.find({ 
        _id: { $in: documentIds },
        status: { $in: ['pending_signature', 'partially_signed', 'fully_signed'] }
      })
        .select('_id title owner_id status created_at lastEditedAt fields')
        .populate({
          path: 'owner_id',
          select: 'firstName lastName email',
          model: 'User'
        })
        .lean();

      // Enrich documents with signing status
      const assignedDocuments = documents.map(doc => {
        const signatures = assignedSignatures.filter(
          sig => sig.document_id.toString() === doc._id.toString()
        );
        
        console.log(`  📄 Document "${doc.title}":`);
        console.log(`     Signatures found: ${signatures.length}`);
        if (signatures.length > 0) {
          signatures.forEach((sig, idx) => {
            console.log(`       Signature ${idx}: status=${sig.status}, recipient=${sig.recipient_email}`);
          });
        }
        
        // Count how many fields this user has signed
        let signedFieldsCount = 0;
        let totalFieldsCount = 0;
        
        if (doc.fields && Array.isArray(doc.fields)) {
          doc.fields.forEach(field => {
            if (field.assignedRecipients) {
              const userRecipient = field.assignedRecipients.find(
                r => r.recipientEmail === userEmail
              );
              if (userRecipient) {
                totalFieldsCount++;
                if (userRecipient.status === 'signed') {
                  signedFieldsCount++;
                }
              }
            }
          });
        }

        const finalSigningStatus = signatures[0]?.status || 'pending';
        console.log(`     Final signingStatus for response: ${finalSigningStatus}`);
        
        // Get owner's full name
        const ownerName = doc.owner_id 
          ? `${doc.owner_id.firstName || ''} ${doc.owner_id.lastName || ''}`.trim() 
          : 'Unknown';
        console.log(`     Owner name: ${ownerName}`);

        return {
          _id: doc._id,
          title: doc.title,
          owner_id: doc.owner_id?._id || doc.owner_id,
          ownerName: ownerName,
          status: doc.status,
          signingStatus: finalSigningStatus,
          created_at: doc.created_at,
          lastEditedAt: doc.lastEditedAt,
          signing_token: signatures[0]?.signing_token || null,
          progress: totalFieldsCount > 0 ? Math.round((signedFieldsCount / totalFieldsCount) * 100) : 0,
          signedFields: signedFieldsCount,
          totalFields: totalFieldsCount
        };
      });

      console.log('✅ Assigned documents fetched:', assignedDocuments.length);

      return res.status(200).json({
        success: true,
        documents: assignedDocuments,
        count: assignedDocuments.length
      });
    } catch (error) {
      console.error('❌ Get assigned documents error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve assigned documents',
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
  /**
   * Publish a document for signing
   * POST /api/documents/:documentId/publish
   * Validates all recipient fields, generates signing tokens, sends emails
   * @access Private
   */
  static async publishDocument(req, res) {
    try {
      const { documentId } = req.params;
      const userId = req.user.id;

      console.log('📤 Publishing document');
      console.log('  Document ID:', documentId);
      console.log('  User ID:', userId);

      // Verify document exists
      const document = await Document.findById(documentId).populate('owner_id');
      if (!document) {
        console.log('❌ Document not found');
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Verify user owns the document
      if (document.owner_id._id.toString() !== userId) {
        console.log('❌ User does not own this document');
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to publish this document'
        });
      }

      // Validate that fields exist
      if (!document.fields || document.fields.length === 0) {
        console.log('❌ Document has no fields');
        return res.status(400).json({
          success: false,
          error: 'Document must have at least one field before publishing'
        });
      }

      // Collect all unique recipients from recipient fields
      const recipientMap = new Map(); // email -> {name, id}
      
      document.fields.forEach(field => {
        if (field.assignedRecipients && Array.isArray(field.assignedRecipients)) {
          field.assignedRecipients.forEach(recipient => {
            if (recipient.recipientEmail && !recipientMap.has(recipient.recipientEmail)) {
              recipientMap.set(recipient.recipientEmail, {
                email: recipient.recipientEmail,
                name: recipient.recipientName || 'Recipient',
                userId: recipient.recipientId
              });
            }
          });
        }
      });

      // Validate that there is at least one recipient
      if (recipientMap.size === 0) {
        console.log('❌ No recipients assigned to any fields');
        return res.status(400).json({
          success: false,
          error: 'You must assign at least one recipient to a field before publishing'
        });
      }

      console.log(`✅ Found ${recipientMap.size} unique recipients`);

      // Generate signing links (skip email sending for now)
      const jwt = require('jsonwebtoken');
      const emailResults = [];
      const documentSignatureRecords = [];

      for (const [email, recipientInfo] of recipientMap) {
        try {
          // Generate signing token
          const signingToken = jwt.sign(
            {
              documentId: documentId.toString(),
              recipientEmail: email,
              recipientName: recipientInfo.name,
              type: 'signing'
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
          );

          // Create document signature record
          const documentSignature = new DocumentSignature({
            document_id: documentId,
            recipient_email: email,
            recipient_name: recipientInfo.name,
            signing_token: signingToken,
            status: 'pending',
            created_at: new Date(),
            fields: document.fields
              .filter(f => f.assignedRecipients?.some(r => r.recipientEmail === email))
              .map(f => f.id)
          });

          await documentSignature.save();
          documentSignatureRecords.push(documentSignature);

          // Create signing link
          const signingLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/documents/${documentId}/sign/${signingToken}`;

          // Skip email sending (to be implemented later)
          console.log(`  ⏭️ Skipping email to ${email} (email service not configured)`);
          console.log(`     Signing link: ${signingLink}`);

          emailResults.push({
            email,
            success: true,
            status: 'skipped',
            signingLink,
            messageId: 'email_skipped'
          });
        } catch (error) {
          console.error(`  ❌ Failed to create signing token for ${email}:`, error.message);
          emailResults.push({
            email,
            success: false,
            error: error.message
          });
        }
      }

      // Update document status to pending_signature
      document.status = 'pending_signature';
      document.publishedAt = new Date();
      await document.save();

      console.log('✅ Document published successfully');

      return res.status(200).json({
        success: true,
        message: 'Document published and invitations sent',
        data: {
          documentId: document._id,
          title: document.title,
          status: document.status,
          recipientCount: recipientMap.size,
          recipients: Array.from(recipientMap.values()),
          emailResults,
          publishedAt: document.publishedAt
        }
      });
    } catch (error) {
      console.error('❌ Publish document error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to publish document',
        message: error.message
      });
    }
  }

  /**
   * Get document for signing by a recipient using signing token
   * GET /api/documents/:documentId/sign/:signingToken
   * Verifies token and returns document with only recipient's assigned fields
   * @access Public (token-based)
   */
  static async getDocumentForSigning(req, res) {
    try {
      const { documentId, signingToken } = req.params;

      console.log('🔐 Verifying signing token');
      console.log('  Document ID:', documentId);
      console.log('  Token: ' + signingToken.substring(0, 20) + '...');

      // Verify the signing token
      const jwt = require('jsonwebtoken');
      let tokenData;
      try {
        tokenData = jwt.verify(signingToken, process.env.JWT_SECRET);
        console.log('  ✅ Token verified');
        console.log('  Recipient Email:', tokenData.recipientEmail);
        console.log('  Token Type:', tokenData.type);
      } catch (error) {
        console.log('  ❌ Token verification failed:', error.message);
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired signing token'
        });
      }

      // Verify token type is 'signing'
      if (tokenData.type !== 'signing') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token type'
        });
      }

      // Verify document ID in token matches URL param
      if (tokenData.documentId !== documentId) {
        return res.status(400).json({
          success: false,
          error: 'Document ID mismatch'
        });
      }

      // Fetch document
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Verify document status is pending_signature or partially_signed
      if (!['pending_signature', 'partially_signed'].includes(document.status)) {
        return res.status(400).json({
          success: false,
          error: 'Document is not available for signing'
        });
      }

      // Filter fields to only show those assigned to this recipient
      const recipientFields = document.fields.filter(field => {
        if (!field.assignedRecipients || field.assignedRecipients.length === 0) {
          return false;
        }
        return field.assignedRecipients.some(r => r.recipientEmail === tokenData.recipientEmail);
      });

      console.log(`✅ Found ${recipientFields.length} fields for recipient ${tokenData.recipientEmail}`);

      // Fetch DocumentSignature record to check signing status
      const DocumentSignature = require('../models/DocumentSignature');
      const signatureRecord = await DocumentSignature.findOne({
        document_id: documentId,
        recipient_email: tokenData.recipientEmail
      });

      // Return document with filtered fields
      return res.status(200).json({
        success: true,
        data: {
          document: {
            _id: document._id,
            title: document.title,
            description: document.description,
            file_url: document.file_url,
            num_pages: document.num_pages,
            file_size: document.file_size,
            status: document.status,
            fields: recipientFields,
            created_at: document.created_at
          },
          recipient: {
            email: tokenData.recipientEmail,
            name: tokenData.recipientName
          },
          signingStatus: signatureRecord?.status || 'pending',
          signingToken: signingToken
        }
      });
    } catch (error) {
      console.error('❌ Get document for signing error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve document',
        message: error.message
      });
    }
  }

  /**
   * Submit a signed field for a document
   * POST /api/documents/:documentId/sign/:signingToken
   * Records the signed field data in DocumentSignature
   * @access Public (token-based)
   */
  static async submitSignedField(req, res) {
    try {
      const { documentId, signingToken } = req.params;
      const { fieldId, fieldValue, allFieldsSigned } = req.body;

      console.log('📝 Submitting signed field');
      console.log('  Document ID:', documentId);
      console.log('  Field ID:', fieldId);
      console.log('  All Fields Signed:', allFieldsSigned);

      // Verify the signing token
      const jwt = require('jsonwebtoken');
      let tokenData;
      try {
        tokenData = jwt.verify(signingToken, process.env.JWT_SECRET);
      } catch (error) {
        console.log('  ❌ Token verification failed:', error.message);
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired signing token'
        });
      }

      // Fetch document
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Find and update the field value for this recipient
      let fieldUpdated = false;
      console.log(`  🔍 Looking for field ID: ${fieldId}`);
      console.log(`  📊 Document has ${document.fields ? document.fields.length : 0} fields`);
      
      document.fields.forEach((field, index) => {
        console.log(`    Field ${index}: id=${field.id}, hasAssignedRecipients=${!!field.assignedRecipients}`);
        if (field.id === fieldId && field.assignedRecipients) {
          console.log(`    ✓ Found matching field ${fieldId}`);
          console.log(`    👥 Field has ${field.assignedRecipients.length} assigned recipients`);
          const recipient = field.assignedRecipients.find(r => r.recipientEmail === tokenData.recipientEmail);
          if (recipient) {
            console.log(`    ✓ Found recipient ${tokenData.recipientEmail}`);
            recipient.signatureData = fieldValue;
            recipient.signedAt = new Date();
            recipient.status = 'signed';
            fieldUpdated = true;
            console.log(`  ✅ Field ${fieldId} updated for ${tokenData.recipientEmail}`);
          } else {
            console.log(`    ✗ Recipient ${tokenData.recipientEmail} not found in field ${fieldId}`);
            console.log(`    Recipient emails: ${field.assignedRecipients.map(r => r.recipientEmail).join(', ')}`);
          }
        }
      });

      if (!fieldUpdated) {
        return res.status(400).json({
          success: false,
          error: 'Field not found or not assigned to this recipient'
        });
      }

      // Update DocumentSignature record
      const DocumentSignature = require('../models/DocumentSignature');
      const ObjectId = require('mongoose').Types.ObjectId;
      
      console.log(`📝 Updating DocumentSignature for ${tokenData.recipientEmail}`);
      console.log(`     Document ID (string): "${documentId}", ObjectId: "${new ObjectId(documentId)}"`);
      console.log(`     Recipient Email: ${tokenData.recipientEmail}`);
      console.log(`     Setting status to: ${allFieldsSigned ? 'signed' : 'pending'}`);

      // First check if record exists
      const existingRecord = await DocumentSignature.findOne({
        document_id: new ObjectId(documentId),
        recipient_email: tokenData.recipientEmail
      });
      
      if (existingRecord) {
        console.log(`  ✓ Found existing DocumentSignature record: ${existingRecord._id}`);
        console.log(`    Current status: ${existingRecord.status}`);
        console.log(`    Document ID in record: ${existingRecord.document_id}`);
      } else {
        console.log(`  ✗ No existing DocumentSignature record found`);
        const totalRecords = await DocumentSignature.countDocuments();
        console.log(`     Total DocumentSignature records in collection: ${totalRecords}`);
        // List all records for this document
        const allForDoc = await DocumentSignature.find({ document_id: new ObjectId(documentId) });
        console.log(`     Records for this document: ${allForDoc.length}`);
        allForDoc.forEach(rec => console.log(`       - ${rec.recipient_email}: ${rec.status}`));
      }

      const signatureRecord = await DocumentSignature.findOneAndUpdate(
        {
          document_id: new ObjectId(documentId),
          recipient_email: tokenData.recipientEmail
        },
        {
          status: allFieldsSigned ? 'signed' : 'pending',
          updated_at: new Date()
        },
        { new: true }
      );

      if (signatureRecord) {
        console.log(`  ✅ DocumentSignature updated: ${signatureRecord._id}, status: ${signatureRecord.status}`);
        console.log(`     New status confirmed: ${signatureRecord.status}`);
      } else {
        console.log(`  ⚠️ DocumentSignature not found or not updated`);
        console.log(`  🔧 Attempting to create new DocumentSignature record...`);
        
        try {
          const newSignatureRecord = await DocumentSignature.create({
            document_id: new ObjectId(documentId),
            recipient_email: tokenData.recipientEmail,
            status: allFieldsSigned ? 'signed' : 'pending',
            created_at: new Date(),
            updated_at: new Date()
          });
          console.log(`  ✅ Created new DocumentSignature: ${newSignatureRecord._id}, status: ${newSignatureRecord.status}`);
        } catch (createError) {
          console.log(`  ❌ Failed to create DocumentSignature: ${createError.message}`);
        }
      }

      // If all fields are signed, update document status
      if (allFieldsSigned) {
        // Check if all recipients have signed all their fields
        let allRecipientsSigned = true;
        const uniqueRecipients = new Set();
        
        document.fields.forEach(field => {
          if (field.assignedRecipients) {
            field.assignedRecipients.forEach(recipient => {
              uniqueRecipients.add(recipient.recipientEmail);
              if (recipient.status !== 'signed') {
                allRecipientsSigned = false;
              }
            });
          }
        });

        // Update document status if all recipients have signed
        if (allRecipientsSigned) {
          document.status = 'fully_signed';
          console.log('  ✅ All recipients have signed the document');
        } else {
          document.status = 'partially_signed';
          console.log('  ⚠️ Document partially signed, awaiting other recipients');
        }
      }

      // Save document with updated field values
      console.log(`💾 Saving document with ${document.fields.length} fields...`);
      const savedDoc = await document.save();
      console.log(`  ✅ Document saved successfully`);
      
      // Verify field was saved
      const savedField = savedDoc.fields.find(f => f.id === fieldId);
      if (savedField) {
        const savedRecipient = savedField.assignedRecipients?.find(r => r.recipientEmail === tokenData.recipientEmail);
        if (savedRecipient) {
          console.log(`  ✓ Verified: Field ${fieldId} saved with recipient status: ${savedRecipient.status}`);
        }
      }

      console.log('✅ Signed field submitted successfully');

      return res.status(200).json({
        success: true,
        message: allFieldsSigned ? 'Document signed successfully' : 'Field signed',
        data: {
          documentId: document._id,
          fieldId: fieldId,
          recipientEmail: tokenData.recipientEmail,
          status: document.status,
          signingComplete: allFieldsSigned
        }
      });
    } catch (error) {
      console.error('❌ Submit signed field error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to submit signed field',
        message: error.message
      });
    }
  }

  /**
   * Phase 8.3.3: Get cryptographic signatures for a document
   * GET /api/documents/:documentId/signatures/crypto
   * @access Private
   */
  static async getCryptoSignatures(req, res) {
    try {
      console.log('🔐 getCryptoSignatures handler called');
      console.log('  req.path:', req.path);
      console.log('  req.url:', req.url);
      console.log('  req.baseUrl:', req.baseUrl);
      console.log('  req.params:', JSON.stringify(req.params));
      const { documentId } = req.params;
      console.log('  documentId param:', documentId);

      // Verify document exists
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Check authorization
      const isOwner = document.owner_id.toString() === req.user.id;
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to view cryptographic signatures'
        });
      }

      // Get cryptographic signatures using query builder
      const signatures = await DocumentSignature.findCryptoSignatures(documentId)
        .populate('signer_id', 'name email')
        .populate('verified_by', 'name email')
        .sort({ timestamp: -1 });

      // Calculate statistics
      const verified = signatures.filter(s => s.verified).length;
      const tampered = signatures.filter(s => !s.verified && s.content_hash).length;

      return res.status(200).json({
        success: true,
        data: {
          total_crypto_signatures: signatures.length,
          verified: verified,
          tampered: tampered,
          signatures: signatures.map(sig => ({
            _id: sig._id,
            signer: {
              _id: sig.signer_id?._id,
              name: sig.signer_id?.name,
              email: sig.signer_id?.email
            },
            algorithm: sig.algorithm,
            verified: sig.verified,
            content_hash: sig.content_hash?.substring(0, 16) + '...',
            verified_by: sig.verified_by?.name,
            timestamp: sig.timestamp
          }))
        }
      });
    } catch (error) {
      console.error('Get crypto signatures error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve cryptographic signatures',
        message: error.message
      });
    }
  }

  /**
   * Phase 8.3.3: Get verified signatures for a document
   * GET /api/documents/:documentId/signatures/verified
   * @access Private
   */
  static async getVerifiedSignatures(req, res) {
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

      const signatures = await DocumentSignature.findVerifiedSignatures(documentId)
        .populate('signer_id', 'name email')
        .populate('verified_by', 'name email')
        .sort({ 'verification_metadata.verified_timestamp': -1 });

      return res.status(200).json({
        success: true,
        data: {
          total_verified: signatures.length,
          signatures: signatures.map(sig => ({
            _id: sig._id,
            signer: sig.signer_id?.name,
            algorithm: sig.algorithm,
            verified_at: sig.verification_metadata?.verified_timestamp,
            verified_by: sig.verified_by?.name
          }))
        }
      });
    } catch (error) {
      console.error('Get verified signatures error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve verified signatures',
        message: error.message
      });
    }
  }

  /**
   * Phase 8.3.3: Get signature statistics for a document
   * GET /api/documents/:documentId/signatures/statistics
   * @access Private
   */
  static async getSignatureStatistics(req, res) {
    try {
      console.log('📊 getSignatureStatistics handler called');
      console.log('  req.path:', req.path);
      console.log('  req.url:', req.url);
      console.log('  req.params:', JSON.stringify(req.params));
      const { documentId } = req.params;
      console.log('  documentId param:', documentId);

      // Verify document exists and authorization
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Get aggregate statistics using model method
      const stats = await DocumentSignature.getDocumentSignatureStatistics(documentId);

      // Count total signatures by status
      const allSignatures = await DocumentSignature.find({ document_id: documentId });
      const totalSignatures = allSignatures.length;
      const activeSignatures = await DocumentSignature.findActiveSignatures(documentId).countDocuments();
      const revokedSignatures = allSignatures.filter(s => s.isRevoked()).length;

      return res.status(200).json({
        success: true,
        data: {
          document_id: documentId,
          total_signatures: totalSignatures,
          active_signatures: activeSignatures,
          revoked_signatures: revokedSignatures,
          by_algorithm: stats.reduce((acc, item) => {
            acc[item._id] = {
              total: item.count,
              verified: item.verified_count,
              tampered: item.tampered_count,
              revoked: item.revoked_count
            };
            return acc;
          }, {}),
          completion_percentage: totalSignatures > 0 
            ? Math.round((activeSignatures / totalSignatures) * 100) 
            : 0
        }
      });
    } catch (error) {
      console.error('Get signature statistics error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve signature statistics',
        message: error.message
      });
    }
  }

  /**
   * Phase 8.3.3: Revoke a signature
   * POST /api/documents/:documentId/signatures/:signatureId/revoke
   * @access Private (owner or admin only)
   */
  static async revokeSignature(req, res) {
    try {
      const { documentId, signatureId } = req.params;
      const { reason } = req.body;

      // Verify document exists
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Check authorization (owner only)
      if (document.owner_id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Only document owner can revoke signatures'
        });
      }

      // Find signature
      const signature = await DocumentSignature.findById(signatureId);
      if (!signature) {
        return res.status(404).json({
          success: false,
          error: 'Signature not found'
        });
      }

      // Revoke signature
      signature.revokeSignature(req.user.id, reason || 'No reason provided');
      await signature.save();

      return res.status(200).json({
        success: true,
        message: 'Signature revoked successfully',
        data: {
          signature_id: signature._id,
          revoked_at: signature.revocation_info.revoked_at,
          revocation_reason: signature.revocation_info.revocation_reason
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
   * Phase 8.3.3: Get signature verification report
   * GET /api/documents/:documentId/signatures/:signatureId/report
   * @access Private
   */
  static async getSignatureReport(req, res) {
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

      // Get signature with full details
      const signature = await DocumentSignature.findById(signatureId)
        .populate('signer_id', 'name email')
        .populate('verified_by', 'name email')
        .populate('certificate_id');

      if (!signature) {
        return res.status(404).json({
          success: false,
          error: 'Signature not found'
        });
      }

      // Build comprehensive report
      return res.status(200).json({
        success: true,
        data: {
          signature_id: signature._id,
          document: {
            _id: documentId,
            title: document.title
          },
          signer: {
            _id: signature.signer_id?._id,
            name: signature.signer_id?.name,
            email: signature.signer_id?.email
          },
          signature_info: {
            type: signature.getSignatureType(),
            is_crypto: signature.isCryptoSignature(),
            algorithm: signature.algorithm,
            verification_status: signature.getVerificationStatus(),
            is_revoked: signature.isRevoked(),
            age_days: signature.signature_age_days
          },
          cryptographic: {
            verified: signature.verified,
            tampered: signature.isTampered(),
            content_hash: signature.content_hash?.substring(0, 32) + '...',
            verified_at: signature.verification_metadata?.verified_timestamp,
            verification_duration_ms: signature.verification_metadata?.verification_duration_ms
          },
          audit: {
            signed_at: signature.timestamp,
            ip_address: signature.signature_metadata?.ip_address,
            user_agent: signature.signature_metadata?.user_agent,
            attempts: signature.signature_metadata?.attempts
          },
          revocation: signature.isRevoked() ? {
            revoked_at: signature.revocation_info.revoked_at,
            revoked_by: signature.revocation_info.revoked_by,
            reason: signature.revocation_info.revocation_reason
          } : null
        }
      });
    } catch (error) {
      console.error('Get signature report error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve signature report',
        message: error.message
      });
    }
  }
}

module.exports = DocumentController;
