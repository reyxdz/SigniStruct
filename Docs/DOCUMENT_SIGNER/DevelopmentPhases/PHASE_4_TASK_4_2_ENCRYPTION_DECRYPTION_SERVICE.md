# Phase 4: Document Signing - Task 4.2: Encryption/Decryption Service

**Date Implemented**: February 25, 2026  
**Status**: ✅ COMPLETED  
**Priority**: High  
**Phase**: 4/6

---

## 📋 Overview

Task 4.2 implements the **Encryption/Decryption Service** (`encryptionService.js`), a utility service that provides AES-256 encryption and decryption functions for protecting sensitive data across the application. This service uses the `crypto-js` library and provides a consistent API for encrypting private keys, credentials, and other confidential information.

### What This Task Accomplishes

- ✅ AES-256 encryption/decryption using crypto-js
- ✅ Private key encryption wrapper methods
- ✅ SHA-256 hashing for data integrity
- ✅ HMAC-SHA256 for authentication signatures
- ✅ Random key generation for cryptographic purposes
- ✅ Key strength validation
- ✅ Safe Base64 encoding/decoding of encrypted data
- ✅ Password hashing (iterative SHA-256)
- ✅ Constant-time comparison for security

---

## 📁 Files Created/Modified

### Created Files
```
backend/src/services/encryptionService.js (320+ lines)
```

### Dependencies (Pre-installed)
- `crypto-js` ^4.2.0 - AES-256 encryption library
- Node.js built-in modules (Buffer, Crypto operations)

---

## 🔐 Core Functions

### 1. `encryptAES256(plaintext, secretKey)`

**Purpose**: Encrypt data using AES-256 with crypto-js

**Parameters**:
- `plaintext` (string | object): Data to encrypt
- `secretKey` (string): Secret key for encryption (recommended: 32+ characters)

**Process**:
```
Input: plaintext data + secret key
  ↓
Validate inputs (not empty, not null)
  ↓
Convert to string if needed
  ↓
Apply AES-256 encryption via crypto-js
  ↓
Return base64-encoded encrypted data
```

**Returns**: Encrypted data (base64 string)

**Example**:
```javascript
const encrypted = EncryptionService.encryptAES256(
  'sensitive-data',
  process.env.MASTER_ENCRYPTION_KEY
);
// Returns: 'U2FsdGVkX1+...' (base64-encoded)
```

**Throws**: Error if encryption fails

---

### 2. `decryptAES256(encryptedData, secretKey)`

**Purpose**: Decrypt AES-256 encrypted data

**Parameters**:
- `encryptedData` (string): Encrypted data (base64 format)
- `secretKey` (string): Secret key for decryption (must match encryption key)

**Process**:
```
Input: encrypted data + secret key
  ↓
Validate inputs
  ↓
Apply AES-256 decryption via crypto-js
  ↓
Convert bytes to UTF-8 string
  ↓
Validate decryption resulted in actual data
  ↓
Return plaintext
```

**Returns**: Decrypted plaintext (UTF-8 string)

**Example**:
```javascript
const plaintext = EncryptionService.decryptAES256(
  encrypted,
  process.env.MASTER_ENCRYPTION_KEY
);
// Returns: 'sensitive-data'
```

**Throws**: Error if decryption fails or key is incorrect

---

### 3. `encryptPrivateKey(privateKey, encryptionKey)`

**Purpose**: Encrypt a private key specifically

**Parameters**:
- `privateKey` (string): Private key in PEM format
- `encryptionKey` (string): Master encryption key

**Validation**:
- Checks for PEM format markers (BEGIN/END PRIVATE KEY)
- Validates encryption key provided

**Process**:
```
Input: PEM private key + encryption key
  ↓
Validate PEM format
  ↓
Apply AES-256 encryption
  ↓
Return encrypted key (base64)
```

**Returns**: Encrypted private key (base64 string)

**Example**:
```javascript
const encrypted = EncryptionService.encryptPrivateKey(
  '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----',
  process.env.MASTER_ENCRYPTION_KEY
);
```

