const NodeRSA = require('node-rsa');
const forge = require('node-forge');
const crypto = require('crypto');
const CryptoLogger = require('../utils/cryptoLogger');

/**
 * Certificate Service
 * Handles PKI certificate generation, encryption, and management
 */

class CertificateService {
  /**
   * Generate RSA key pair (2048-bit)
   * @returns {Object} { publicKey, privateKey }
   */
  static generateKeyPair(req = null) {
    CryptoLogger.log(req, 'RSA', 'Generate RSA-2048 Key Pair (CertificateService)', {
      algorithm: 'RSA',
      keySize: 2048,
      format: 'PKCS#8 PEM'
    });

    const key = new NodeRSA({ b: 2048 });
    const result = {
      publicKey: key.exportKey('pkcs8-public-pem'),
      privateKey: key.exportKey('pkcs8-private-pem')
    };

    CryptoLogger.log(req, 'RSA', 'RSA Key Pair Generated', {
      publicKeyLength: result.publicKey.length,
      privateKeyLength: result.privateKey.length
    });

    return result;
  }

  /**
   * Create self-signed certificate
   * @param {Object} keyPair - { publicKey, privateKey }
   * @param {Object} userInfo - { name, email, userId }
   * @param {number} validityYears - Certificate validity period in years (default: 5)
   * @returns {Object} Certificate object with metadata
   */
  static createSelfSignedCertificate(keyPair, userInfo, validityYears = 5, req = null) {
    try {
      CryptoLogger.log(req, 'CERT', 'Create Self-Signed X.509 Certificate', {
        subject: userInfo.name || 'SigniStruct User',
        email: userInfo.email,
        validityYears,
        signatureAlgorithm: 'SHA-256 with RSA'
      });

      // Import keys into forge format
      const privateKey = forge.pki.privateKeyFromPem(keyPair.privateKey);
      const publicKey = forge.pki.publicKeyFromPem(keyPair.publicKey);

      // Create certificate
      const cert = forge.pki.createCertificate();
      cert.publicKey = publicKey;

      // Set serial number
      cert.serialNumber = this._generateSerialNumber();

      // Set issuer and subject
      const attrs = [
        { name: 'commonName', value: userInfo.name || 'SigniStruct User' },
        { name: 'organizationName', value: 'SigniStruct' },
        { name: 'organizationalUnitName', value: 'Digital Signatures' },
        { name: 'countryName', value: 'US' },
        { name: 'stateOrProvinceName', value: 'Digital' },
        { name: 'localityName', value: 'Online' },
        { name: 'emailAddress', value: userInfo.email || 'user@signistruct.com' }
      ];

      cert.setSubject(attrs);
      cert.setIssuer(attrs);

      // Set validity
      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + validityYears);

      cert.validity.notBefore = now;
      cert.validity.notAfter = expiryDate;

      // Self-sign certificate
      cert.sign(privateKey, forge.md.sha256.create());

      CryptoLogger.log(req, 'CERT', 'Certificate Signed (Self-Signed)', {
        serialNumber: cert.serialNumber,
        algorithm: 'SHA-256 with RSA',
        validFrom: now.toISOString(),
        validUntil: expiryDate.toISOString()
      });

      // Export certificate to PEM
      const certPEM = forge.pki.certificateToPem(cert);

      // Generate certificate metadata
      const fingerprint = this._generateFingerprint(certPEM);

      CryptoLogger.log(req, 'HASH', 'Certificate Fingerprint (SHA-256)', {
        algorithm: 'SHA-256',
        fingerprintPreview: fingerprint.substring(0, 16) + '...'
      });

      return {
        certificate_pem: certPEM,
        public_key: keyPair.publicKey,
        certificate_id: this._generateCertificateId(userInfo.userId),
        serial_number: cert.serialNumber,
        issuer: 'SigniStruct',
        subject: `${userInfo.name} <${userInfo.email}>`,
        not_before: now,
        not_after: expiryDate,
        fingerprint_sha256: fingerprint,
        status: 'active'
      };
    } catch (error) {
      throw new Error(`Certificate creation failed: ${error.message}`);
    }
  }

  /**
   * Encrypt private key with AES-256
   * Uses a master key derived from environment or user-specific data
   * @param {string} privateKey - Private key in PEM format
   * @param {string} encryptionKey - Master encryption key (from env)
   * @param {string} userId - User ID for salt
   * @returns {string} Encrypted private key (Base64)
   */
  static encryptPrivateKey(privateKey, encryptionKey, userId, req = null) {
    try {
      // Generate IV and use PBKDF2 to derive key from master key and user ID
      const salt = Buffer.from(userId.substring(0, 16).padEnd(16, '0'));
      const iv = crypto.randomBytes(16);

      CryptoLogger.log(req, 'ENCRYPT', 'Encrypt Private Key (AES-256-CBC)', {
        algorithm: 'AES-256-CBC',
        keyDerivation: 'PBKDF2 (100,000 iterations, SHA-256)',
        ivSize: '16 bytes (random)',
        purpose: 'Encrypt RSA private key for secure storage'
      });

      // Derive key using PBKDF2
      const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha256');

      CryptoLogger.log(req, 'KEY', 'PBKDF2 Key Derivation', {
        algorithm: 'PBKDF2-HMAC-SHA256',
        iterations: 100000,
        keyLength: '256 bits (32 bytes)',
        saltSource: 'User ID (first 16 chars)'
      });

      // Create cipher and encrypt
      const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
      let encrypted = cipher.update(privateKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Combine IV and encrypted data
      const combined = iv.toString('hex') + ':' + encrypted;

      CryptoLogger.log(req, 'ENCRYPT', 'Private Key Encrypted Successfully', {
        outputFormat: 'hex (IV:ciphertext)',
        outputLength: combined.length
      });

      return combined;
    } catch (error) {
      throw new Error(`Private key encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt private key with AES-256
   * @param {string} encryptedKey - Encrypted private key (IV:encrypted format)
   * @param {string} encryptionKey - Master encryption key (from env)
   * @param {string} userId - User ID for salt
   * @returns {string} Decrypted private key in PEM format
   */
  static decryptPrivateKey(encryptedKey, encryptionKey, userId, req = null) {
    try {
      CryptoLogger.log(req, 'DECRYPT', 'Decrypt Private Key (AES-256-CBC)', {
        algorithm: 'AES-256-CBC',
        keyDerivation: 'PBKDF2 (100,000 iterations, SHA-256)',
        inputLength: encryptedKey.length,
        purpose: 'Retrieve RSA private key for signing operations'
      });

      // Split IV and encrypted data
      const parts = encryptedKey.split(':');
      if (parts.length !== 2) {
        throw new Error(`Invalid encrypted key format: expected 2 parts, got ${parts.length}`);
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      // Derive the same key
      const salt = Buffer.from(userId.substring(0, 16).padEnd(16, '0'));
      const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha256');

      CryptoLogger.log(req, 'KEY', 'PBKDF2 Key Derivation (for decryption)', {
        algorithm: 'PBKDF2-HMAC-SHA256',
        iterations: 100000,
        keyLength: '256 bits (32 bytes)'
      });

      // Create decipher and decrypt
      const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      if (!decrypted.includes('BEGIN RSA PRIVATE KEY') && !decrypted.includes('BEGIN PRIVATE KEY')) {
        console.warn('Decrypted content preview:', decrypted.substring(0, 100));
        throw new Error(`Decryption failed: Invalid key format (got: ${decrypted.substring(0, 20)}...)`);
      }

      CryptoLogger.log(req, 'DECRYPT', 'Private Key Decrypted Successfully', {
        keyFormat: 'PEM',
        keyLength: decrypted.length
      });

      return decrypted;
    } catch (error) {
      throw new Error(`Private key decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate a unique certificate ID
   * @param {string} userId - User ID
   * @returns {string} Certificate ID
   */
  static _generateCertificateId(userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `CERT-${userId}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate certificate serial number
   * @returns {string} Serial number in hex format
   */
  static _generateSerialNumber() {
    return Math.floor(Math.random() * 1000000000000).toString(16);
  }

  /**
   * Generate SHA-256 fingerprint of certificate
   * @param {string} certPEM - Certificate in PEM format
   * @returns {string} SHA-256 fingerprint (hex)
   */
  static _generateFingerprint(certPEM) {
    const cert = forge.pki.certificateFromPem(certPEM);
    const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).bytes();
    const md = forge.md.sha256.create();
    md.update(der);
    return md.digest().toHex().toUpperCase();
  }

  /**
   * Verify certificate validity
   * @param {Object} certificate - Certificate object with not_before and not_after
   * @returns {Object} { is_valid, not_expired, message }
   */
  static verifyCertificateValidity(certificate) {
    const now = new Date();
    const notBefore = new Date(certificate.not_before);
    const notAfter = new Date(certificate.not_after);

    if (now < notBefore) {
      return {
        is_valid: false,
        not_expired: true,
        message: 'Certificate is not yet valid'
      };
    }

    if (now > notAfter) {
      return {
        is_valid: false,
        not_expired: false,
        message: 'Certificate has expired'
      };
    }

    return {
      is_valid: true,
      not_expired: true,
      message: 'Certificate is valid'
    };
  }

  /**
   * Revoke a certificate
   * @param {Object} certificate - Certificate object
   * @param {string} reason - Revocation reason
   * @returns {Object} Updated certificate with revocation status
   */
  static revokeCertificate(certificate, reason = 'User requested') {
    certificate.status = 'revoked';
    certificate.revoked_at = new Date();
    certificate.revocation_reason = reason;
    return certificate;
  }

  /**
   * Full certificate generation workflow
   * Combines key generation, certificate creation, and encryption
   * @param {Object} userInfo - { name, email, userId }
   * @param {string} masterEncryptionKey - Master key from environment
   * @returns {Object} Complete certificate package
   */
  static generateCompleteCertificate(userInfo, masterEncryptionKey, req = null) {
    try {
      CryptoLogger.log(req, 'CERT', 'Full Certificate Generation Workflow — START', {
        user: userInfo.name,
        email: userInfo.email,
        pipeline: '1) Generate RSA key pair → 2) Create X.509 certificate → 3) Encrypt private key'
      });

      // Step 1: Generate key pair
      const keyPair = this.generateKeyPair(req);

      // Step 2: Create self-signed certificate
      const certData = this.createSelfSignedCertificate(keyPair, userInfo, 5, req);

      // Step 3: Encrypt private key
      const encryptedPrivateKey = this.encryptPrivateKey(
        keyPair.privateKey,
        masterEncryptionKey,
        userInfo.userId,
        req
      );

      CryptoLogger.log(req, 'CERT', 'Full Certificate Generation — COMPLETE ✓', {
        certificateId: certData.certificate_id,
        fingerprint: certData.fingerprint_sha256?.substring(0, 16) + '...',
        validUntil: certData.not_after?.toISOString(),
        status: 'active'
      });

      // Return complete certificate package (without unencrypted private key for security)
      return {
        certificate_id: certData.certificate_id,
        certificate_pem: certData.certificate_pem,
        public_key: certData.public_key,
        private_key_encrypted: encryptedPrivateKey,
        serial_number: certData.serial_number,
        issuer: certData.issuer,
        subject: certData.subject,
        not_before: certData.not_before,
        not_after: certData.not_after,
        fingerprint_sha256: certData.fingerprint_sha256,
        status: certData.status,
        created_at: new Date()
      };
    } catch (error) {
      throw new Error(`Certificate generation failed: ${error.message}`);
    }
  }
}

module.exports = CertificateService;
