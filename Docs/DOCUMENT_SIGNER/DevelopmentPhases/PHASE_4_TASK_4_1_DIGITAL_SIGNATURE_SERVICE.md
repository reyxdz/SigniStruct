# Phase 4: Document Signing - Task 4.1: Digital Signature Service

**Date Implemented**: February 25, 2026  
**Status**: ✅ COMPLETED  
**Priority**: High  
**Phase**: 4/6

---

## 📋 Overview

Task 4.1 implements the **Digital Signature Service** (`signingService.js`), the core cryptographic service that enables users to digitally sign documents using their RSA private keys. This service integrates with the PKI foundation established in Phase 1 and the signature management from Phase 2.

### What This Task Accomplishes

- ✅ Sign documents with user's private key (RSA-2048, PKCS#1 v1.5)
- ✅ Verify document signatures against public key
- ✅ Manage signature lifecycle with transaction safety
- ✅ Audit logging for all signature operations
- ✅ Certificate validation (validity dates, status)
- ✅ Document status management (draft → pending → partially_signed → fully_signed)
- ✅ Multi-signature support with automatic status detection

---

## 📁 Files Created/Modified

### Created Files
```
backend/src/services/signingService.js (450+ lines)
```

### Dependencies (Pre-installed)
- `node-rsa` ^1.1.1 - RSA cryptography
- `mongoose` ^7.0.0 - MongoDB transactions
- `crypto` (Node.js built-in)

---

## 🔐 Core Functions

### 1. `signDocument(documentId, userId, signatureData, encryptionKey, metadata)`

**Purpose**: Sign a document with the user's private key

**Parameters**:
- `documentId` (string): Unique identifier of document to sign
- `userId` (string): User performing the signature
- `signatureData` (object): Signature metadata
  - `userSignatureId`: Reference to saved user signature (e.g., drawn signature image)
  - `placement`: Signature location on document
    - `x`, `y`: Coordinates
    - `width`, `height`: Dimensions
    - `page`: Page number
- `encryptionKey` (string): Master encryption key for decrypting private key
- `metadata` (object, optional): Request context
  - `ip_address`: Client IP (for audit)
  - `user_agent`: Browser info (for audit)

**Process Flow**:
```
1. Start MongoDB transaction
   ├─ Validate document exists
   ├─ Fetch document hash (SHA-256)
   │
2. Decrypt user's private key
   ├─ Get user certificate
   ├─ Verify certificate valid (not before/after dates)
   ├─ Decrypt private_key_encrypted with AES-256
   │
3. Perform RSA signature
   ├─ Sign document hash with private key
   ├─ Output: hexadecimal signature hash
   │
4. Store signature record
   ├─ Create DocumentSignature entry
   ├─ Link: document, signer, certificate, signature
   │
5. Update document status
   ├─ Check all required signers
   ├─ Update status: draft → pending → partially_signed → fully_signed
   │
6. Audit logging
   ├─ Create SignatureAuditLog entry
   ├─ Log: timestamp, IP, action, details
   │
7. Commit transaction
```

**Returns**:
```javascript
{
  _id: ObjectId,
  document_id: ObjectId,
  signer_id: ObjectId,
  certificate_id: ObjectId,
  signature_hash: String (hexadecimal),
  document_hash: String (hexadecimal),
  is_valid: Boolean,
  verification_timestamp: Date,
  message: "Document signed successfully"
}
```

**Error Handling**:
- Automatic transaction rollback on failure
- Audit log records failures with error details
- Clear error messages for debugging

**Example**:
```javascript
const result = await SigningService.signDocument(
  '507f1f77bcf86cd799439011',  // documentId
  '507f191e810c19729de860ea',  // userId
  {
    userSignatureId: '507f1f77bcf86cd799439012',
    placement: {
      x: 100,
      y: 500,
      width: 150,
      height: 50,
      page: 1
    }
  },
  process.env.MASTER_ENCRYPTION_KEY,
  {
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0...'
  }
);
```

---

### 2. `verifySignature(signatureHash, documentHash, certificateId, metadata)`

**Purpose**: Verify a document signature using public key