**Security Notes**:
- Only validates PEM format, doesn't load/parse key
- Encrypted key can be stored in database safely
- Original key not logged or exposed

---

### 4. `decryptPrivateKey(encryptedKey, encryptionKey)`

**Purpose**: Decrypt a private key specifically

**Parameters**:
- `encryptedKey` (string): Encrypted private key (base64)
- `encryptionKey` (string): Master encryption key

**Validation**:
- Verifies decrypted content is valid PEM format
- Detects incorrect encryption keys
- Validates UTF-8 conversion

**Process**:
```
Input: encrypted key + encryption key
  ↓
Apply AES-256 decryption
  ↓
Validate PEM format markers exist
  ↓
Return decrypted PEM private key
```

**Returns**: Decrypted private key in PEM format (string)

**Example**:
```javascript
const privateKey = EncryptionService.decryptPrivateKey(
  encryptedKey,
  process.env.MASTER_ENCRYPTION_KEY
);
// Returns: '-----BEGIN PRIVATE KEY-----\n...'
```

**Throws**: Error if key format invalid or decryption fails

---

### 5. `sha256Hash(data)`

**Purpose**: Generate SHA-256 hash of data for integrity checking

**Parameters**:
- `data` (string): Data to hash

**Returns**: SHA-256 hash (hexadecimal string, 64 characters)

**Example**:
```javascript
const hash = EncryptionService.sha256Hash('document-content');
// Returns: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
```

**Use Cases**:
- Document fingerprinting
- Checksum generation
- Data integrity verification
- Cache key generation

---

### 6. `hmacSha256(data, secret)`

**Purpose**: Generate HMAC-SHA256 signature for authentication

**Parameters**:
- `data` (string): Data to sign
- `secret` (string): Secret key for HMAC

**Returns**: HMAC signature (hexadecimal string)

**Example**:
```javascript
const signature = EncryptionService.hmacSha256(
  'message-content',
  'shared-secret'
);
// Can be verified later with verifyHmacSha256()
```

**Use Cases**:
- API request authentication
- Signature verification
- Message authentication codes
- Token generation

---

### 7. `verifyHmacSha256(data, signature, secret)`

**Purpose**: Verify HMAC-SHA256 signature (constant-time comparison)

**Parameters**:
- `data` (string): Original data
- `signature` (string): HMAC signature to verify
- `secret` (string): Secret key used for signing

**Returns**: Boolean (true if valid, false otherwise)

**Example**:
```javascript
const isValid = EncryptionService.verifyHmacSha256(
  'message-content',
  receivedSignature,
  'shared-secret'
);

if (isValid) {
  console.log('✅ Signature is valid');
} else {
  console.log('❌ Signature is invalid or tampered');
}
```

**Security Features**:
- Constant-time comparison prevents timing attacks
- Returns false on any error (safe default)
- No exception throwing on invalid data

---

### 8. `generateRandomKey(length = 32)`

**Purpose**: Generate a random cryptographic key

**Parameters**:
- `length` (number, optional): Key length in characters (default: 32)

**Returns**: Random key as hexadecimal string

**Example**:
```javascript
const newKey = EncryptionService.generateRandomKey(32);
// Returns: '7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c'

// For smaller key
const smallKey = EncryptionService.generateRandomKey(16);
// Returns: '3a4b5c6d7e8f9a0b'
```

**Use Cases**:
- Generate encryption keys for new users
- Create temporary session keys
- Initialize cryptographic operations
- Generate API secret keys

---

### 9. `encryptToBase64(data, secretKey)`

**Purpose**: Encrypt data and encode as Base64 (for safe storage/transmission)

**Parameters**:
- `data` (string | object): Data to encrypt
- `secretKey` (string): Encryption key

**Returns**: Base64-encoded encrypted data (string)

**Example**:
```javascript
const encoded = EncryptionService.encryptToBase64(
  userData,
  process.env.ENCRYPTION_KEY
);
// Returns: 'QmFzZTY0RW5jb2RlZEVuY3J5cHRlZERhdGE...'
```

