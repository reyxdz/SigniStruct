const NodeRSA = require('node-rsa');
const crypto = require('crypto');
const Document = require('../models/Document');
const DocumentSignature = require('../models/DocumentSignature');
const UserCertificate = require('../models/UserCertificate');
const SignatureAuditLog = require('../models/SignatureAuditLog');
const CertificateService = require('./certificateService');
const EncryptionService = require('./encryptionService');
const mongoose = require('mongoose');

/**
 * Digital Signature Service
 * Handles document signing, signature verification, and cryptographic operations
 */
class SigningService {
  /**
   * Sign a document with user's private key
   * 
   * Process:
   * 1. Validate document and user
   * 2. Get document hash
   * 3. Get user's certificate and decrypt private key
   * 4. Sign document hash with private key (RSA)
   * 5. Create signature object
   * 6. Store signature
   * 7. Update document status
   * 8. Log action to audit trail
   * 
   * @param {string} documentId - Document to be signed
   * @param {string} userId - User performing the signature
   * @param {Object} signatureData - Signature metadata
   * @param {string} signatureData.userSignatureId - Reference to user's saved signature
   * @param {Object} signatureData.placement - Signature placement on document
   * @param {number} signatureData.placement.x - X coordinate
   * @param {number} signatureData.placement.y - Y coordinate
   * @param {number} signatureData.placement.width - Signature width
   * @param {number} signatureData.placement.height - Signature height
   * @param {number} signatureData.placement.page - Page number
   * @param {string} encryptionKey - Master encryption key for decrypting private key
   * @param {Object} metadata - Additional metadata (ip_address, user_agent)
   * @returns {Promise<Object>} Signed signature object with verification details
   * @throws {Error} If signing fails for any reason
   */
  static async signDocument(documentId, userId, signatureData, encryptionKey, metadata = {}) {
    let session = null;
    let useTransactions = false;
    
    // NOTE: Transactions are disabled for standalone MongoDB compatibility
    // In production with replica sets, you can enable this:
    /*
    try {
      session = await mongoose.startSession();
      await session.startTransaction();
      useTransactions = true;
    } catch (error) {
      console.warn('[WARN] Transactions not supported:', error.message);
      useTransactions = false;
      session = null;
    }
    */

    try {
      // Validate inputs
      if (!documentId || !userId || !signatureData) {
        throw new Error('Missing required parameters: documentId, userId, or signatureData');
      }

      if (!encryptionKey) {
        throw new Error('Encryption key required for decrypting private key');
      }

      // 1. Get and validate document
      let documentQuery = Document.findById(documentId);
      if (useTransactions && session) {
        documentQuery = documentQuery.session(session);
      }
      const document = await documentQuery;
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // 2. Get document hash
      const documentHash = document.file_hash_sha256;
      if (!documentHash) {
        throw new Error('Document does not have a valid hash');
      }

      // 3. Get user's certificate
      let certQuery = UserCertificate.findOne({ user_id: userId });
      if (useTransactions && session) {
        certQuery = certQuery.session(session);
      }
      const certificate = await certQuery;
      if (!certificate) {
        throw new Error(`No certificate found for user: ${userId}`);
      }

      // Verify certificate is valid
      const now = new Date();
      if (certificate.not_before > now || certificate.not_after < now) {
        throw new Error('Certificate is not valid in the current time period');
      }

      // 4. Decrypt private key
      let privateKey;
      try {
        privateKey = EncryptionService.decryptPrivateKey(
          certificate.private_key_encrypted,
          encryptionKey
        );
      } catch (error) {
        throw new Error(`Failed to decrypt private key: ${error.message}`);
      }

      // 5. Sign document hash with private key (RSA)
      const signatureHash = this._signHash(documentHash, privateKey);

      // 6. Create signature object
      const documentSignature = new DocumentSignature({
        document_id: documentId,
        signer_id: userId,
        certificate_id: certificate._id,
        signature_hash: signatureHash,
        user_signature_id: signatureData.userSignatureId,
        document_hash: documentHash,
        signature_placement: signatureData.placement || {},
        is_valid: true,
        verification_timestamp: new Date()
      });

      // 7. Save signature
      if (useTransactions) {
        await documentSignature.save({ session });
      } else {
        await documentSignature.save();
      }

      // 8. Update document status
      // Check if this completes all required signatures
      let sigQuery = DocumentSignature.find({
        document_id: documentId
      });
      if (useTransactions && session) {
        sigQuery = sigQuery.session(session);
      }
      const allSignatures = await sigQuery;

      const requiredSigners = document.signers || [];
      const completedSigners = allSignatures.map(sig => sig.signer_id.toString());
      
      let newStatus = 'partially_signed';
      if (completedSigners.length === requiredSigners.length) {
        newStatus = 'fully_signed';
      }

      document.status = newStatus;
      document.updated_at = new Date();
      if (useTransactions) {
        await document.save({ session });
      } else {
        await document.save();
      }

      // 9. Log to audit trail
      const auditEntry = {
        signer_id: userId,
        document_id: documentId,
        action: 'document_signed',
        timestamp: new Date(),
        ip_address: metadata.ip_address || null,
        user_agent: metadata.user_agent || null,
        details: {
          certificate_id: certificate._id,
          signature_hash: signatureHash.substring(0, 50) + '...',
          document_hash: documentHash.substring(0, 50) + '...',
          placement: signatureData.placement
        },
        status: 'success'
      };
      
      if (useTransactions) {
        await SignatureAuditLog.create([auditEntry], { session });
      } else {
        await SignatureAuditLog.create(auditEntry);
      }

      if (session && useTransactions) {
        await session.commitTransaction();
      }

      return {
        _id: documentSignature._id,
        document_id: documentId,
        signer_id: userId,
        certificate_id: certificate._id,
        signature_hash: signatureHash,
        document_hash: documentHash,
        is_valid: true,
        verification_timestamp: documentSignature.verification_timestamp,
        message: 'Document signed successfully'
      };
    } catch (error) {
      if (session && useTransactions) {
        try {
          await session.abortTransaction();
        } catch (abortError) {
          console.error('[ERROR] Failed to abort transaction:', abortError.message);
        }
      }

      // Log failure to audit trail
      try {
        const auditLog = new SignatureAuditLog({
          signer_id: userId,
          document_id: documentId,
          action: 'document_signed',
          timestamp: new Date(),
          ip_address: metadata.ip_address || null,
          user_agent: metadata.user_agent || null,
          details: {
            error: error.message,
            signature_data: signatureData
          },
          status: 'failure'
        });
        await auditLog.save();
      } catch (logError) {
        console.error('Failed to log signing failure:', logError);
      }

      throw error;
    } finally {
      if (session && useTransactions) {
        try {
          await session.endSession();
        } catch (error) {
          console.error('[ERROR] Failed to end session:', error.message);
        }
      }
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * PHASE 8.3.1: RSA Cryptographic Signing Methods
   * ═══════════════════════════════════════════════════════════════════
   */

  /**
   * Calculate SHA-256 hash of document or field content
   * Used for creating the hash that will be signed with RSA private key
   * 
   * @param {Buffer|string} content - Document or field content
   * @returns {string} SHA-256 hash in hexadecimal format
   * @throws {Error} If hash calculation fails
   */
  static calculateDocumentHash(content) {
    try {
      const hash = crypto.createHash('sha256');
      
      // Handle both buffer and string content
      if (Buffer.isBuffer(content)) {
        hash.update(content);
      } else if (typeof content === 'string') {
        hash.update(content);
      } else if (typeof content === 'object') {
        // If it's an object, stringify it
        hash.update(JSON.stringify(content));
      } else {
        hash.update(String(content));
      }
      
      return hash.digest('hex');
    } catch (error) {
      throw new Error(`Failed to calculate document hash: ${error.message}`);
    }
  }

  /**
   * Cryptographically sign a field with user's RSA private key
   * 
   * Process:
   * 1. Calculate SHA-256 hash of field content
   * 2. Decrypt user's private key using encryption key
   * 3. Sign hash with RSA private key
   * 4. Calculate integrity hash of the signature itself
   * 5. Return cryptographic signature data
   * 
   * @param {string} documentId - Document being signed
   * @param {string|Buffer} fieldContent - Field value to sign
   * @param {string} userId - Signer's user ID
   * @param {string} encryptionKey - Master encryption key for decrypting private key
   * @returns {Promise<Object>} Cryptographic signature with metadata
   * @throws {Error} If signing fails
   */
  static async signField(documentId, fieldContent, userId, encryptionKey) {
    try {
      // 1. Calculate hash of field content
      const contentHash = this.calculateDocumentHash(fieldContent);
      console.log(`[SIGN] Field hash calculated: ${contentHash.substring(0, 16)}...`);

      // 2. Get user's certificate and private key
      const certificate = await UserCertificate.findOne({ user_id: userId });
      if (!certificate) {
        throw new Error(`No certificate found for user ${userId}`);
      }

      // Verify certificate is valid
      const now = new Date();
      if (certificate.not_before > now) {
        throw new Error('Certificate is not yet valid');
      }
      if (certificate.not_after < now) {
        throw new Error('Certificate has expired');
      }
      if (certificate.status === 'revoked') {
        throw new Error('Certificate has been revoked');
      }

      // 3. Decrypt private key
      let privateKey;
      try {
        privateKey = EncryptionService.decryptPrivateKey(
          certificate.private_key_encrypted,
          encryptionKey
        );
      } catch (error) {
        throw new Error(`Failed to decrypt private key: ${error.message}`);
      }

      // 4. Sign the hash with private key (RSA-SHA256)
      const signatureHex = this._signHash(contentHash, privateKey);
      console.log(`[SIGN] Signature created: ${signatureHex.substring(0, 16)}...`);

      // 5. Calculate integrity hash of signature itself
      const signatureHash = crypto
        .createHash('sha256')
        .update(signatureHex)
        .digest('hex');

      // 6. Return signature data
      const result = {
        signature: signatureHex,
        content_hash: contentHash,
        signature_hash: signatureHash,
        algorithm: 'RSA-SHA256',
        timestamp: new Date(),
        signer_id: userId,
        document_id: documentId,
        certificate_id: certificate._id,
        verified: true // Mark as cryptographically signed
      };

      console.log(`[SIGN] Signature data complete for field in document ${documentId}`);
      return result;

    } catch (error) {
      console.error('[ERROR] Field signing failed:', error.message);
      throw new Error(`Failed to sign field: ${error.message}`);
    }
  }

  /**
   * Verify a cryptographic signature against field/document content
   * 
   * Process:
   * 1. Get signer's public key from certificate
   * 2. Verify signature using RSA public key
   * 3. Return verification result
   * 
   * @param {string} signatureHex - Hex-encoded RSA signature
   * @param {string} contentHash - Original content hash  (SHA-256)
   * @param {string} userId - Signer's user ID (to get public key)
   * @returns {Promise<Object>} Verification result with validity and metadata
   * @throws {Error} If verification fails
   */
  static async verifyCryptographicSignature(signatureHex, contentHash, userId) {
    try {
      // 1. Get signer's certificate and public key
      const certificate = await UserCertificate.findOne({ user_id: userId });
      if (!certificate) {
        throw new Error(`No certificate found for user ${userId}`);
      }

      if (certificate.status !== 'active') {
        return {
          is_valid: false,
          reason: 'Certificate is not active',
          certificate_status: certificate.status
        };
      }

      // 2. Verify signature against content hash
      const isValid = this._verifyHashSignature(contentHash, signatureHex, certificate.public_key);

      // 3. Return verification result
      const result = {
        is_valid: isValid,
        signature_hex: signatureHex.substring(0, 32) + '...',
        content_hash: contentHash.substring(0, 32) + '...',
        signer_id: userId,
        certificate_id: certificate._id,
        certificate_fingerprint: certificate.fingerprint_sha256,
        algorithm: 'RSA-SHA256',
        timestamp: new Date()
      };

      if (isValid) {
        result.reason = 'Signature verified successfully';
      } else {
        result.reason = 'Signature verification failed - invalid signature';
      }

      console.log(`[VERIFY] Signature ${isValid ? 'valid' : 'invalid'} for user ${userId}`);
      return result;

    } catch (error) {
      console.error('[ERROR] Signature verification error:', error.message);
      return {
        is_valid: false,
        reason: `Verification error: ${error.message}`,
        signer_id: userId
      };
    }
  }

  /**
   * Sign entire document with all field values
   * Creates a comprehensive signature covering all document fields
   * 
   * @param {string} documentId - Document to sign
   * @param {Object} allFieldValues - All field values in document
   * @param {string} userId - Signer's user ID
   * @param {string} encryptionKey - Master encryption key
   * @returns {Promise<Object>} Complete document signature data
   * @throws {Error} If signing fails
   */
  static async signCompleteDocument(documentId, allFieldValues, userId, encryptionKey) {
    try {
      // 1. Create document JSON representation
      const documentJson = JSON.stringify(allFieldValues, null, 2);

      // 2. Calculate document hash
      const documentHash = this.calculateDocumentHash(documentJson);
      console.log(`[SIGN] Document hash: ${documentHash.substring(0, 16)}...`);

      // 3. Get user's certificate and private key
      const certificate = await UserCertificate.findOne({ user_id: userId });
      if (!certificate) {
        throw new Error(`No certificate found for user ${userId}`);
      }

      // 4. Decrypt private key
      let privateKey;
      try {
        privateKey = EncryptionService.decryptPrivateKey(
          certificate.private_key_encrypted,
          encryptionKey
        );
      } catch (error) {
        throw new Error(`Failed to decrypt private key: ${error.message}`);
      }

      // 5. Sign document hash with private key
      const documentSignature = this._signHash(documentHash, privateKey);

      // 6. Get signer certificate info
      const result = {
        document_id: documentId,
        document_hash: documentHash,
        document_signature: documentSignature,
        signer_id: userId,
        signer_certificate_id: certificate._id,
        algorithm: 'RSA-SHA256',
        timestamp: new Date(),
        field_count: Object.keys(allFieldValues).length,
        all_fields_signed: true,
        verified: true
      };

      console.log(`[SIGN] Complete document signed: ${documentId}`);
      return result;

    } catch (error) {
      console.error('[ERROR] Complete document signing failed:', error.message);
      throw new Error(`Failed to sign complete document: ${error.message}`);
    }
  }

  /**
   * End Phase 8.3.1 Methods
   * ═══════════════════════════════════════════════════════════════════
   */

  /**
   * Verify a stored signature against a document hash (Phase 8.1 method)
   * 
   * Process:
   * 1. Get certificate and public key
   * 2. Verify signature against document hash using public key (RSA)
   * 3. Verify certificate validity
   * 4. Update verification status
   * 5. Log verification action
   * 
   * @param {string} signatureHash - The signature to verify (hexadecimal string)
   * @param {string} documentHash - The document hash that was signed
   * @param {string} certificateId - Certificate ID used for signing
   * @param {Object} metadata - Additional metadata (ip_address, user_agent)
   * @returns {Promise<Object>} Verification result with validity status
   * @throws {Error} If verification fails
   */
  static async verifySignature(signatureHash, documentHash, certificateId, metadata = {}) {
    try {
      // Validate inputs
      if (!signatureHash || !documentHash || !certificateId) {
        throw new Error('Missing required parameters for verification');
      }

      // 1. Get certificate
      const certificate = await UserCertificate.findById(certificateId);
      if (!certificate) {
        throw new Error(`Certificate not found: ${certificateId}`);
      }

      // 2. Get public key from certificate
      const publicKey = certificate.public_key;
      if (!publicKey) {
        throw new Error('Certificate does not have a public key');
      }

      // 3. Verify signature
      const isValid = this._verifyHashSignature(documentHash, signatureHash, publicKey);

      // 4. Verify certificate is valid
      const now = new Date();
      let certificateValid = true;
      let certificateStatus = 'active';

      if (certificate.not_before > now) {
        certificateValid = false;
        certificateStatus = 'not_yet_valid';
      } else if (certificate.not_after < now) {
        certificateValid = false;
        certificateStatus = 'expired';
      }

      const finalValidity = isValid && certificateValid;

      // 5. Update verification timestamp if valid
      if (finalValidity) {
        await DocumentSignature.findOneAndUpdate(
          { signature_hash: signatureHash },
          { 
            is_valid: true,
            verification_timestamp: new Date()
          }
        );
      }

      // 6. Log verification action
      const signatureRecord = await DocumentSignature.findOne({ signature_hash: signatureHash });
      
      if (signatureRecord) {
        await SignatureAuditLog.create({
          signer_id: signatureRecord.signer_id,
          document_id: signatureRecord.document_id,
          action: 'signature_verified',
          timestamp: new Date(),
          ip_address: metadata.ip_address || null,
          user_agent: metadata.user_agent || null,
          details: {
            certificate_id: certificateId,
            signature_valid: isValid,
            certificate_valid: certificateValid,
            certificate_status: certificateStatus,
            signature_hash: signatureHash.substring(0, 50) + '...',
            document_hash: documentHash.substring(0, 50) + '...'
          },
          status: finalValidity ? 'success' : 'failure'
        });
      }

      return {
        is_valid: finalValidity,
        signature_valid: isValid,
        certificate_valid: certificateValid,
        certificate_status: certificateStatus,
        verification_timestamp: new Date(),
        certificate_id: certificateId,
        message: finalValidity ? 'Signature verified successfully' : 'Signature verification failed'
      };
    } catch (error) {
      throw new Error(`Signature verification failed: ${error.message}`);
    }
  }

  /**
   * Verify multiple signatures on a document
   * 
   * @param {string} documentId - Document ID to verify
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Verification results for all signatures
   */
  static async verifyDocument(documentId, metadata = {}) {
    try {
      // Get document
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Get all signatures
      const signatures = await DocumentSignature.find({
        document_id: documentId
      }).populate('certificate_id');

      if (signatures.length === 0) {
        return {
          document_id: documentId,
          is_valid: false,
          message: 'No signatures found on document',
          signatures: []
        };
      }

      // Verify each signature
      const verificationResults = [];
      let allValid = true;

      for (const signature of signatures) {
        try {
          const result = await this.verifySignature(
            signature.signature_hash,
            signature.document_hash,
            signature.certificate_id._id,
            metadata
          );
          verificationResults.push({
            signature_id: signature._id,
            signer_id: signature.signer_id,
            ...result
          });

          if (!result.is_valid) {
            allValid = false;
          }
        } catch (error) {
          allValid = false;
          verificationResults.push({
            signature_id: signature._id,
            signer_id: signature.signer_id,
            is_valid: false,
            error: error.message
          });
        }
      }

      return {
        document_id: documentId,
        is_valid: allValid,
        total_signatures: signatures.length,
        valid_signatures: verificationResults.filter(r => r.is_valid).length,
        verification_timestamp: new Date(),
        signatures: verificationResults,
        message: allValid ? 'All signatures verified successfully' : 'Some signatures failed verification'
      };
    } catch (error) {
      throw new Error(`Document verification failed: ${error.message}`);
    }
  }

  /**
   * Private method: Sign a hash with RSA private key
   * Uses SHA-256 with PKCS#1 v1.5 padding
   * 
   * @param {string} hash - The hash to sign (hexadecimal string)
   * @param {string} privateKeyPEM - Private key in PEM format
   * @returns {string} Signature in hexadecimal format
   * @private
   */
  static _signHash(hash, privateKeyPEM) {
    try {
      // Create RSA key from PEM
      const key = new NodeRSA(privateKeyPEM);

      // Convert hash from hex to buffer
      const hashBuffer = Buffer.from(hash, 'hex');

      // Sign the hash
      const signature = key.sign(hashBuffer, 'hex');

      return signature;
    } catch (error) {
      throw new Error(`Hash signing failed: ${error.message}`);
    }
  }

  /**
   * Private method: Verify a signature against a hash with RSA public key
   * Uses SHA-256 with PKCS#1 v1.5 padding
   * 
   * @param {string} hash - The original hash (hexadecimal string)
   * @param {string} signatureHex - The signature (hexadecimal string)
   * @param {string} publicKeyPEM - Public key in PEM format
   * @returns {boolean} True if signature is valid, false otherwise
   * @private
   */
  static _verifyHashSignature(hash, signatureHex, publicKeyPEM) {
    try {
      // Create RSA key from PEM
      const key = new NodeRSA(publicKeyPEM);

      // Convert hash from hex to buffer
      const hashBuffer = Buffer.from(hash, 'hex');

      // Convert signature from hex to buffer
      const signatureBuffer = Buffer.from(signatureHex, 'hex');

      // Verify signature
      const isValid = key.verify(hashBuffer, signatureBuffer, 'hex', 'hex');

      return isValid;
    } catch (error) {
      // Invalid signature throws error
      return false;
    }
  }

  /**
   * Get signature details
   * 
   * @param {string} signatureId - Signature ID
   * @returns {Promise<Object>} Signature details with related data
   */
  static async getSignatureDetails(signatureId) {
    try {
      const signature = await DocumentSignature.findById(signatureId)
        .populate('document_id')
        .populate('signer_id', 'email name')
        .populate('certificate_id', 'certificate_id not_before not_after');

      if (!signature) {
        throw new Error(`Signature not found: ${signatureId}`);
      }

      return {
        _id: signature._id,
        document_id: signature.document_id,
        signer_id: signature.signer_id,
        certificate_id: signature.certificate_id,
        signature_hash: signature.signature_hash.substring(0, 50) + '...',
        document_hash: signature.document_hash.substring(0, 50) + '...',
        is_valid: signature.is_valid,
        verification_timestamp: signature.verification_timestamp,
        signature_placement: signature.signature_placement,
        created_at: signature.created_at
      };
    } catch (error) {
      throw new Error(`Failed to get signature details: ${error.message}`);
    }
  }
}

module.exports = SigningService;
