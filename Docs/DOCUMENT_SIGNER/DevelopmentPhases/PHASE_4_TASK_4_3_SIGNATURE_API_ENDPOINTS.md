# Phase 4: Document Signing - Task 4.3: Signature API Endpoints

**Date Implemented**: February 25, 2026  
**Status**: ✅ COMPLETED  
**Priority**: High  
**Phase**: 4/6

---

## 📋 Overview

Task 4.3 implements the **API Endpoints for Document Signing** (`documentSigningRoutes.js`, `documentController.js`, `documentValidation.js`), providing REST endpoints for:
- Signing documents with digital signatures
- Retrieving signatures on documents
- Verifying document signatures
- Managing signature lifecycle

These endpoints expose the cryptographic functionality from SigningService (Task 4.1) and EncryptionService (Task 4.2) through a RESTful API.

### What This Task Accomplishes

- ✅ POST endpoint to sign documents
- ✅ GET endpoint to retrieve all signatures on a document
- ✅ GET endpoint to retrieve specific signature details
- ✅ POST endpoint to verify all document signatures
- ✅ POST endpoint to revoke signatures
- ✅ Input validation for all endpoints
- ✅ Error handling and security checks
- ✅ Authorization (authentication + ownership verification)

---

## 📁 Files Created/Modified

### Created Files
```
backend/src/routes/documentSigningRoutes.js         (140+ lines)
backend/src/controllers/documentController.js       (330+ lines)
backend/src/middleware/documentValidation.js       (120+ lines)
```

### Dependencies (Already Installed)
- `express` ^4.18.2 - Web framework
- `express-validator` ^7.3.1 - Input validation
- `mongoose` ^7.0.0 - ODM with ObjectId validation

---

## 🔌 API Endpoints

### 1. POST `/api/documents/:documentId/sign`

**Purpose**: Sign a document with user's digital signature

**Authentication**: Required (Bearer token)

**URL Parameters**:
- `documentId` (string, ObjectId): The document to sign

**Request Body**:
```javascript
{
  userSignatureId: "507f1f77bcf86cd799439011",    // User's saved signature
  placement: {
    x: 100,                                       // X coordinate on page
    y: 500,                                       // Y coordinate on page
    width: 150,                                   // Signature width (pixels)
    height: 50,                                    // Signature height (pixels)
    page: 1                                        // Page number (1-indexed)
  }
}
```

**Response** (201 Created):
```javascript
{
  success: true,
  message: "Document signed successfully",
  signature: {
    _id: "507f1f77bcf86cd799439012",
    document_id: "507f1f77bcf86cd799439011",
    signer_id: "507f191e810c19729de860ea",
    signer_name: "John Doe",
    signer_email: "john@example.com",
    is_valid: true,
    verification_timestamp: "2026-02-25T12:00:00Z",
    placement: { x: 100, y: 500, width: 150, height: 50, page: 1 },
    created_at: "2026-02-25T12:00:00Z"
  }
}
```

**Error Responses**:
```javascript
// 400 Bad Request - Validation error
{
  success: false,
  errors: [{ param: "placement.x", msg: "X coordinate must be non-negative integer" }]
}

// 403 Forbidden - Not authorized to sign
{
  success: false,
  error: "You are not authorized to sign this document"
}

// 404 Not Found - Document or signature not found
{
  success: false,
  error: "Document not found"
}

// 409 Conflict - Already signed
{
  success: false,
  error: "You have already signed this document"
}

// 500 Server Error
{
  success: false,
  error: "Failed to sign document",
  message: "Detailed error message"
}
```

**Business Logic**:
1. Validate input (documentId, userSignatureId, placement)
2. Check document exists
3. Verify user is authorized (owner or signer)
4. Verify user signature exists
5. Check user hasn't already signed this document
6. Call `SigningService.signDocument()` with encryption key
7. Fetch user info for response
8. Return signature details with timestamps

