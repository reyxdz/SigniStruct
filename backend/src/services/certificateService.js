const NodeRSA = require('node-rsa');
const forge = require('node-forge');
const crypto = require('crypto');

/**
 * Certificate Service
 * Handles PKI certificate generation, encryption, and management
 */

class CertificateService {
  /**
   * Generate RSA key pair (2048-bit)
   * @returns {Object} { publicKey, privateKey }
   */
  static generateKeyPair() {
    const key = new NodeRSA({ b: 2048 });
    return {
      publicKey: key.exportKey('pkcs8-public-pem'),
      privateKey: key.exportKey('pkcs8-private-pem')
    };
  }

  /**
   * Create self-signed certificate
   * @param {Object} keyPair - { publicKey, privateKey }
   * @param {Object} userInfo - { name, email, userId }
   * @param {number} validityYears - Certificate validity period in years (default: 5)
   * @returns {Object} Certificate object with metadata
   */
  static createSelfSignedCertificate(keyPair, userInfo, validityYears = 5) {
    try {
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

      // Export certificate to PEM
      const certPEM = forge.pki.certificateToPem(cert);

      // Generate certificate metadata
      return {
        certificate_pem: certPEM,
        public_key: keyPair.publicKey,
        certificate_id: this._generateCertificateId(userInfo.userId),
        serial_number: cert.serialNumber,
        issuer: 'SigniStruct',
        subject: `${userInfo.name} <${userInfo.email}>`,
        not_before: now,
        not_after: expiryDate,
        fingerprint_sha256: this._generateFingerprint(certPEM),
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
  static encryptPrivateKey(privateKey, encryptionKey, userId) {
    try {
      // Generate IV and use PBKDF2 to derive key from master key and user ID
      const salt = Buffer.from(userId.substring(0, 16).padEnd(16, '0'));
      const iv = crypto.randomBytes(16);

      // Derive key using PBKDF2
      const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha256');

      // Create cipher and encrypt
      const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
      let encrypted = cipher.update(privateKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Combine IV and encrypted data
      const combined = iv.toString('hex') + ':' + encrypted;

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
  static decryptPrivateKey(encryptedKey, encryptionKey, userId) {
    try {
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

      // Create decipher and decrypt
      const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      if (!decrypted.includes('BEGIN RSA PRIVATE KEY') && !decrypted.includes('BEGIN PRIVATE KEY')) {
        console.warn('Decrypted content preview:', decrypted.substring(0, 100));
        throw new Error(`Decryption failed: Invalid key format (got: ${decrypted.substring(0, 20)}...)`);
      }

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
  static generateCompleteCertificate(userInfo, masterEncryptionKey) {
    try {
      // Step 1: Generate key pair
      const keyPair = this.generateKeyPair();

      // Step 2: Create self-signed certificate
      const certData = this.createSelfSignedCertificate(keyPair, userInfo);

      // Step 3: Encrypt private key
      const encryptedPrivateKey = this.encryptPrivateKey(
        keyPair.privateKey,
        masterEncryptionKey,
        userInfo.userId
      );

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