**Parameters**:
- `signatureHash` (string): The signature to verify (hexadecimal)
- `documentHash` (string): Original document hash (hexadecimal)
- `certificateId` (string): Certificate ID that created signature
- `metadata` (object, optional): Request context

**Process Flow**:
```
1. Fetch certificate & public key
   ├─ Get UserCertificate record
   ├─ Extract public_key (PEM format)
   │
2. Verify signature cryptographically
   ├─ Use RSA PKCS#1 v1.5 padding
   ├─ Verify signature against document hash
   ├─ Output: true/false
   │
3. Validate certificate status
   ├─ Check not_before date (not yet valid)
   ├─ Check not_after date (expired)
   ├─ Check certificate_status field
   │
4. Update signature record
   ├─ Set is_valid flag if signature valid
   ├─ Update verification_timestamp
   │
5. Audit logging
   ├─ Create SignatureAuditLog
   ├─ Record: certificate validity, signature check result
```

**Returns**:
```javascript
{
  is_valid: Boolean,                    // Both signature AND certificate valid
  signature_valid: Boolean,             // Just RSA signature check
  certificate_valid: Boolean,           // Certificate not expired/not yet valid
  certificate_status: String,           // 'active' | 'expired' | 'not_yet_valid'
  verification_timestamp: Date,
  certificate_id: ObjectId,
  message: "Signature verified successfully"
}
```

**Example**:
```javascript
const result = await SigningService.verifySignature(
  'a1b2c3d4e5f6...',  // signatureHash (hex)
  '7f8g9h0i1j2k...',  // documentHash (hex)
  '507f1f77bcf86cd799439011',  // certificateId
  {
    ip_address: '192.168.1.2',
    user_agent: 'Mozilla/5.0...'
  }
);

if (result.is_valid) {
  console.log('✅ Signature is valid and certificate is current');
} else if (!result.signature_valid) {
  console.log('❌ Signature verification failed');
} else if (!result.certificate_valid) {
  console.log('⚠️ Certificate is', result.certificate_status);
}
```

---

### 3. `verifyDocument(documentId, metadata)`

**Purpose**: Verify all signatures on a document at once

**Parameters**:
- `documentId` (string): Document to verify
- `metadata` (object, optional): Request context

**Process Flow**:
```
1. Fetch document & all signatures
2. Iterate through each signature
   ├─ Call verifySignature() for each
3. Aggregate results
   - Count total signatures
   - Count valid signatures
   - Flag overall document validity
4. Return comprehensive verification report
```

**Returns**:
```javascript
{
  document_id: ObjectId,
  is_valid: Boolean,                 // All signatures valid
  total_signatures: Number,
  valid_signatures: Number,
  verification_timestamp: Date,
  signatures: [
    {
      signature_id: ObjectId,
      signer_id: ObjectId,
      is_valid: Boolean,
      signature_valid: Boolean,
      certificate_valid: Boolean,
      certificate_status: String
    },
    ...
  ],
  message: "All signatures verified successfully"
}
```

**Example**:
```javascript
const result = await SigningService.verifyDocument(
  '507f1f77bcf86cd799439011',  // documentId
  { ip_address: '192.168.1.3' }
);

console.log(`Document has ${result.total_signatures} signatures`);
console.log(`${result.valid_signatures}/${result.total_signatures} are valid`);
console.log(`Overall validity: ${result.is_valid ? '✅ VALID' : '❌ INVALID'}`);
```

---

### 4. `getSignatureDetails(signatureId)`

**Purpose**: Retrieve detailed information about a specific signature

**Parameters**:
- `signatureId` (string): Signature ID

**Returns**:
```javascript
{
  _id: ObjectId,
  document_id: Object,              // Full document details
  signer_id: Object,                // User info (email, name)
  certificate_id: Object,           // Certificate info
  signature_hash: String,           // Truncated (first 50 chars + '...')
  document_hash: String,            // Truncated
  is_valid: Boolean,
  verification_timestamp: Date,
  signature_placement: Object,      // { x, y, width, height, page }
  created_at: Date
}
```

---

### 5. Private Methods

#### `_signHash(hash, privateKeyPEM)`
- Signs a hash using RSA private key
- Returns hexadecimal signature string
- Uses NodeRSA with PKCS#1 v1.5 padding