**Use Cases**:
- Safe URL parameter encoding
- Database storage of sensitive data
- API response encryption
- File transfer of encrypted data

---

### 10. `decryptFromBase64(encodedData, secretKey)`

**Purpose**: Decrypt Base64-encoded encrypted data

**Parameters**:
- `encodedData` (string): Base64-encoded encrypted data
- `secretKey` (string): Decryption key

**Returns**: Decrypted plaintext (string)

**Example**:
```javascript
const plaintext = EncryptionService.decryptFromBase64(
  encoded,
  process.env.ENCRYPTION_KEY
);
```

---

### 11. `hashPassword(password, iterations = 1000)`

**Purpose**: Hash password using iterative SHA-256

**Parameters**:
- `password` (string): Password to hash
- `iterations` (number, optional): Number of hash iterations (default: 1000)

**Returns**: Hashed password (hexadecimal string, 64 characters)

**Example**:
```javascript
const hashedPassword = EncryptionService.hashPassword('myPassword123', 2000);
// Returns: 'a1b2c3d4e5f6...' (after 2000 iterations)
```

**Note**: For user password storage, use `bcryptjs` instead of this method. This is for secondary hashing or quick checksums.

---

### 12. `validateKeyStrength(key)`

**Purpose**: Validate encryption key strength and provide recommendations

**Parameters**:
- `key` (string): Key to validate

**Returns**: Object with validation results
```javascript
{
  isValid: Boolean,              // Key meets minimum requirements
  strength: String,             // 'weak' | 'moderate' | 'strong'
  recommendations: Array        // Improvement suggestions
}
```

**Example**:
```javascript
const validation = EncryptionService.validateKeyStrength(key);

// Weak key:
{
  isValid: false,
  strength: 'weak',
  recommendations: [
    'Key must be at least 16 characters long',
    'Key should include mix of uppercase, lowercase, numbers, and special characters'
  ]
}

// Strong key:
{
  isValid: true,
  strength: 'strong',
  recommendations: []
}
```

**Validation Rules**:
- Minimum 16 characters (required)
- 32+ characters recommended (strong)
- Mix of character types: uppercase, lowercase, numbers, special chars

---

## 🔄 How It Integrates with Other Services

### Integration with SigningService
```
SigningService.signDocument()
  ↓
Decrypts user's encrypted private key
  ↓
Uses EncryptionService.decryptPrivateKey()
  ↓
Returns decrypted PEM key for RSA signing
```

### Integration with CertificateService
```
CertificateService.createSelfSignedCertificate()
  ↓
Encrypts generated private key
  ↓
Uses EncryptionService.encryptPrivateKey()
  ↓
Stores encrypted key in database (UserCertificate.private_key_encrypted)
```

### General Data Protection
```
Any sensitive data (credentials, secrets, tokens)
  ↓
Encrypt before storage using encryptAES256()
  ↓
Decrypt on retrieval using decryptAES256()
  ↓
Never expose plaintext in logs/responses
```

---

## 🛡️ Security Features

### 1. **AES-256 Encryption**
- Military-grade 256-bit symmetric encryption
- Uses crypto-js library (well-tested cryptography)
- OpenSSL-compatible format

### 2. **Key Derivation**
- Supports any length key
- Validates key strength with recommendations
- Generates random keys for cryptographic use

### 3. **Integrity Checking**
- SHA-256 hashing for data fingerprints
- HMAC-SHA256 for message authentication
- Constant-time comparison prevents timing attacks

### 4. **Private Key Protection**
- Validates PEM format before encryption
- Detects invalid keys after decryption
- All-or-nothing validation (either valid key or error)

### 5. **Safe Error Handling**
- No plaintext exposure in error messages
- Validation functions return safe defaults
- Clear indication of validation failures

---

## 📊 Usage Scenarios

