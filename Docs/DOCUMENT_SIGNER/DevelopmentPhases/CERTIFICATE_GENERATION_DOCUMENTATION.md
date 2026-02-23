# Certificate Generation Service - Technical Documentation

## Overview

This document provides a comprehensive explanation of the Certificate Generation Service implemented in `backend/src/services/certificateService.js`. It covers the core cryptographic concepts, architecture, and implementation details.

---

## Table of Contents

1. [RSA Key Pair](#rsa-key-pair)
2. [Self-Signed Certificates](#self-signed-certificates)
3. [AES-256 Encryption](#aes-256-encryption)
4. [Certificate Generation & Public Key](#certificate-generation--public-key)
5. [Security Architecture](#security-architecture)
6. [Implementation Details](#implementation-details)
7. [Usage Examples](#usage-examples)

---

## RSA Key Pair

### What is RSA?

RSA (Rivest-Shamir-Adleman) is an asymmetric encryption algorithm that uses a pair of keys:

- **Public Key**: Can be freely shared. Used to encrypt data and verify signatures.
- **Private Key**: Must be kept secret. Used to decrypt data and create signatures.

### RSA Key Pair Structure

```
RSA 2048-bit Key Pair
│
├─ Public Key (450 bytes in PEM format)
│  ├─ Modulus (n): 2048-bit number
│  └─ Public Exponent (e): Usually 65537
│
└─ Private Key (1700+ bytes in PEM format)
   ├─ Modulus (n): Same as public key
   ├─ Private Exponent (d): Secret value
   ├─ Prime1 (p): First large prime
   ├─ Prime2 (q): Second large prime
   ├─ And other parameters
```

### Why 2048-bit?

- **Security Level**: 2048-bit RSA = ~112-bit symmetric security
- **Performance**: Good balance between security and speed
- **Standard**: NIST approved for use until 2030
- **Alternative**: 4096-bit available for higher security (slower)

### Key Generation Process

```javascript
const key = new NodeRSA({ b: 2048 });
const publicKey = key.exportKey('pkcs8-public-pem');
const privateKey = key.exportKey('pkcs8-private-pem');
```

**Output Format (PEM - Privacy Enhanced Mail)**

Public Key:
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjATd3/dC+y4...
[Base64 encoded key data]
-----END PUBLIC KEY-----
```

Private Key:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAjATd3/dC+y4uNzmCyQHPtDk/Gkmccu1XGyoKdj...
[Base64 encoded key data]
-----END RSA PRIVATE KEY-----
```

### Use Cases in Document Signing

| Use Case | Key Used | Purpose |
|----------|----------|---------|
| **Create Signature** | Private Key | Sign document hash (only legitimate owner can do this) |
| **Verify Signature** | Public Key | Verify document hasn't been tampered with |
| **Distribute Certificate** | Public Key | Share with others to verify your signatures |

---

## Self-Signed Certificates

### What is a Self-Signed Certificate?

A self-signed certificate is a digital certificate signed by its own private key rather than a Certificate Authority (CA). It contains:

- **Subject**: Information about the certificate holder (name, email, organization)
- **Public Key**: The public key from the RSA key pair
- **Validity Period**: When certificate is active (not before / not after dates)
- **Serial Number**: Unique identifier for this certificate
- **Signature**: Created by signing the certificate with the private key

### X.509 Certificate Structure

```
X.509 Certificate
├─ Version (3)
├─ Serial Number (unique identifier)
├─ Issuer (who signed it - in self-signed: the subject)
├─ Subject (certificate holder info)
│  ├─ Common Name: John Doe
│  ├─ Email: john.doe@example.com
│  ├─ Organization: SigniStruct
│  ├─ Country: US
│  └─ Other attributes
├─ Validity
│  ├─ Not Before: 2026-02-23
│  └─ Not After: 2031-02-23 (5 years)
├─ Public Key
│  ├─ Algorithm: RSA
│  └─ Public Key (2048-bit)
├─ Extensions
│  └─ Various certificate extension data
└─ Signature
   ├─ Algorithm: SHA256 with RSA encryption
   └─ Signature Value (digital signature)
```

### Certificate Lifecycle

```
User Registration
    ↓
1. Generate RSA Key Pair (2048-bit)
    ↓
2. Create Self-Signed Certificate
    ├─ Set subject info (name, email)
    ├─ Set validity period (5 years)
    └─ Sign with private key (SHA-256)
    ↓
3. Store Certificate
    ├─ Public certificate (PEM format, world-visible)
    ├─ Public key (extracted, for fast verification)
    └─ Private key (encrypted with AES-256, server-side)
    ↓
4. Use for Signing
    ├─ Document hash created (SHA-256)
    ├─ Hash signed with private key (RSA-PSS)
    └─ Signature stored with certificate ID
    ↓
5. Verify Signature (Later)
    ├─ Extract certificate
    ├─ Get public key from certificate
    ├─ Verify signature with public key
    └─ Confirm document authenticity
```

### Self-Signed vs. CA-Signed

| Aspect | Self-Signed | CA-Signed |
|--------|-------------|-----------|
| **Trust** | Limited (only if you verify) | Browser/system trusts automatically |
| **Cost** | Free | Paid ($50-500+/year) |
| **Use Case** | Internal, legal documents | Public websites, HTTPS |
| **Legal Status** | Valid for eSignature (with proof) | Legally recognized |
| **Security** | Same encryption strength | Same encryption strength |

### Our Certificate Features

```
SigniStruct Self-Signed Certificate
├─ Subject: "John Doe <john.doe@example.com>"
├─ Issuer: "SigniStruct" (self-signed)
├─ Validity: 5 years from creation
├─ Serial Number: Generated uniquely
├─ Algorithm: SHA-256 with RSA Encryption
├─ Public Key: 2048-bit RSA
└─ Status: Active/Revoked/Expired
```

---

## AES-256 Encryption

### What is AES-256?

AES (Advanced Encryption Standard) with 256-bit key:

- **Type**: Symmetric encryption (same key for encrypt/decrypt)
- **Key Size**: 256 bits (32 bytes) - extremely strong
- **Block Size**: 128 bits (16 bytes)
- **Standard**: US government approved (FIPS 197)
- **Security**: No known practical attacks

### AES-256 vs Other Algorithms

| Algorithm | Key Size | Status | Use Case |
|-----------|----------|--------|----------|
| **AES-128** | 128-bit | Acceptable | Secure but weaker |
| **AES-256** | 256-bit | Recommended | High security (our choice) |
| **3DES** | 192-bit | Deprecated | Legacy systems |
| **RSA-2048** | 2048-bit | Good | Asymmetric (different purpose) |

### Why Encrypt Private Keys?

```
Private Key Storage Security Strategy
│
├─ Without Encryption:
│  ├─ If database is breached → Private keys exposed
│  └─ Attacker can sign documents as you
│
└─ With Encryption (AES-256):
   ├─ Database breach doesn't expose keys
   ├─ Attacker needs Master Encryption Key
   ├─ Only decrypted when needed for signing
   └─ Decrypted key exists only in memory
```

### Our Encryption Process

#### Step 1: Key Derivation (PBKDF2)

```
PBKDF2 (Password-Based Key Derivation Function 2)
│
Input:
├─ Master Encryption Key (from environment)
├─ Salt (first 16 chars of user ID)
├─ Iterations: 100,000 (slow = hard to crack)
└─ Output size: 256-bit

Process:
├─ SHA-256 hashing (100,000 iterations)
└─ Derives unique 256-bit key from master key + salt

Output: Derived Key (256-bit)
```

**Why PBKDF2?**
- Slow by design (100,000 iterations)
- Makes brute-force attacks impractical
- Industry standard for key derivation
- Uses salt to prevent rainbow tables

#### Step 2: Encryption (AES-256-CBC)

```
AES-256-CBC (Cipher Block Chaining)
│
Input:
├─ Plaintext: Private Key (PEM format)
├─ Key: Derived key (256-bit from PBKDF2)
├─ IV: Random Initialization Vector (128-bit)
└─ Mode: CBC (Cipher Block Chaining)

Process:
├─ Generate random IV
├─ Encrypt each block with previous block's ciphertext
└─ Each block depends on previous (prevents pattern)

Output: IV:EncryptedData (combined for storage)
```

**Example Output:**
```
807e193d4e631e3619db50314ae257ef:9bea24e5f4be6bc82...
[IV in hex]:[Encrypted data in hex]
```

#### Step 3: Storage Format

```
Database Storage
│
Encrypted Private Key Field:
├─ Format: "HEXIV:HEXENCRYPTED"
├─ Size: ~3400 characters (for 2048-bit key)
├─ Readable: No, completely obfuscated
├─ Reversible: Yes, with correct Master Key
└─ Security: AES-256 encrypted
```

### Encryption & Decryption Flow

```
Encryption Process:
────────────────────
Private Key (PEM)
    ↓
[PBKDF2]
    ← Master Key + User ID
    ↓
Derived Key (256-bit)
    ↓
[AES-256-CBC Encrypt]
    ← Random IV
    ↓
Encrypted Data + IV
    ↓
Database Storage


Decryption Process:
─────────────────
Encrypted Data + IV (from DB)
    ↓
[Extract IV and Encrypted Data]
    ↓
[PBKDF2]
    ← Master Key + User ID (same salt)
    ↓
Derived Key (256-bit)
    ↓
[AES-256-CBC Decrypt]
    ↓
Private Key (PEM)
    ↓
Use for signing (in memory only)
```

### Security Considerations

```
Protection Layers:
1. HTTPS/TLS: Data in transit encrypted
2. Database: Only encrypted keys stored
3. Encryption: AES-256 with PBKDF2 key derivation
4. Master Key: Stored separately in environment
5. Rotatable: Keys can be re-encrypted with new master key
```

---

## Certificate Generation & Public Key

### Complete Certificate Generation Workflow

```javascript
// Step 1: Generate RSA Key Pair
const keyPair = CertificateService.generateKeyPair();
// Output: { publicKey, privateKey }

// Step 2: Create Self-Signed Certificate
const certData = CertificateService.createSelfSignedCertificate(
  keyPair,
  { name, email, userId },
  validityYears = 5
);

// Step 3: Encrypt Private Key
const encryptedPrivateKey = CertificateService.encryptPrivateKey(
  keyPair.privateKey,
  masterEncryptionKey,
  userId
);

// Step 4: Return Complete Package
const completeCertificate = {
  certificate_id: "CERT-...",
  certificate_pem: "-----BEGIN CERTIFICATE-----...",
  public_key: keyPair.publicKey,
  private_key_encrypted: encryptedPrivateKey, // NOT the actual private key
  serial_number: "...",
  fingerprint_sha256: "...",
  not_before: Date,
  not_after: Date,
  status: "active",
  created_at: Date
};
```

### Certificate Package Contents

#### Public Certificate (PEM Format)

```
-----BEGIN CERTIFICATE-----
MIIDtTCCAp2gAwIBAgIFdlpebfEwDQYJKoZIhvcNAQELBQAwgZsxETAPBgNVBAMT
[... Base64 encoded certificate data ...]
-----END CERTIFICATE-----
```

**Contains:**
- Subject (name, email, organization)
- Public Key
- Validity dates
- Serial number
- Digital signature

#### Public Key (Separate Field)

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjATd3/dC+y4uNzmCyQHP
[... Base64 encoded public key ...]
-----END PUBLIC KEY-----
```

**Purpose:**
- Fast verification (no need to parse certificate)
- Distributed with signatures
- Used for cryptographic verification

#### Private Key (Encrypted & Secured)

```
807e193d4e631e...:9bea24e5f4be6...
[IV]:[Encrypted Private Key Data]
```

**Security Properties:**
- Never stored in plaintext
- Only decrypted in memory when signing
- Requires Master Encryption Key
- Tied to user ID (salt-based)
- Can only be decrypted with correct master key

### Certificate ID Generation

```
Format: CERT-{USERID}-{TIMESTAMP}-{RANDOM}

Example: CERT-507f1f77bcf86cd799439011-1771828365248-1KEVY5
          └────┬────┘└──────┬──────┘└───┬──┘└─────┬────┘
          User ID    Unix Timestamp   6-char Random

Benefits:
├─ Unique across all users
├─ Sortable by timestamp
├─ Non-sequential (random suffix prevents enumeration)
└─ Contains user ID for quick lookups
```

### Certificate Fingerprint

```
SHA-256 Fingerprint: 83B973BA34194C1E...

Used for:
├─ Uniquely identify certificate
├─ Verify certificate integrity
├─ Quick comparison (vs. full certificate)
└─ Auditing and logging

Fingerprint is:
├─ Deterministic (same cert = same fingerprint)
├─ Non-reversible (can't recreate cert from fingerprint)
└─ Collision-resistant (SHA-256)
```

### Returned Package Structure

```json
{
  "certificate_id": "CERT-507f1f77bcf86cd799439011-1771828365248-1KEVY5",
  
  "certificate_pem": "-----BEGIN CERTIFICATE-----\nMIIDtTCCAp2gAwIBAgIFdlpebfE...\n-----END CERTIFICATE-----",
  
  "public_key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8...\n-----END PUBLIC KEY-----",
  
  "private_key_encrypted": "807e193d4e631e3619db50314ae257ef:9bea24e5f4be6bc82...",
  
  "serial_number": "bb113d2f00",
  
  "issuer": "SigniStruct",
  
  "subject": "John Doe <john.doe@example.com>",
  
  "not_before": "2026-02-23T06:33:26.951Z",
  
  "not_after": "2031-02-23T06:33:26.951Z",
  
  "fingerprint_sha256": "83B973BA34194C1E...",
  
  "status": "active",
  
  "created_at": "2026-02-23T06:33:27.011Z"
}
```

---

## Security Architecture

### Key Management Strategy

```
Security Layers
├─────────────────────────────────────────────────────────
│ Layer 1: Transport Security (HTTPS/TLS)
│ ├─ Encrypts data in transit
│ └─ Protects against man-in-the-middle attacks
├─────────────────────────────────────────────────────────
│ Layer 2: Database Security
│ ├─ Only encrypted private keys stored
│ ├─ Certificates visible (safe - public)
│ └─ Public keys visible (safe - public)
├─────────────────────────────────────────────────────────
│ Layer 3: Encryption (AES-256)
│ ├─ Private keys encrypted with AES-256
│ ├─ Key derived with PBKDF2 (100K iterations)
│ └─ Salt derived from user ID
├─────────────────────────────────────────────────────────
│ Layer 4: Master Key Management
│ ├─ Stored in environment variables
│ ├─ Never in source code
│ ├─ Different per environment (dev/staging/prod)
│ └─ Rotatable for key compromise scenarios
├─────────────────────────────────────────────────────────
│ Layer 5: Runtime Security
│ ├─ Private key decrypted only when needed
│ ├─ Exists in memory during signing
│ ├─ Garbage collected after use
│ └─ Never logged or exposed
└─────────────────────────────────────────────────────────
```

### Data Flow During Signing Operation

```
User wants to sign document
    ↓
[1. Authentication]
    User is logged in and verified
    ↓
[2. Retrieve Encrypted Key]
    Get encrypted private key from database
    ↓
[3. Decrypt in Memory]
    Use Master Key + User ID to decrypt
    ↓
[4. Sign Document]
    Use private key to sign document hash
    ↓
[5. Create Signature]
    Store signature + certificate fingerprint
    Private key is garbage collected
    ↓
[6. Response]
    Return signature to user
    Private key NEVER leaves server
```

### Threat Model & Mitigations

| Threat | Impact | Mitigation |
|--------|--------|-----------|
| **Database Breach** | Encrypted keys exposed | AES-256 encryption needed to decrypt |
| **Master Key Exposed** | All keys can be decrypted | Stored separately, key rotation policy |
| **Network Interception** | Keys intercepted | HTTPS/TLS only, no keys transmitted |
| **Server Compromise** | Active memory dumped | Key exists only during signing, rotatable |
| **Signature Forgery** | Document authenticity | RSA-PSS with SHA-256, hard to forge |
| **Replay Attack** | Same signature reused | Include nonce/timestamp in signature envelope |

---

## Implementation Details

### API Endpoints

#### Generate Certificate
```
POST /api/certificates/generate
Body: { user_id }
Response: { certificate_id, public_key, message, status }
```

#### Get User Certificate
```
GET /api/certificates/user/:userId
Response: { certificate (without private_key_encrypted) }
```

#### Revoke Certificate
```
POST /api/certificates/revoke
Body: { certificate_id, reason }
Response: { message, revoked_at, status }
```

#### Verify Certificate
```
GET /api/certificates/verify/:certificateId
Response: { is_valid, not_expired, not_revoked, fingerprint }
```

### Database Indexes

```javascript
// Performance optimization indexes
users_certificates.createIndex({ user_id: 1 })                    // Fast user lookups
users_certificates.createIndex({ certificate_id: 1 }, unique)     // Unique ID
users_certificates.createIndex({ serial_number: 1 }, unique)      // Unique serial
users_certificates.createIndex({ fingerprint_sha256: 1 }, unique) // Unique fingerprint
users_certificates.createIndex({ status: 1 })                     // Filter by status
users_certificates.createIndex({ not_after: 1 })                  // Find expired certs
users_certificates.createIndex({ user_id: 1, status: 1 })         // Combined queries
```

### Environment Variables Required

```bash
# .env file
MASTER_ENCRYPTION_KEY=your-32-character-random-key-here
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=7d
DOCUMENT_UPLOAD_DIR=./uploads/documents
```

---

## Usage Examples

### Example 1: Generate Certificate for New User

```javascript
const CertificateService = require('./services/certificateService');

const userInfo = {
  userId: '507f1f77bcf86cd799439011',
  name: 'Alice Johnson',
  email: 'alice@example.com'
};

const masterEncryptionKey = process.env.MASTER_ENCRYPTION_KEY;

// Generate complete certificate package
const certificatePackage = CertificateService.generateCompleteCertificate(
  userInfo,
  masterEncryptionKey
);

// Save to database
const savedCert = await UserCertificate.create({
  user_id: userInfo.userId,
  ...certificatePackage
});

console.log('Certificate generated:', savedCert.certificate_id);
```

### Example 2: Verify Certificate

```javascript
// Get certificate from database
const certificate = await UserCertificate.findOne({ 
  certificate_id: 'CERT-...' 
});

// Check validity
const validityCheck = CertificateService.verifyCertificateValidity(certificate);

if (validityCheck.is_valid) {
  console.log('Certificate is valid and can be used');
} else {
  console.log('Certificate invalid:', validityCheck.message);
}
```

### Example 3: Sign Document

```javascript
// Get user's certificate and decrypted private key
const certificate = await UserCertificate.findOne({ user_id: userId });

// Decrypt private key (only in memory)
const privateKey = CertificateService.decryptPrivateKey(
  certificate.private_key_encrypted,
  process.env.MASTER_ENCRYPTION_KEY,
  userId
);

// Sign document (private key used here)
const signature = signDocumentWithPrivateKey(documentHash, privateKey);

// Private key is no longer referenced, garbage collected
// Return signature (never the private key)
return { signature, certificate_id: certificate.certificate_id };
```

### Example 4: Verify Signature

```javascript
// Get certificate
const certificate = await UserCertificate.findOne({
  certificate_id: signatureEnvelope.certificate_id
});

// Verify certificate validity
const validityCheck = CertificateService.verifyCertificateValidity(certificate);

if (!validityCheck.is_valid) {
  throw new Error('Certificate is not valid');
}

// Verify signature using public key
const publicKey = certificate.public_key;
const isValid = verifySignatureWithPublicKey(
  signatureEnvelope.signature_hash,
  documentHash,
  publicKey
);

return { is_valid: isValid, verified_at: new Date() };
```

---

## Summary

### Key Takeaways

1. **RSA Key Pair (2048-bit)**
   - Asymmetric encryption
   - Public + Private keys
   - Used for signing documents

2. **Self-Signed Certificates**
   - Contains public key + metadata
   - Signed with private key
   - Valid for 5 years
   - Legally recognized for eSignature

3. **AES-256 Encryption**
   - Symmetric encryption
   - PBKDF2 key derivation
   - Private keys encrypted at rest
   - Decrypted only when needed

4. **Complete Package**
   - Certificate ID (unique)
   - Certificate (PEM format)
   - Public Key (for verification)
   - Private Key (encrypted, never exposed)
   - Metadata (validity, fingerprint, status)

### Security Principles

- **Defense in Depth**: Multiple security layers
- **Least Privilege**: Keys only decrypted when necessary
- **Encryption at Rest**: Private keys always encrypted
- **Separation of Concerns**: Public/private key management
- **Auditability**: All operations logged
- **Compliance**: Follows NIST and industry standards

---

## References

- [NIST SP 800-132: Password-Based Key Derivation](https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-132.pdf)
- [FIPS 197: AES Specification](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197.pdf)
- [RFC 3394: AES Key Wrap Algorithm](https://tools.ietf.org/html/rfc3394)
- [RFC 5208: PKI Certificate Formats](https://tools.ietf.org/html/rfc5208)

---

**Document Created**: February 23, 2026  
**Last Updated**: February 23, 2026  
**Status**: Complete