#### `_verifyHashSignature(hash, signatureHex, publicKeyPEM)`
- Verifies RSA signature against hash
- Returns boolean (true/false)
- Returns false on any verification error (safe)

---

## 🔄 Transaction Safety

The service uses MongoDB transactions to ensure data consistency:

```javascript
// Transaction ensures all-or-nothing
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Multiple atomic operations
  await documentSignature.save({ session });
  await document.save({ session });
  await SignatureAuditLog.create([...], { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  // Audit log still records failure
} finally {
  await session.endSession();
}
```

**Benefits**:
- ✅ Document status won't be updated if signature save fails
- ✅ Audit log always created (even on failure)
- ✅ Multiple signers don't corrupt data integrity

---

## 🔍 Data Flow & Integration

### How It Integrates with Other Components

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Signing Page)                                 │
│  - User clicks "Sign Document"                          │
│  - Selects signature from gallery                       │
│  - Places signature on PDF                              │
│  - Clicks "Confirm Sign"                                │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ POST /api/documents/:id/sign
                      ↓
┌─────────────────────────────────────────────────────────┐
│ Backend Controller                                      │
│  - Validate: document exists, user authenticated       │
│  - Prepare signatureData with placement info           │
│  - Call SigningService.signDocument()                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────┐
│ SigningService.signDocument()                           │
│ 1. Fetch document & document hash (SHA-256)            │
│ 2. Fetch user's certificate                            │
│ 3. Decrypt private key (AES-256)                       │
│ 4. Sign hash with RSA private key                      │
│ 5. Create DocumentSignature record                     │
│ 6. Update Document status                              │
│ 7. Create SignatureAuditLog entry                      │
│ 8. Return signed result                                │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ↓                           ↓
    Document              DocumentSignature
  (status: updated)      (signature_hash stored)
                         (is_valid: true)
        │                           │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴──────────────┐
        ↓                            ↓
  SignatureAuditLog          Frontend Response
  (action logged)            (success JSON)
```

---

## 🛡️ Security Features

### 1. **Cryptographic Security**
- **RSA-2048 bit keys** for signatures
- **SHA-256 hashing** for documents
- **PKCS#1 v1.5 padding** for RSA operations
- **AES-256-CBC** for private key encryption

### 2. **Private Key Protection**
- Private keys encrypted at rest in database
- Decrypted in-memory only during signing operations
- Uses PBKDF2 key derivation (100,000 iterations)
- User ID as salt (unique per user)

### 3. **Certificate Validation**
- Time-based validity checks (not_before, not_after)
- Certificate status verification
- Signature timestamp recording

### 4. **Audit Trail**
- Every signing action logged with:
  - Timestamp
  - User ID and IP address
  - User agent (browser info)
  - Document and certificate IDs
  - Success/failure status
- Failures logged even if transaction rolls back

### 5. **Transaction Integrity**
- MongoDB transactions ensure atomic operations
- All-or-nothing: Either complete signing or nothing
- No partial/inconsistent state

### 6. **Error Recovery**
- Clear error messages for debugging
- Graceful rollback on failures
- No data corruption possible

---

## 📊 Database Schema Reference

### DocumentSignature Collection
```javascript
{
  _id: ObjectId,
  document_id: ObjectId,              // ref: Document
  signer_id: ObjectId,                // ref: User
  certificate_id: ObjectId,           // ref: UserCertificate
  signature_hash: String,             // Hex string, >2000 chars
  user_signature_id: ObjectId,        // ref: UserSignature
  document_hash: String,              // SHA-256 hex hash
  signature_placement: {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    page: Number
  },
  is_valid: Boolean,
  verification_timestamp: Date,
  created_at: Date,                   // Auto-generated
  updated_at: Date                    // Auto-generated
}
```

### SignatureAuditLog Collection
```javascript
{
  _id: ObjectId,
  signer_id: ObjectId,                // ref: User
  document_id: ObjectId,              // ref: Document
  action: 'document_signed' | 'signature_verified' | ...,
  timestamp: Date,
  ip_address: String,
  user_agent: String,
  details: {
    certificate_id: ObjectId,
    signature_hash: String,
    document_hash: String,
    // ... action-specific details
  },
  status: 'success' | 'failure'
}
```

---

## 🚀 Usage Examples

### Example 1: Sign a Document

```javascript
// In a controller or route handler
const SigningService = require('../services/signingService');