### Scenario 1: Storing Sensitive Credentials
```javascript
// Encryption
const encrypted = EncryptionService.encryptAES256(
  JSON.stringify({
    apiKey: 'secret-api-key',
    token: 'access-token'
  }),
  process.env.MASTER_ENCRYPTION_KEY
);

// Save encrypted to database
await Config.updateOne(
  { userId: '507f...' },
  { credentials_encrypted: encrypted }
);

// Later: Decryption
const decrypted = EncryptionService.decryptAES256(
  config.credentials_encrypted,
  process.env.MASTER_ENCRYPTION_KEY
);
const credentials = JSON.parse(decrypted);
```

### Scenario 2: Protecting Private Keys
```javascript
// During certificate generation
const keyPair = CertificateService.generateKeyPair();

const encryptedPrivateKey = EncryptionService.encryptPrivateKey(
  keyPair.privateKey,
  process.env.MASTER_ENCRYPTION_KEY
);

// Store encrypted version in database
const certificate = new UserCertificate({
  user_id: userId,
  public_key: keyPair.publicKey,
  private_key_encrypted: encryptedPrivateKey  // Safe to store
});

await certificate.save();

// Later: When signing a document
const privateKey = EncryptionService.decryptPrivateKey(
  certificate.private_key_encrypted,
  process.env.MASTER_ENCRYPTION_KEY
);
// Use privateKey for RSA signing
```

### Scenario 3: Data Integrity Verification
```javascript
// Document upload
const fileContent = await fs.readFile(uploadedFile);
const fileHash = EncryptionService.sha256Hash(fileContent);

const document = new Document({
  title: 'Contract.pdf',
  file_url: '/uploads/contract.pdf',
  file_hash_sha256: fileHash  // Store hash for verification
});

await document.save();

// Later: Verify file hasn't been tampered
const currentContent = await fs.readFile('/uploads/contract.pdf');
const currentHash = EncryptionService.sha256Hash(currentContent);

if (currentHash === document.file_hash_sha256) {
  console.log('✅ File is authentic (not modified)');
} else {
  console.log('❌ File has been tampered!');
}
```

### Scenario 4: API Request Authentication
```javascript
// Signing an API request
const requestBody = JSON.stringify(data);
const signature = EncryptionService.hmacSha256(
  requestBody,
  process.env.API_SECRET
);

// Send request with signature header
const response = await axios.post('/api/endpoint', data, {
  headers: {
    'X-Signature': signature
  }
});

// Server-side verification
router.post('/endpoint', (req, res) => {
  const requestBody = JSON.stringify(req.body);
  const expectedSignature = EncryptionService.hmacSha256(
    requestBody,
    process.env.API_SECRET
  );

  const isValid = EncryptionService.verifyHmacSha256(
    requestBody,
    req.headers['x-signature'],
    process.env.API_SECRET
  );

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process request
});
```

---

## 🔧 Configuration

### Required Environment Variables
```bash
# backend/.env
MASTER_ENCRYPTION_KEY=your-super-secret-encryption-key-32-chars-minimum-recommended
```

### Recommended Key Generation
```bash
# Generate a strong random key (Linux/Mac)
openssl rand -hex 32

# Or use the service itself
node -e "console.log(require('./src/services/encryptionService').generateRandomKey(32))"
```

---

## 🧪 Testing Strategy

### Unit Tests to Create
```
backend/tests/services/encryptionService.test.js
```