**Example cURL**:
```bash
curl -X POST http://localhost:5000/api/documents/507f1f77bcf86cd799439011/sign \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "userSignatureId": "507f1f77bcf86cd799439012",
    "placement": {
      "x": 100,
      "y": 500,
      "width": 150,
      "height": 50,
      "page": 1
    }
  }'
```

---

### 2. GET `/api/documents/:documentId/signatures`

**Purpose**: Retrieve all signatures on a document with statistics

**Authentication**: Required (Bearer token)

**URL Parameters**:
- `documentId` (string, ObjectId): The document

**Query Parameters**: None

**Response** (200 OK):
```javascript
{
  success: true,
  document: {
    _id: "507f1f77bcf86cd799439011",
    title: "Contract.pdf",
    status: "partially_signed",              // draft | pending_signature | partially_signed | fully_signed | archived
    created_at: "2026-02-25T12:00:00Z"
  },
  signatures: [
    {
      _id: "507f1f77bcf86cd799439012",
      signer: {
        _id: "507f191e810c19729de860ea",
        name: "John Doe",
        email: "john@example.com"
      },
      is_valid: true,
      verification_timestamp: "2026-02-25T12:00:00Z",
      placement: { x: 100, y: 500, width: 150, height: 50, page: 1 },
      created_at: "2026-02-25T12:00:00Z"
    },
    {
      _id: "507f1f77bcf86cd799439013",
      signer: {
        _id: "507f191e810c19729de860eb",
        name: "Jane Smith",
        email: "jane@example.com"
      },
      is_valid: false,
      verification_timestamp: "2026-02-25T12:01:00Z",
      placement: { x: 100, y: 400, width: 150, height: 50, page: 2 },
      created_at: "2026-02-25T12:01:00Z"
    }
  ],
  statistics: {
    total_signatures: 2,
    valid_signatures: 1,
    required_signers: 2,
    signing_complete: false
  }
}
```

**Error Responses**:
```javascript
// 404 Not Found
{
  success: false,
  error: "Document not found"
}

// 500 Server Error
{
  success: false,
  error: "Failed to retrieve document signatures",
  message: "Detailed error message"
}
```

**Business Logic**:
1. Validate documentId
2. Verify document exists
3. Query all DocumentSignature records for document
4. Populate signer, user_signature, and certificate details
5. Calculate statistics (total, valid, required)
6. Sort by creation date (newest first)
7. Return formatted response with statistics

**Example cURL**:
```bash
curl -X GET http://localhost:5000/api/documents/507f1f77bcf86cd799439011/signatures \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 3. GET `/api/documents/:documentId/signatures/:signatureId`

**Purpose**: Get detailed information about a specific signature

**Authentication**: Required (Bearer token)

**URL Parameters**:
- `documentId` (string, ObjectId): The document
- `signatureId` (string, ObjectId): The specific signature

**Response** (200 OK):
```javascript
{
  success: true,
  signature: {
    _id: "507f1f77bcf86cd799439012",
    document_id: "507f1f77bcf86cd799439011",
    signer: {
      _id: "507f191e810c19729de860ea",
      name: "John Doe",
      email: "john@example.com"
    },
    certificate_id: "507f1f77bcf86cd799439020",
    certificate_valid_from: "2026-01-01T00:00:00Z",
    certificate_valid_to: "2031-01-01T00:00:00Z",
    is_valid: true,
    verification_timestamp: "2026-02-25T12:00:00Z",
    placement: { x: 100, y: 500, width: 150, height: 50, page: 1 },
    created_at: "2026-02-25T12:00:00Z"
  }
}
```

**Error Responses**:
```javascript
// 404 Not Found - Document or signature not found
{
  success: false,
  error: "Document not found"
}

// 500 Server Error
{
  success: false,
  error: "Failed to retrieve signature details",
  message: "Detailed error message"
}
```

**Example cURL**:
```bash
curl -X GET http://localhost:5000/api/documents/507f1f77bcf86cd799439011/signatures/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4. POST `/api/documents/:documentId/verify`

