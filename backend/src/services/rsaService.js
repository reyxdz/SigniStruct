const RSA = require('node-rsa');
const crypto = require('crypto');
const EncryptionService = require('./encryptionService');
const UserCertificate = require('../models/UserCertificate');
const SignatureAuditLog = require('../models/SignatureAuditLog');
const CryptoLogger = require('../utils/cryptoLogger');

/**
 * RSA Service
 * Handles RSA key pair generation, storage, and retrieval
 * Manages user certificates and cryptographic operations
 */
class RSAService {
  /**
   * Generate new 2048-bit RSA key pair
   * @returns {Promise<{ publicKey, privateKey, keySize, algorithm }>}
   * @throws {Error} If key generation fails
   */
  static async generateKeyPair(req = null) {
    try {
      console.log('[RSA] Generating new 2048-bit RSA key pair...');
      
      CryptoLogger.log(req, 'RSA', 'Generate RSA Key Pair — START', {
        algorithm: 'RSA',
        keySize: 2048,
        purpose: 'Creating public/private key pair for digital signatures'
      });

      // Generate 2048-bit RSA key pair
      // 2048-bit is industry standard (4096 is more secure but slower)
      const key = new RSA({ b: 2048 });
      
      const publicKey = key.exportKey('public');
      const privateKey = key.exportKey('private');
      
      console.log('[RSA] RSA key pair generated successfully');
      
      CryptoLogger.log(req, 'RSA', 'Generate RSA Key Pair — COMPLETE', {
        algorithm: 'RSA-2048',
        publicKeyLength: publicKey.length,
        privateKeyLength: privateKey.length,
        publicKeyPreview: publicKey.substring(0, 50) + '...',
        note: 'Public key can be shared. Private key must be kept secret.'
      });

      return {
        publicKey,
        privateKey,
        keySize: 2048,
        algorithm: 'RSA-2048'
      };
    } catch (error) {
      throw new Error(`Failed to generate RSA key pair: ${error.message}`);
    }
  }

  /**
   * Generate SHA256 fingerprint of public key
   * Used for certificate identification
   * @param {string} publicKey - Public key in PEM format
   * @returns {string} SHA256 fingerprint in hex format
   */
  static generateKeyFingerprint(publicKey, req = null) {
    try {
      const fingerprint = crypto
        .createHash('sha256')
        .update(publicKey)
        .digest('hex');

      CryptoLogger.log(req, 'HASH', 'Generate Key Fingerprint (SHA-256)', {
        algorithm: 'SHA-256',
        input: 'Public Key (PEM)',
        fingerprintPreview: fingerprint.substring(0, 16) + '...',
        purpose: 'Unique identifier for the certificate'
      });

      return fingerprint;
    } catch (error) {
      throw new Error(`Failed to generate key fingerprint: ${error.message}`);
    }
  }