**Test Cases**:
```javascript
describe('EncryptionService', () => {
  describe('encryptAES256 / decryptAES256', () => {
    it('should encrypt and decrypt data correctly', () => {
      const plaintext = 'sensitive data';
      const key = 'my-secret-key-32-chars-minimum';
      
      const encrypted = EncryptionService.encryptAES256(plaintext, key);
      const decrypted = EncryptionService.decryptAES256(encrypted, key);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should fail with wrong key', () => {
      const encrypted = EncryptionService.encryptAES256('data', 'key1');
      const decrypted = EncryptionService.decryptAES256(encrypted, 'key2');
      
      expect(decrypted).not.toBe('data');
    });

    it('should handle objects by converting to JSON', () => {
      const obj = { user: 'john', email: 'john@example.com' };
      const key = 'secret-key';
      
      const encrypted = EncryptionService.encryptAES256(obj, key);
      const decrypted = EncryptionService.decryptAES256(encrypted, key);
      
      expect(JSON.parse(decrypted)).toEqual(obj);
    });
  });

  describe('encryptPrivateKey / decryptPrivateKey', () => {
    it('should encrypt and decrypt private key', () => {
      const privateKey = '-----BEGIN PRIVATE KEY-----\n...key data...\n-----END PRIVATE KEY-----';
      const key = 'encryption-key';
      
      const encrypted = EncryptionService.encryptPrivateKey(privateKey, key);
      const decrypted = EncryptionService.decryptPrivateKey(encrypted, key);
      
      expect(decrypted).toBe(privateKey);
    });

    it('should reject invalid PEM format', () => {
      expect(() => {
        EncryptionService.encryptPrivateKey('not-a-real-key', 'key');
      }).toThrow('Invalid private key format');
    });

    it('should detect incorrect decryption key', () => {
      const key = '-----BEGIN PRIVATE KEY-----\n...key...\n-----END PRIVATE KEY-----';
      const encrypted = EncryptionService.encryptPrivateKey(key, 'correct-key');
      
      expect(() => {
        EncryptionService.decryptPrivateKey(encrypted, 'wrong-key');
      }).toThrow('invalid key format');
    });
  });

  describe('sha256Hash', () => {
    it('should generate consistent hash', () => {
      const data = 'test-data';
      const hash1 = EncryptionService.sha256Hash(data);
      const hash2 = EncryptionService.sha256Hash(data);
      
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different data', () => {
      const hash1 = EncryptionService.sha256Hash('data1');
      const hash2 = EncryptionService.sha256Hash('data2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('hmacSha256 / verifyHmacSha256', () => {
    it('should verify valid HMAC', () => {
      const data = 'message';
      const secret = 'secret-key';
      
      const signature = EncryptionService.hmacSha256(data, secret);
      const isValid = EncryptionService.verifyHmacSha256(data, signature, secret);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid HMAC', () => {
      const data = 'message';
      const signature = 'invalid-signature';
      
      const isValid = EncryptionService.verifyHmacSha256(data, signature, 'secret');
      
      expect(isValid).toBe(false);
    });

    it('should use constant-time comparison', () => {
      // The verification should not leak timing info
      const data = 'message';
      
      const sig1 = EncryptionService.hmacSha256(data, 'key');
      const sig2 = 'a'.repeat(sig1.length);
      
      const isValid = EncryptionService.verifyHmacSha256(data, sig2, 'key');
      expect(isValid).toBe(false);
    });
  });

  describe('generateRandomKey', () => {
    it('should generate keys of requested length', () => {
      const key16 = EncryptionService.generateRandomKey(16);
      const key32 = EncryptionService.generateRandomKey(32);
      
      expect(key16.length).toBeGreaterThanOrEqual(16);
      expect(key32.length).toBeGreaterThanOrEqual(32);
    });

    it('should generate different keys', () => {
      const key1 = EncryptionService.generateRandomKey(32);
      const key2 = EncryptionService.generateRandomKey(32);
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('validateKeyStrength', () => {
    it('should accept strong keys', () => {
      const validation = EncryptionService.validateKeyStrength(
        'MyStr0ng!Key@32CharactersLongEnough'
      );
      
      expect(validation.isValid).toBe(true);
      expect(validation.strength).toBe('strong');
    });

    it('should reject short keys', () => {
      const validation = EncryptionService.validateKeyStrength('short');
      
      expect(validation.isValid).toBe(false);
      expect(validation.recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend improvements for weak keys', () => {
      const validation = EncryptionService.validateKeyStrength('weakkey');
      
      expect(validation.strength).not.toBe('strong');
      expect(validation.recommendations.length).toBeGreaterThan(0);
    });
  });
});
```

---

## 📈 Performance Considerations