**Purpose**: Verify all signatures on a document

**Authentication**: Required (Bearer token)

**URL Parameters**:
- `documentId` (string, ObjectId): The document to verify

**Request Body**: Empty (no body required)

**Response** (200 OK):
```javascript
{
  success: true,
  verification: {
    document_id: "507f1f77bcf86cd799439011",
    document_title: "Contract.pdf",
    is_valid: true,                          // All signatures valid AND all certificates valid
    total_signatures: 2,
    valid_signatures: 2,
    verification_timestamp: "2026-02-25T12:00:00Z",
    message: "All signatures verified successfully",
    signatures: [
      {
        signature_id: "507f1f77bcf86cd799439012",
        signer_id: "507f191e810c19729de860ea",
        is_valid: true,
        signature_valid: true,                // RSA signature check passed
        certificate_valid: true,              // Certificate not expired
        certificate_status: "active"          // active | expired | not_yet_valid
      },
      {
        signature_id: "507f1f77bcf86cd799439013",
        signer_id: "507f191e810c19729de860eb",
        is_valid: false,
        signature_valid: false,               // RSA signature check failed
        certificate_valid: true,
        certificate_status: "active"
      }
    ]
  }
}
```

**Error Responses**:
```javascript
// 404 Not Found
{
  success: false,
  error: "Document not found"
}

// 500 Server Error
{
  success: false,
  error: "Failed to verify document",
  message: "Detailed error message"
}
```

**Business Logic**:
1. Validate documentId
2. Verify document exists
3. Call `SigningService.verifyDocument()` for all signatures
4. Logs verification attempt to audit trail
5. Returns detailed verification results for each signature
6. Overall validity = all signatures valid AND all certificates valid

**Example cURL**:
```bash
curl -X POST http://localhost:5000/api/documents/507f1f77bcf86cd799439011/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

---

### 5. POST `/api/documents/:documentId/signatures/:signatureId/revoke`

**Purpose**: Revoke a signature (mark as invalid)

**Authentication**: Required (Bearer token)

**Authorization**: Only document owner can revoke signatures

**URL Parameters**:
- `documentId` (string, ObjectId): The document
- `signatureId` (string, ObjectId): The signature to revoke

**Request Body**: Empty (no body required)

**Response** (200 OK):
```javascript
{
  success: true,
  message: "Signature revoked successfully",
  signature: {
    _id: "507f1f77bcf86cd799439012",
    is_valid: false,
    verification_timestamp: "2026-02-25T12:00:00Z"
  }
}
```

**Error Responses**:
```javascript
// 403 Forbidden - Not document owner
{
  success: false,
  error: "Only document owner can revoke signatures"
}

// 404 Not Found
{
  success: false,
  error: "Document not found"
}

// 500 Server Error
{
  success: false,
  error: "Failed to revoke signature",
  message: "Detailed error message"
}
```

**Business Logic**:
1. Validate parameters
2. Verify document exists
3. Verify user is document owner
4. Find signature by ID and document ID
5. Mark signature as invalid (is_valid = false)
6. Update verification timestamp
7. Return updated signature

**Example cURL**:
```bash
curl -X POST http://localhost:5000/api/documents/507f1f77bcf86cd799439011/signatures/507f1f77bcf86cd799439012/revoke \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

---

## 🔐 Security Implementation

### Authentication & Authorization

1. **All endpoints require Bearer token** (JWT from login)
   - Validated through `authMiddleware`
   - Sets `req.user` with decoded token data
   - Returns 401 Unauthorized if missing/invalid

2. **Document Access Control**
   ```
   /sign endpoint:
     - User must be owner OR listed as signer
     
   /revoke endpoint:
     - Only document owner can revoke
   ```

3. **Signature Duplication Prevention**
   ```
   /sign endpoint:
     - Check: Has user already signed this document?
     - Return 409 Conflict if yes
   ```