  /**
   * Generate unique certificate ID
   * @returns {string} Unique certificate ID
   */
  static generateCertificateId() {
    return `cert_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate unique serial number for certificate
   * @returns {string} Unique serial number
   */
  static generateSerialNumber() {
    return crypto.randomBytes(20).toString('hex').toUpperCase();
  }

  /**
   * Create user certificate
   * Generates RSA keys, encrypts private key, and stores in database
   * 
   * @param {string} userId - MongoDB user ID
   * @param {string} encryptionKey - Key for encrypting private key (typically user password)
   * @param {object} userInfo - User information for certificate subject
   * @returns {Promise<object>} Created certificate with public key info
   * @throws {Error} If certificate creation fails
   */
  static async createUserCertificate(userId, encryptionKey, userInfo = {}, req = null) {
    try {
      console.log(`[RSA] Creating certificate for user ${userId}`);
      
      CryptoLogger.log(req, 'CERT', 'Create User Certificate — START', {
        userId: userId,
        userName: userInfo.name || 'Unknown',
        steps: '1) Generate RSA keys → 2) Encrypt private key → 3) Generate fingerprint → 4) Create certificate → 5) Save to DB'
      });

      // Step 1: Generate key pair
      const { publicKey, privateKey } = await this.generateKeyPair(req);
      
      // Step 2: Encrypt private key
      console.log('[RSA] Encrypting private key...');
      const encryptedPrivateKey = EncryptionService.encryptPrivateKey(
        privateKey,
        encryptionKey,
        req
      );
      
      // Step 3: Generate certificate metadata
      const certificateId = this.generateCertificateId();
      const serialNumber = this.generateSerialNumber();
      const fingerprint = this.generateKeyFingerprint(publicKey, req);
      
      // Step 4: Create certificate subject (X.509 format)
      const name = userInfo.name || 'SigniStruct User';
      const email = userInfo.email || '';
      const subject = `CN=${name},O=SigniStruct,emailAddress=${email}`;
      
      // Step 5: Calculate validity dates
      const notBefore = new Date();
      const notAfter = new Date();
      notAfter.setFullYear(notAfter.getFullYear() + 1); // Valid for 1 year
      
      // Step 6: Create X.509 certificate (simplified PEM format)
      // In production, would use node-forge or similar for proper X.509
      const certificatePem = `-----BEGIN CERTIFICATE-----
${Buffer.from(`Certificate for ${name}`).toString('base64')}
-----END CERTIFICATE-----`;
      
      // Step 7: Save to database
      console.log('[RSA] Saving certificate to database...');
      const userCertificate = await UserCertificate.create({
        user_id: userId,
        certificate_id: certificateId,
        public_key: publicKey,
        private_key_encrypted: encryptedPrivateKey,
        certificate_pem: certificatePem,
        issuer: 'SigniStruct',
        subject,
        serial_number: serialNumber,
        not_before: notBefore,
        not_after: notAfter,
        fingerprint_sha256: fingerprint,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Step 8: Log certificate generation
      console.log(`[RSA] Certificate created: ${certificateId}`);
      
      try {
        await SignatureAuditLog.create({
          signer_id: userId,
          action: 'certificate_generated',
          details: {
            certificate_id: certificateId,
            key_size: 2048,
            algorithm: 'RSA-2048',
            validity_period: '1 year',
            fingerprint: fingerprint
          },
          certificate_id: userCertificate._id,
          status: 'success',
          timestamp: new Date()
        });
      } catch (logError) {
        console.warn('[RSA] Warning: Could not log certificate generation:', logError.message);
      }
      
      // Return certificate info (without encrypted private key)
      return {
        success: true,
        certificate: {
          _id: userCertificate._id,
          certificate_id: certificateId,
          user_id: userId,
          public_key: publicKey,
          fingerprint_sha256: fingerprint,
          subject,
          not_before: notBefore,
          not_after: notAfter,
          status: 'active',
          created_at: userCertificate.created_at
        },
        message: 'Certificate created successfully'
      };
    } catch (error) {
      console.error('[RSA] Certificate creation failed:', error);
      throw new Error(`Failed to create user certificate: ${error.message}`);
    }
  }

  /**
   * Get user's certificate information
   * @param {string} userId - MongoDB user ID
   * @returns {Promise<object>} Certificate information (public data only)
   * @throws {Error} If certificate not found
   */
  static async getUserCertificate(userId) {
    try {
      const certificate = await UserCertificate.findOne({ user_id: userId });
      
      if (!certificate) {
        throw new Error(`No certificate found for user ${userId}`);
      }
      
      return {
        _id: certificate._id,
        certificate_id: certificate.certificate_id,
        user_id: certificate.user_id,
        public_key: certificate.public_key,
        fingerprint_sha256: certificate.fingerprint_sha256,
        subject: certificate.subject,
        not_before: certificate.not_before,
        not_after: certificate.not_after,
        status: certificate.status,
        created_at: certificate.created_at,
        is_expired: certificate.not_after < new Date(),
        is_revoked: certificate.status === 'revoked'
      };
    } catch (error) {
      throw new Error(`Failed to retrieve certificate: ${error.message}`);
    }
  }

  /**
   * Get user's encrypted private key
   * @param {string} userId - MongoDB user ID
   * @returns {Promise<string>} Encrypted private key
   * @throws {Error} If certificate not found
   */
  static async getUserEncryptedPrivateKey(userId) {
    try {
      const certificate = await UserCertificate.findOne({ user_id: userId });
      
      if (!certificate) {
        throw new Error(`No certificate found for user ${userId}`);
      }
      
      return certificate.private_key_encrypted;
    } catch (error) {
      throw new Error(`Failed to retrieve encrypted private key: ${error.message}`);
    }
  }

  /**
   * Decrypt and retrieve user's private key
   * Requires correct decryption key (typically password)
   * 
   * @param {string} userId - MongoDB user ID
   * @param {string} decryptionKey - Key for decrypting private key
   * @returns {Promise<string>} Decrypted private key in PEM format
   * @throws {Error} If decryption fails or key is incorrect
   */
  static async getUserPrivateKey(userId, decryptionKey) {
    try {
      const encrypted = await this.getUserEncryptedPrivateKey(userId);
      const privateKey = EncryptionService.decryptPrivateKey(
        encrypted,
        decryptionKey
      );
      
      return privateKey;
    } catch (error) {
      throw new Error(`Failed to decrypt private key: ${error.message}`);
    }
  }

  /**
   * Check if user's certificate is valid
   * @param {string} userId - MongoDB user ID
   * @returns {Promise<boolean>} True if valid, false if expired or revoked
   */
  static async isCertificateValid(userId) {
    try {
      const certificate = await UserCertificate.findOne({ user_id: userId });
      
      if (!certificate) return false;
      if (certificate.status === 'revoked') return false;
      if (certificate.not_after < new Date()) return false;
      
      return true;
    } catch (error) {
      console.error('[RSA] Error checking certificate validity:', error);
      return false;
    }
  }

  /**
   * Revoke user's certificate
   * @param {string} userId - MongoDB user ID
   * @param {string} reason - Reason for revocation
   * @returns {Promise<object>} Updated certificate
   * @throws {Error} If revocation fails
   */
  static async revokeCertificate(userId, reason = 'User requested') {
    try {
      console.log(`[RSA] Revoking certificate for user ${userId}`);
      
      const certificate = await UserCertificate.findOneAndUpdate(
        { user_id: userId },
        {
          status: 'revoked',
          revoked_at: new Date(),
          revocation_reason: reason,
          updated_at: new Date()
        },
        { new: true }
      );
      
      if (!certificate) {
        throw new Error(`Certificate not found for user ${userId}`);
      }
      
      // Log revocation
      try {
        await SignatureAuditLog.create({
          signer_id: userId,
          action: 'certificate_revoked',
          details: {
            certificate_id: certificate.certificate_id,
            reason: reason
          },
          certificate_id: certificate._id,
          status: 'success',
          timestamp: new Date()
        });
      } catch (logError) {
        console.warn('[RSA] Warning: Could not log certificate revocation:', logError.message);
      }
      
      console.log(`[RSA] Certificate revoked: ${certificate.certificate_id}`);
      
      return certificate;
    } catch (error) {
      throw new Error(`Failed to revoke certificate: ${error.message}`);
    }
  }

  /**
   * Get user's public key by ID
   * Used for signature verification
   * 
   * @param {string} userId - MongoDB user ID
   * @returns {Promise<string>} Public key in PEM format
   * @throws {Error} If certificate not found
   */
  static async getUserPublicKey(userId) {
    try {
      const certificate = await UserCertificate.findOne({ user_id: userId });
      
      if (!certificate) {
        throw new Error(`No certificate found for user ${userId}`);
      }
      
      return certificate.public_key;
    } catch (error) {
      throw new Error(`Failed to retrieve public key: ${error.message}`);
    }
  }

  /**
   * Sign data using RSA private key
   * Used for document signing
   * 
   * @param {string} data - Data to sign (typically document hash)
   * @param {string} privateKey - Private key in PEM format
   * @returns {string} Signature in base64 format
   * @throws {Error} If signing fails
   */
  static signData(data, privateKey, req = null) {
    try {
      CryptoLogger.log(req, 'SIGN', 'RSA Sign Data', {
        algorithm: 'RSA-SHA256 (PKCS#1 v1.5)',
        dataLength: data.length,
        dataPreview: data.substring(0, 16) + '...',
        outputFormat: 'base64'
      });

      const key = new RSA(privateKey);
      const signature = key.sign(data, 'base64', 'utf8');

      CryptoLogger.log(req, 'SIGN', 'RSA Sign Data — COMPLETE', {
        signatureLength: signature.length,
        signaturePreview: signature.substring(0, 20) + '...',
        note: 'Data signed with RSA private key. Verify with corresponding public key.'
      });

      return signature;
    } catch (error) {
      throw new Error(`Failed to sign data: ${error.message}`);
    }
  }

  /**
   * Verify RSA signature
   * Used for signature verification
   * 
   * @param {string} data - Original data that was signed
   * @param {string} signature - Signature in base64 format
   * @param {string} publicKey - Public key in PEM format
   * @returns {boolean} True if signature is valid, false otherwise
   */
  static verifySignature(data, signature, publicKey, req = null) {
    try {
      CryptoLogger.log(req, 'VERIFY', 'RSA Verify Signature', {
        algorithm: 'RSA-SHA256 (PKCS#1 v1.5)',
        dataLength: data.length,
        signatureLength: signature.length,
        purpose: 'Verifying digital signature with signer\'s public key'
      });

      const key = new RSA(publicKey);
      const isValid = key.verify(data, signature, 'utf8', 'base64');

      CryptoLogger.log(req, 'VERIFY', `RSA Verify Signature — ${isValid ? 'VALID ✓' : 'INVALID ✗'}`, {
        result: isValid ? 'Signature is mathematically valid' : 'Signature does NOT match',
        isValid
      });

      return isValid;
    } catch (error) {
      console.error('[RSA] Signature verification error:', error.message);
      return false;
    }
  }

  /**
   * Get all certificates for statistics or admin purposes
   * @param {object} filter - MongoDB filter query
   * @returns {Promise<array>} List of certificates
   */
  static async getAllCertificates(filter = {}) {
    try {
      const certificates = await UserCertificate.find(filter)
        .select('-private_key_encrypted')
        .sort({ created_at: -1 });
      return certificates;
    } catch (error) {
      throw new Error(`Failed to retrieve certificates: ${error.message}`);
    }
  }

  /**
   * Get certificate statistics
   * @returns {Promise<object>} Statistics about certificates
   */
  static async getCertificateStatistics() {
    try {
      const total = await UserCertificate.countDocuments();
      const active = await UserCertificate.countDocuments({ status: 'active' });
      const revoked = await UserCertificate.countDocuments({ status: 'revoked' });
      const expired = await UserCertificate.countDocuments({
        status: 'active',
        not_after: { $lt: new Date() }
      });
      
      return {
        total,
        active,
        revoked,
        expired,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get certificate statistics: ${error.message}`);
    }
  }
}

module.exports = RSAService;