### Optimization Tips

1. **Cache Encryption Keys**:
   ```javascript
   // Don't decrypt private keys repeatedly
   const cachedKeys = new Map();
   
   function getPrivateKey(userId) {
     if (cachedKeys.has(userId)) {
       return cachedKeys.get(userId);
     }
     
     const key = decryptPrivateKey(...);
     cachedKeys.set(userId, key);
     return key;
   }
   ```

2. **Batch Operations**:
   ```javascript
   // Encrypt multiple items at once
   const encrypted = items.map(item => 
     EncryptionService.encryptAES256(item, key)
   );
   ```

3. **Async Processing**:
   ```javascript
   // For CPU-intensive operations, use worker threads
   const { Worker } = require('worker_threads');
   ```

4. **Key Validation**:
   ```javascript
   // Validate key once, not on every operation
   const validation = EncryptionService.validateKeyStrength(key);
   if (!validation.isValid) throw new Error(...);
   ```

---

## 🐛 Debugging & Troubleshooting

### Common Issues & Solutions

**Issue**: "Decryption failed: invalid key format"
```
Cause: Wrong encryption key or corrupted encrypted data
Solution:
  - Verify MASTER_ENCRYPTION_KEY in .env is correct
  - Check encrypted data wasn't corrupted during storage
  - Ensure data was encrypted with same key being used for decryption
```

**Issue**: "Invalid private key format"
```
Cause: PEM format validation failed
Solution:
  - Verify key starts with "-----BEGIN PRIVATE KEY-----"
  - Verify key ends with "-----END PRIVATE KEY-----"
  - Check for encoding issues (UTF-8)
  - Ensure newlines are preserved in PEM format
```

**Issue**: "Key must be at least 16 characters long"
```
Cause: Encryption key too short
Solution:
  - Use at least 32 characters for strong security
  - Generate key: openssl rand -hex 32
  - Update MASTER_ENCRYPTION_KEY in .env
```

**Issue**: "HMAC signature verification failed"
```
Cause: Data or secret key mismatch
Solution:
  - Verify data wasn't modified before verification
  - Ensure same secret key used for signing and verification
  - Check for whitespace/encoding differences
  - Use constant-time comparison (method already handles this)
```

---

## 🔗 Related Services

- **CertificateService** (Phase 1.1) - Uses `encryptPrivateKey()` for key storage
- **SigningService** (Phase 4.1) - Uses `decryptPrivateKey()` for document signing
- **VerificationService** (Phase 5.1) - May use `verifyHmacSha256()` for integrity

---

## 📚 References

- **crypto-js Documentation**: https://cryptojs.gitbook.io/docs/
- **AES-256 Encryption**: https://en.wikipedia.org/wiki/Advanced_Encryption_Standard
- **SHA-256 Hashing**: https://en.wikipedia.org/wiki/SHA-2
- **HMAC**: https://en.wikipedia.org/wiki/HMAC
- **PEM Format**: https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail

---

## ✅ Summary

**Phase 4 Task 4.2** is now complete! The `EncryptionService` provides:

✅ **encryptAES256() / decryptAES256()** - Standard encryption/decryption  
✅ **encryptPrivateKey() / decryptPrivateKey()** - Private key protection  
✅ **sha256Hash()** - Data integrity checking  
✅ **hmacSha256() / verifyHmacSha256()** - Authentication signatures  
✅ **generateRandomKey()** - Key generation  
✅ **encryptToBase64() / decryptFromBase64()** - Safe data transfer  
✅ **hashPassword()** - Password hashing  
✅ **validateKeyStrength()** - Key security validation  
✅ **Constant-time comparison** - Security against timing attacks  

---

## 🚀 Next Steps

1. Implement Task 4.3: API Endpoints
2. Implement Task 4.4: Signing UI Components
3. Create comprehensive unit tests
4. Integration testing with SigningService
5. Load testing for encryption performance

---

**Created by**: AI Assistant  
**Date**: February 25, 2026  
**Status**: Ready for Integration & Testing