### Input Validation

```
documentId:
  ✓ Must be valid MongoDB ObjectId
  ✓ Must exist in database
  ✓ Must be non-empty

userSignatureId:
  ✓ Must be valid MongoDB ObjectId
  ✓ Must exist in database
  ✓ Must belong to authenticated user

placement.x, .y:
  ✓ Optional
  ✓ If provided: must be non-negative integer

placement.width, .height:
  ✓ Optional
  ✓ If provided: must be positive integer (>0)

placement.page:
  ✓ Optional
  ✓ If provided: must be positive integer (>0)
```

### Data Protection

1. **Private Key Encryption**
   - Never transmitted over API
   - Decrypted in-memory using MASTER_ENCRYPTION_KEY
   - Audit logged with truncated hash

2. **Signature Hash Truncation**
   - Full signature hash stored securely
   - API responses truncate to first 50 chars + '...'
   - Prevents hash information leakage

3. **Audit Logging**
   - Every sign/verify action logged
   - Includes: user ID, document ID, timestamp, IP, user agent
   - Success/failure recorded

---

## 📊 Integration Points

### With SigningService (Task 4.1)
```
signDocument() endpoint
  → Calls SigningService.signDocument()
    - Validates certificate
    - Signs document hash with RSA
    - Creates DatabaseSignature record
    - Updates document status
    - Logs to audit trail

verifyDocument() endpoint
  → Calls SigningService.verifyDocument()
    - Verifies all signatures cryptographically
    - Checks certificate validity
    - Returns detailed verification results
```

### With EncryptionService (Task 4.2)
```
signDocument() endpoint
  → Uses EncryptionService.decryptPrivateKey()
    - Inside SigningService.signDocument()
    - Decrypts private_key_encrypted from database
    - Uses MASTER_ENCRYPTION_KEY from environment
```

### With Database Models
```
✓ Document - The document being signed
✓ DocumentSignature - The signature record created
✓ UserCertificate - Certificate for signing
✓ UserSignature - User's saved signature image
✓ User - Signer information
✓ SignatureAuditLog - Audit trail
```

---

## 🧪 Testing Strategy

### Unit Tests
```
backend/tests/controllers/documentController.test.js
backend/tests/middleware/documentValidation.test.js
backend/tests/routes/documentSigningRoutes.test.js
```

**Test Cases**:

1. **Sign Document Tests**:
   - ✓ Sign document successfully
   - ✓ Cannot sign document twice
   - ✓ Cannot sign unauthorized document
   - ✓ Cannot sign with invalid signature ID
   - ✓ Document status updates correctly
   - ✓ Audit log created on success
   - ✓ Audit log created on failure

2. **Get Signatures Tests**:
   - ✓ Retrieve all signatures for document
   - ✓ Statistics calculated correctly
   - ✓ Returns 404 for non-existent document
   - ✓ Sorts by creation date

3. **Verify Document Tests**:
   - ✓ Verify document with valid signatures
   - ✓ Verify document with invalid signatures
   - ✓ Overall validity is correct
   - ✓ Certificate status checked
   - ✓ Audit log records verification

4. **Revoke Signature Tests**:
   - ✓ Revoke signature as document owner
   - ✓ Cannot revoke as non-owner
   - ✓ Updates is_valid flag
   - ✓ Returns 404 for non-existent signature

5. **Validation Tests**:
   - ✓ Rejects invalid documentId format
   - ✓ Rejects missing userSignatureId
   - ✓ Rejects invalid placement coordinates
   - ✓ Accepts optional placement fields
   - ✓ Returns proper error messages

### Integration Tests
```
1. Full signing workflow:
   - Create user and certificate
   - Upload document
   - Get user signature
   - Sign document
   - Verify document
   - Assert is_valid: true

2. Multiple signatures:
   - Create multiple users
   - Sign document with each user
   - Get all signatures
   - Verify all signatures
   - Assert all valid

3. Error scenarios:
   - Sign with expired certificate
   - Sign with revoked certificate
   - Sign without permission
   - Verify with tampered signature
```