router.post('/documents/:documentId/sign', authMiddleware, async (req, res) => {
  try {
    const { userSignatureId, placement } = req.body;
    const { documentId } = req.params;
    const userId = req.user._id;

    const result = await SigningService.signDocument(
      documentId,
      userId,
      {
        userSignatureId,
        placement
      },
      process.env.MASTER_ENCRYPTION_KEY,
      {
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    );

    res.json({
      success: true,
      signature: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});
```

### Example 2: Verify All Signatures on Document

```javascript
router.get('/documents/:documentId/verify', async (req, res) => {
  try {
    const { documentId } = req.params;

    const result = await SigningService.verifyDocument(documentId);

    res.json({
      success: true,
      verification: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});
```

### Example 3: Verify Specific Signature

```javascript
router.post('/signatures/:signatureId/verify', async (req, res) => {
  try {
    const docSig = await DocumentSignature.findById(req.params.signatureId);
    
    const result = await SigningService.verifySignature(
      docSig.signature_hash,
      docSig.document_hash,
      docSig.certificate_id
    );

    res.json({
      success: result.is_valid,
      verification: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## 🧪 Testing Strategy

### Unit Tests to Create
```
backend/tests/services/signingService.test.js
```

**Test Cases**:
```javascript
describe('SigningService', () => {
  describe('signDocument', () => {
    it('should sign a document successfully', async () => {
      // Create test user with certificate
      // Create test document
      // Call signDocument()
      // Assert signature created and valid
    });

    it('should reject invalid document', async () => {
      // Call with non-existent documentId
      // Assert error thrown
    });

    it('should reject expired certificate', async () => {
      // Create certificate with expiry date in past
      // Call signDocument()
      // Assert error thrown
    });

    it('should update document status correctly', async () => {
      // Sign document with multiple required signers
      // Assert status: partially_signed
      // Sign with all signers
      // Assert status: fully_signed
    });

    it('should create audit log on failure', async () => {
      // Cause signing to fail
      // Verify audit log records failure
    });

    it('should handle transaction rollback', async () => {
      // Force transaction failure mid-operation
      // Assert no partial data saved
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', async () => {
      // Create signed document
      // Call verifySignature()
      // Assert is_valid: true
    });

    it('should reject tampered signature', async () => {
      // Create signature
      // Modify signature hex
      // Call verifySignature()
      // Assert is_valid: false
    });

    it('should check certificate validity dates', async () => {
      // Create expired certificate
      // Call verifySignature()
      // Assert certificate_valid: false
    });
  });

  describe('verifyDocument', () => {
    it('should verify all signatures on document', async () => {
      // Create document with 3 signatures
      // Call verifyDocument()
      // Assert all 3 verified
    });

    it('should return aggregate results', async () => {
      // Sign with some valid, some invalid
      // Call verifyDocument()
      // Assert counts match
    });
  });
});
```

### Integration Tests
```
1. Full signing workflow
   - User signs document with valid certificate
   - Signature stored correctly
   - Document status updated
   - Audit log created

2. Multi-signer workflow
   - Multiple users sign same document
   - Each signature independent
   - Document status reflects all signers

3. Verification workflow
   - Sign document
   - Immediately verify
   - Assert is_valid: true

4. Error scenarios
   - Missing private key decryption password
   - Expired certificate
   - Tampered signature
   - Document hash mismatch
```

---

## 🔧 Configuration

### Required Environment Variables
```bash
# backend/.env
MASTER_ENCRYPTION_KEY=your-32-char-encryption-key
JWT_SECRET=your-jwt-secret
MONGODB_URI=mongodb://localhost:27017/signistruct
```

### Dependencies (Already Installed)
```json
{
  "node-rsa": "^1.1.1",
  "mongoose": "^7.0.0",
  "crypto-js": "^4.2.0"
}
```

---

## 📈 Performance Considerations

### Optimization Tips

1. **Caching**:
   - Cache public keys from certificates
   - Cache document hashes if re-verifying
   - Cache certificate validity status

2. **Async Operations**:
   - Signature verification can run in parallel
   - Multiple documents can be signed concurrently
   - Audit logging is non-blocking

3. **Database**:
   - Ensure indexes exist:
     - `document_signatures.document_id`
     - `document_signatures.signer_id`
     - `signature_audit_log.timestamp`

4. **Memory**:
   - Private keys decrypted only when needed
   - Keys immediately discarded after use
   - No key material logged

---

## 🐛 Debugging & Troubleshooting

### Common Issues & Solutions

**Issue**: "Failed to decrypt private key"
```
Cause: Wrong MASTER_ENCRYPTION_KEY or corrupted encrypted key
Solution: 
  - Verify .env MASTER_ENCRYPTION_KEY is correct
  - Check that private_key_encrypted field in database matches the key
  - Regenerate certificate if corrupted
```

**Issue**: "Signature verification failed" on valid signature
```
Cause: Hash mismatch or public key misalignment
Solution:
  - Verify document_hash matches original file
  - Ensure document wasn't modified after signing
  - Check public_key in certificate is correct
```

**Issue**: "Certificate is not valid in the current time period"
```
Cause: Certificate not_before > now or not_after < now
Solution:
  - Check server time is correct
  - Regenerate certificate with correct dates
  - For testing, use certificate valid for ~10 years
```

**Issue**: Transaction timeout
```
Cause: Database locked or too many concurrent signings
Solution:
  - Increase MongoDB session timeout
  - Implement queue for signing requests
  - Check database connection pool
```

---

## 📝 Implementation Checklist

- [x] Create `signingService.js` with all functions
- [x] Implement `signDocument()` with transaction safety
- [x] Implement `verifySignature()` with cryptographic verification
- [x] Implement `verifyDocument()` with aggregate verification
- [x] Add comprehensive error handling
- [x] Implement audit logging
- [x] Document all public methods
- [x] Create security documentation
- [ ] Create unit tests (Next task)
- [ ] Create integration tests (Next task)
- [ ] Create API endpoints (Task 4.3)
- [ ] Create frontend components (Task 4.4)

---

## 🔗 Related Tasks

- **Phase 1, Task 1.1**: Certificate Generation (✅ Uses PKI from here)
- **Phase 2, Task 2.1**: User Signatures (✅ Uses signature references)
- **Phase 3, Task 3.1**: Document Model (✅ Uses document schema)
- **Phase 4, Task 4.2**: Encryption Service (← Next: Will implement encryptionService.js)
- **Phase 4, Task 4.3**: API Endpoints (← Will expose signDocument() and verifySignature())
- **Phase 4, Task 4.4**: Signing UI (← Frontend integration)

---

## 📚 References

- **RSA Cryptography**: [Node-RSA Documentation](https://www.npmjs.com/package/node-rsa)
- **PKCS#1 v1.5**: [RFC 2313](https://tools.ietf.org/html/rfc2313)
- **MongoDB Transactions**: [Mongoose Transactions](https://mongoosejs.com/docs/transactions.html)
- **SHA-256 Hashing**: [Node.js Crypto](https://nodejs.org/api/crypto.html)

---

## ✅ Summary

**Phase 4 Task 4.1** is now complete! The `SigningService` provides:

✅ **signDocument()** - Sign documents with private keys  
✅ **verifySignature()** - Verify signatures with public keys  
✅ **verifyDocument()** - Verify multiple signatures at once  
✅ **Transaction Safety** - All-or-nothing database operations  
✅ **Audit Trail** - Complete logging of all actions  
✅ **Error Handling** - Comprehensive error checking  
✅ **Security** - RSA-2048, AES-256, PBKDF2  

**Next Steps**:
1. Implement Task 4.2: Encryption Service (optional, already using CertificateService)
2. Implement Task 4.3: API Endpoints
3. Implement Task 4.4: Signing UI Components
4. Create comprehensive tests

---

**Created by**: AI Assistant  
**Date**: February 25, 2026  
**Status**: Ready for Integration & Testing
