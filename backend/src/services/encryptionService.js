const CryptoJS = require('crypto-js');
const CryptoLogger = require('../utils/cryptoLogger');

/**
 * Encryption/Decryption Service
 * Provides AES-256 encryption and decryption utilities using crypto-js
 * Used for securing sensitive data like private keys, passwords, and secrets
 */
class EncryptionService {
  /**
   * Encrypt data using AES-256 with crypto-js
   * 
   * @param {string} plaintext - Data to encrypt (string or convertible to string)
   * @param {string} secretKey - Secret key for encryption (recommended: 32+ characters)
   * @returns {string} Encrypted data in base64 format
   * @throws {Error} If encryption fails
   * 
   * @example
   * const encrypted = EncryptionService.encryptAES256('sensitive-data', 'my-super-secret-key');
   * // Returns: base64-encoded encrypted string
   */
  static encryptAES256(plaintext, secretKey, req = null) {
    try {
      if (!plaintext || !secretKey) {
        throw new Error('Plaintext and secret key are required');
      }

      // Convert plaintext to string if needed
      const plaintextString = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);

      // Encrypt using AES-256
      const encrypted = CryptoJS.AES.encrypt(plaintextString, secretKey).toString();

      CryptoLogger.log(req, 'AES', 'AES-256 Encrypt', {
        algorithm: 'AES-256-CBC',
        inputLength: plaintextString.length,
        outputLength: encrypted.length,
        outputPreview: encrypted.substring(0, 20) + '...'
      });

      return encrypted;
    } catch (error) {
      throw new Error(`AES-256 encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt AES-256 encrypted data using crypto-js
   * 
   * @param {string} encryptedData - Encrypted data in base64 format
   * @param {string} secretKey - Secret key for decryption (must match encryption key)
   * @returns {string} Decrypted plaintext
   * @throws {Error} If decryption fails or key is incorrect
   * 
   * @example
   * const plaintext = EncryptionService.decryptAES256(encrypted, 'my-super-secret-key');
   * // Returns: original sensitive-data
   */
  static decryptAES256(encryptedData, secretKey, req = null) {
    try {
      if (!encryptedData || !secretKey) {
        throw new Error('Encrypted data and secret key are required');
      }

      // Decrypt using AES-256
      const decrypted = CryptoJS.AES.decrypt(encryptedData, secretKey);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Decryption resulted in empty string - key may be incorrect');
      }

      CryptoLogger.log(req, 'AES', 'AES-256 Decrypt', {
        algorithm: 'AES-256-CBC',
        inputLength: encryptedData.length,
        outputLength: decryptedString.length,
        success: true
      });

      return decryptedString;
    } catch (error) {
      throw new Error(`AES-256 decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt private key specifically
   * Wrapper around encryptAES256 for private key encryption
   * 
   * @param {string} privateKey - Private key in PEM format
   * @param {string} encryptionKey - Master encryption key
   * @returns {string} Encrypted private key (base64)
   * @throws {Error} If encryption fails
   * 
   * @example
   * const encrypted = EncryptionService.encryptPrivateKey(
   *   '-----BEGIN PRIVATE KEY-----\nMIIE...',
   *   process.env.MASTER_ENCRYPTION_KEY
   * );
   */
  static encryptPrivateKey(privateKey, encryptionKey, req = null) {
    try {
      if (!privateKey || !encryptionKey) {
        throw new Error('Private key and encryption key are required');
      }

      if (!privateKey.includes('BEGIN') || !privateKey.includes('PRIVATE KEY')) {
        throw new Error('Invalid private key format - must be PEM format');
      }

      CryptoLogger.log(req, 'ENCRYPT', 'Encrypt Private Key', {
        algorithm: 'AES-256',
        keyFormat: 'PEM',
        keyLength: privateKey.length,
        purpose: 'Securing RSA private key for storage'
      });

      const encrypted = this.encryptAES256(privateKey, encryptionKey, req);
      return encrypted;
    } catch (error) {
      throw new Error(`Private key encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt private key specifically
   * Wrapper around decryptAES256 for private key decryption
   * 
   * @param {string} encryptedKey - Encrypted private key (base64)
   * @param {string} encryptionKey - Master encryption key
   * @returns {string} Decrypted private key in PEM format
   * @throws {Error} If decryption fails or key format is invalid
   * 
   * @example
   * const privateKey = EncryptionService.decryptPrivateKey(
   *   encrypted,
   *   process.env.MASTER_ENCRYPTION_KEY
   * );
   */
  static decryptPrivateKey(encryptedKey, encryptionKey, req = null) {
    try {
      if (!encryptedKey || !encryptionKey) {
        throw new Error('Encrypted key and encryption key are required');
      }

      CryptoLogger.log(req, 'DECRYPT', 'Decrypt Private Key', {
        algorithm: 'AES-256',
        purpose: 'Retrieving RSA private key for signing',
        encryptedLength: encryptedKey.length
      });

      const decrypted = this.decryptAES256(encryptedKey, encryptionKey, req);

      // Validate decrypted content is a valid private key
      if (!decrypted.includes('BEGIN') || !decrypted.includes('PRIVATE KEY')) {
        throw new Error('Decryption failed: invalid key format (key may be incorrect)');
      }

      return decrypted;
    } catch (error) {
      throw new Error(`Private key decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate a hash of data using SHA-256
   * Useful for data verification and checksums
   * 
   * @param {string} data - Data to hash
   * @returns {string} SHA-256 hash in hexadecimal format
   * @throws {Error} If hashing fails
   * 
   * @example
   * const hash = EncryptionService.sha256Hash('mydata');
   * // Returns: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
   */
  static sha256Hash(data, req = null) {
    try {
      if (!data) {
        throw new Error('Data to hash is required');
      }

      const hash = CryptoJS.SHA256(data).toString();

      CryptoLogger.log(req, 'HASH', 'SHA-256 Hash', {
        algorithm: 'SHA-256',
        inputLength: typeof data === 'string' ? data.length : 'N/A',
        outputHash: hash.substring(0, 16) + '...',
        hashLength: hash.length
      });

      return hash;
    } catch (error) {
      throw new Error(`SHA-256 hashing failed: ${error.message}`);
    }
  }

  /**
   * Generate HMAC-SHA256 signature for data verification
   * Used for integrity checking and authentication
   * 
   * @param {string} data - Data to sign
   * @param {string} secret - Secret key for HMAC
   * @returns {string} HMAC signature in hexadecimal format
   * @throws {Error} If signing fails
   * 
   * @example
   * const signature = EncryptionService.hmacSha256('data', 'secret');
   * // Use signature later to verify: EncryptionService.verifyHmacSha256(data, signature, secret)
   */
  static hmacSha256(data, secret, req = null) {
    try {
      if (!data || !secret) {
        throw new Error('Data and secret are required');
      }

      const signature = CryptoJS.HmacSHA256(data, secret).toString();

      CryptoLogger.log(req, 'HMAC', 'HMAC-SHA256', {
        algorithm: 'HMAC-SHA256',
        inputLength: data.length,
        outputPreview: signature.substring(0, 16) + '...',
        purpose: 'Data integrity verification'
      });

      return signature;
    } catch (error) {
      throw new Error(`HMAC-SHA256 signing failed: ${error.message}`);
    }
  }

  /**
   * Verify HMAC-SHA256 signature
   * Confirms that data has not been tampered with
   * 
   * @param {string} data - Original data
   * @param {string} signature - HMAC signature to verify
   * @param {string} secret - Secret key used for signing
   * @returns {boolean} True if signature is valid, false otherwise
   * 
   * @example
   * const isValid = EncryptionService.verifyHmacSha256('data', signature, 'secret');
   */
  static verifyHmacSha256(data, signature, secret) {
    try {
      if (!data || !signature || !secret) {
        return false;
      }

      const expectedSignature = this.hmacSha256(data, secret);
      
      // Constant-time comparison to prevent timing attacks
      return this._constantTimeEqual(signature, expectedSignature);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a random encryption key
   * Useful for creating new encryption keys
   * 
   * @param {number} length - Key length in characters (default: 32)
   * @returns {string} Random key as hexadecimal string
   * 
   * @example
   * const newKey = EncryptionService.generateRandomKey(32);
   * // Returns: '7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d'
   */
  static generateRandomKey(length = 32) {
    try {
      const randomKey = CryptoJS.lib.WordArray.random(length / 2).toString();
      return randomKey;
    } catch (error) {
      throw new Error(`Random key generation failed: ${error.message}`);
    }
  }

  /**
   * Encrypt data to Base64 format (for storage/transmission)
   * Uses AES-256 encryption
   * 
   * @param {*} data - Data to encrypt (string, object, etc.)
   * @param {string} secretKey - Encryption key
   * @returns {string} Base64-encoded encrypted data
   * 
   * @example
   * const encoded = EncryptionService.encryptToBase64(userData, 'key');
   */
  static encryptToBase64(data, secretKey) {
    try {
      const encrypted = this.encryptAES256(data, secretKey);
      return Buffer.from(encrypted).toString('base64');
    } catch (error) {
      throw new Error(`Base64 encoding of encrypted data failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data from Base64 format
   * Reverses encryptToBase64
   * 
   * @param {string} encodedData - Base64-encoded encrypted data
   * @param {string} secretKey - Decryption key
   * @returns {string} Decrypted plaintext
   * 
   * @example
   * const plaintext = EncryptionService.decryptFromBase64(encoded, 'key');
   */
  static decryptFromBase64(encodedData, secretKey) {
    try {
      const encrypted = Buffer.from(encodedData, 'base64').toString('utf8');
      return this.decryptAES256(encrypted, secretKey);
    } catch (error) {
      throw new Error(`Decryption from Base64 failed: ${error.message}`);
    }
  }

  /**
   * Hash a password using bcryptjs-compatible SHA256
   * Useful for one-way password hashing (though bcryptjs is preferred for passwords)
   * 
   * @param {string} password - Password to hash
   * @param {number} iterations - Hash iterations for stronger security (default: 1000)
   * @returns {string} Hashed password
   * 
   * @example
   * const hashedPassword = EncryptionService.hashPassword('myPassword123');
   */
  static hashPassword(password, iterations = 1000) {
    try {
      if (!password) {
        throw new Error('Password is required');
      }

      let hash = password;
      for (let i = 0; i < iterations; i++) {
        hash = CryptoJS.SHA256(hash).toString();
      }

      return hash;
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
   * Private helper: Constant-time string comparison
   * Prevents timing attacks during signature verification
   * 
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {boolean} True if strings are equal
   * @private
   */
  static _constantTimeEqual(str1, str2) {
    if (str1.length !== str2.length) {
      return false;
    }

    let equal = 0;
    for (let i = 0; i < str1.length; i++) {
      equal |= str1.charCodeAt(i) ^ str2.charCodeAt(i);
    }

    return equal === 0;
  }

  /**
   * Validate encryption key strength
   * Checks if key meets minimum security requirements
   * 
   * @param {string} key - Key to validate
   * @returns {Object} Validation result with recommendations
   * 
   * @example
   * const validation = EncryptionService.validateKeyStrength(key);
   * // Returns: { isValid: true, strength: 'strong', recommendations: [] }
   */
  static validateKeyStrength(key) {
    const result = {
      isValid: true,
      strength: 'weak',
      recommendations: []
    };

    if (!key || typeof key !== 'string') {
      result.isValid = false;
      result.recommendations.push('Key must be a non-empty string');
      return result;
    }

    if (key.length < 16) {
      result.isValid = false;
      result.recommendations.push('Key must be at least 16 characters long');
    } else if (key.length < 32) {
      result.strength = 'moderate';
      result.recommendations.push('Consider using a key of at least 32 characters for better security');
    } else {
      result.strength = 'strong';
    }

    // Check for variety of character types
    const hasLower = /[a-z]/.test(key);
    const hasUpper = /[A-Z]/.test(key);
    const hasNumbers = /[0-9]/.test(key);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(key);

    const varietyScore = [hasLower, hasUpper, hasNumbers, hasSpecial].filter(Boolean).length;

    if (varietyScore < 2) {
      result.recommendations.push('Key should include mix of uppercase, lowercase, numbers, and special characters');
    }

    return result;
  }
}

module.exports = EncryptionService;