### Performance Tests
```
- Signing large documents
- Verifying documents with many signatures (10+)
- Bulk verification operations
```

---

## 📝 Implementation Checklist

- [x] Create documentController.js with 5 endpoints
- [x] Create documentSigningRoutes.js with HTTP routes
- [x] Create documentValidation.js middleware
- [x] Implement signDocument() endpoint
- [x] Implement getDocumentSignatures() endpoint
- [x] Implement getSignatureDetails() endpoint
- [x] Implement verifyDocument() endpoint
- [x] Implement revokeSignature() endpoint
- [x] Add input validation
- [x] Add error handling
- [x] Add authorization checks
- [x] Add audit logging integration
- [x] Document all endpoints
- [ ] Create unit tests
- [ ] Create integration tests
- [ ] Create API documentation (Swagger/OpenAPI)

---

## 🚀 Integration with Server

To enable these endpoints, add to `backend/src/server.js`:

```javascript
const documentSigningRoutes = require('./routes/documentSigningRoutes');

// ... other routes ...

// Document Signing Routes
app.use('/api/documents', documentSigningRoutes);
```

---

## 📚 API Usage Example (Complete Flow)

### Step 1: Sign Document
```javascript
// User signs a document
const signResponse = await fetch('/api/documents/docId/sign', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userSignatureId: 'sigId123',
    placement: {
      x: 100,
      y: 500,
      width: 150,
      height: 50,
      page: 1
    }
  })
});
```

### Step 2: Get All Signatures
```javascript
// Retrieve all signatures on document
const signaturesResponse = await fetch('/api/documents/docId/signatures', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await signaturesResponse.json();
console.log(`Document has ${data.statistics.total_signatures} signatures`);
console.log(`Signing complete: ${data.statistics.signing_complete}`);
```

### Step 3: Verify Document
```javascript
// Verify all signatures
const verifyResponse = await fetch('/api/documents/docId/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const verification = await verifyResponse.json();
if (verification.verification.is_valid) {
  console.log('✅ Document is fully signed and verified');
} else {
  console.log('❌ Some signatures are invalid');
}
```

### Step 4: Get Signature Details
```javascript
// Get details of a specific signature
const detailsResponse = await fetch(
  '/api/documents/docId/signatures/sigId',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const signature = await detailsResponse.json();
console.log(`Signed by: ${signature.signature.signer.name}`);
console.log(`Valid: ${signature.signature.is_valid}`);
```

---

## 🔗 Related Tasks

- **Phase 4, Task 4.1**: SigningService (✅ Used by these endpoints)
- **Phase 4, Task 4.2**: EncryptionService (✅ Used by SigningService)
- **Phase 4, Task 4.4**: Signing UI Components (← Calls these endpoints)
- **Phase 5, Task 5.1**: VerificationService (← Can extend verification)
- **Phase 5, Task 5.2**: Audit Trail UI (← Displays this data)

---

## ✅ Summary

**Phase 4 Task 4.3** is now complete! The API endpoints provide:

✅ **Sign Document** - POST /api/documents/:documentId/sign  
✅ **Get Signatures** - GET /api/documents/:documentId/signatures  
✅ **Get Signature Details** - GET /api/documents/:documentId/signatures/:signatureId  
✅ **Verify Document** - POST /api/documents/:documentId/verify  
✅ **Revoke Signature** - POST /api/documents/:documentId/signatures/:signatureId/revoke  

---

## 🚀 Next Steps

1. Implement Task 4.4: Document Signing UI Components
2. Create comprehensive unit tests
3. Create API documentation (Swagger/OpenAPI)
4. Integration testing with frontend components
5. Performance and load testing

---

**Created by**: AI Assistant (reyxdz)  
**Date**: February 25, 2026  
**Status**: Ready for Integration & Testing
