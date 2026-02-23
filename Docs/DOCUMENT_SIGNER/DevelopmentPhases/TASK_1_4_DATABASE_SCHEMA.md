# Phase 1 Task 1.4: Update Database Schema

**Status**: ✅ Complete  
**Date Completed**: February 23, 2026  
**Related Tasks**: Task 1.1, Task 1.2, Task 1.3

---

## Overview

This task implements the database schema and indexes for the document signing system. It creates all necessary MongoDB collections, defines schemas with proper field validation, and establishes database indexes for optimal query performance. The implementation ensures data integrity, supports efficient retrieval, and enables ACID-compliant operations.

---

## Files Created

### 1. UserSignature Model
**File**: `backend/src/models/UserSignature.js`

Schema for storing user signature artifacts (drawn, uploaded, or typed signatures).

**Fields**:
- `user_id` (ObjectId, required, indexed) - Reference to User
- `signature_image` (String, required) - Base64 encoded signature image
- `signature_type` (String, enum) - 'drawn', 'uploaded', 'typed'
- `is_default` (Boolean) - Mark as default signature
- `created_at` (Date, indexed) - Creation timestamp
- `updated_at` (Date) - Last update timestamp

**Indexes**:
```
user_id
user_id + is_default
created_at (descending)
```

### 2. Document Model
**File**: `backend/src/models/Document.js`

Schema for storing documents that need to be signed.

**Fields**:
- `owner_id` (ObjectId, required, indexed) - Document owner reference
- `title` (String, required) - Document title
- `file_url` (String, required) - Path to document file
- `file_hash_sha256` (String, required, unique) - SHA-256 hash of file content
- `status` (String, enum, indexed) - 'draft', 'pending_signature', 'partially_signed', 'fully_signed', 'archived'
- `signers` (Array of Objects) - Array of signer information
  - `user_id` (ObjectId)
  - `email` (String)
  - `signed_at` (Date)
  - `signature_id` (ObjectId)
  - `status` ('pending', 'signed', 'declined')
- `created_at` (Date, indexed)
- `updated_at` (Date)
- `completed_at` (Date)

**Indexes**:
```
owner_id
status
owner_id + status
created_at (descending)
```

### 3. DocumentSignature Model
**File**: `backend/src/models/DocumentSignature.js`

Schema for storing individual signatures on documents.

**Fields**:
- `document_id` (ObjectId, required, indexed) - Reference to Document
- `signer_id` (ObjectId, required, indexed) - Reference to User who signed
- `certificate_id` (ObjectId, required, indexed) - Reference to signing certificate
- `signature_hash` (String, required) - Hash of the signature
- `user_signature_id` (ObjectId, required) - Reference to UserSignature artifact
- `document_hash` (String, required) - Hash of the document at time of signing
- `signature_placement` (Object) - Signature position on document
  - `x`, `y` - Coordinates
  - `width`, `height` - Dimensions
  - `page` - Page number
- `is_valid` (Boolean) - Signature validation status
- `verification_timestamp` (Date) - When signature was verified
- `timestamp` (Date, indexed) - Signing timestamp
- `notes` (String) - Optional notes about signature

**Indexes**:
```
document_id
signer_id
certificate_id
document_id + signer_id
timestamp (descending)
```

### 4. SignatureAuditLog Model
**File**: `backend/src/models/SignatureAuditLog.js`

Schema for audit trail of all signing-related operations.

**Fields**:
- `signer_id` (ObjectId, required, indexed) - User performing action
- `document_id` (ObjectId, indexed) - Related document
- `action` (String, enum, indexed) - Type of action performed
  - 'certificate_generated'
  - 'certificate_revoked'
  - 'signature_created'
  - 'document_signed'
  - 'signature_verified'
  - 'document_verified'
  - 'signature_revoked'
- `timestamp` (Date, indexed) - Action timestamp
- `ip_address` (String) - IP address of request
- `user_agent` (String) - Browser/client info
- `details` (Mixed) - Additional action details
- `status` (String) - 'success' or 'failure'
- `error_message` (String) - Error details if failed
- `certificate_id` (ObjectId) - Associated certificate
- `signature_id` (ObjectId) - Associated signature

**Indexes**:
```
timestamp (descending)
action
signer_id
document_id
timestamp (descending) + action
```

---

## Files Modified

### Database Initialization Utility
**File**: `backend/src/utils/databaseInit.js`

Enhanced with comprehensive index creation logic:

**Functions**:
- `initializeDatabaseSchema()` - Main initialization function
- `ensureCollectionsExist()` - Create collections if they don't exist
- `createIndexes()` - Create all defined indexes
- `dropSigningCollections()` - Development utility to reset database

**Collections Created/Managed**:
1. `users_certificates` - Digital certificates
2. `user_signatures` - User signature artifacts
3. `documents` - Documents for signing
4. `document_signatures` - Individual signatures
5. `signature_audit_log` - Audit trail

### Server Configuration
**File**: `backend/src/server.js`

**Changes**:
- Import `initializeDatabaseSchema` from databaseInit utility
- Call `initializeDatabaseSchema()` immediately after MongoDB connection
- Ensures indexes are created before server starts accepting requests

---

## Database Index Strategy

### Index Types and Purpose

#### 1. Single Field Indexes
Used for common filtering operations:
```
user_id        - Query documents by user
status         - Query by document/cert status
owner_id       - Query documents by owner
document_id    - Query signatures by document
timestamp      - Query audit logs by time
```

#### 2. Compound Indexes
Optimized for multi-field queries:
```
owner_id + status     - Find user's documents with specific status
user_id + is_default  - Find user's default signature
document_id + signer_id - Find specific signature on document
timestamp + action    - Audit log queries by time and action
```

#### 3. Unique Indexes
Enforce data integrity:
```
certificate_id          - One certificate ID per record
serial_number          - Unique certificate serial number
fingerprint_sha256     - Unique certificate fingerprint
file_hash_sha256       - Prevent duplicate documents
```

#### 4. Descending Indexes
For reverse chronological queries:
```
created_at (descending)     - Recent records first
timestamp (descending)      - Recent audit logs first
not_after (descending)      - Recently expiring certificates first
```

---

## Index Specifications

### Complete Index List

#### users_certificates Collection
```javascript
[
  { key: { user_id: 1 }, name: 'user_id_idx' },
  { key: { certificate_id: 1 }, unique: true, name: 'certificate_id_unique' },
  { key: { serial_number: 1 }, unique: true, name: 'serial_number_unique' },
  { key: { fingerprint_sha256: 1 }, unique: true, name: 'fingerprint_unique' },
  { key: { status: 1 }, name: 'status_idx' },
  { key: { not_after: 1 }, name: 'expiry_idx' },
  { key: { created_at: -1 }, name: 'created_at_idx' },
  { key: { user_id: 1, status: 1 }, name: 'user_status_idx' }
]
```

#### user_signatures Collection
```javascript
[
  { key: { user_id: 1 }, name: 'user_id_idx' },
  { key: { user_id: 1, is_default: 1 }, name: 'user_default_idx' },
  { key: { created_at: -1 }, name: 'created_at_idx' }
]
```

#### documents Collection
```javascript
[
  { key: { owner_id: 1 }, name: 'owner_id_idx' },
  { key: { status: 1 }, name: 'status_idx' },
  { key: { owner_id: 1, status: 1 }, name: 'owner_status_idx' },
  { key: { created_at: -1 }, name: 'created_at_idx' }
]
```

#### document_signatures Collection
```javascript
[
  { key: { document_id: 1 }, name: 'document_id_idx' },
  { key: { signer_id: 1 }, name: 'signer_id_idx' },
  { key: { document_id: 1, signer_id: 1 }, name: 'document_signer_idx' },
  { key: { timestamp: -1 }, name: 'timestamp_idx' },
  { key: { certificate_id: 1 }, name: 'certificate_id_idx' }
]
```

#### signature_audit_log Collection
```javascript
[
  { key: { signer_id: 1 }, name: 'signer_id_idx' },
  { key: { document_id: 1 }, name: 'document_id_idx' },
  { key: { timestamp: -1 }, name: 'timestamp_idx' },
  { key: { action: 1 }, name: 'action_idx' },
  { key: { timestamp: -1, action: 1 }, name: 'timestamp_action_idx' }
]
```

---

## MongoDB Collection Schema Validation

### Collection Naming Convention
All collections follow lowercase, plural naming:
- `users_certificates` (not user_certificate)
- `user_signatures` (not user_signature)
- `document_signatures` (not document_signature)
- `signature_audit_log` (singular, for audit log)

### Field Naming Convention
- Snake case for MongoDB fields: `user_id`, `certificate_id`, `is_default`
- Mongoose auto-timestamps: `created_at`, `updated_at`
- Nullable fields default to `null`
- Status fields use enums for type safety

---

## Initialization Process

### On Server Startup

1. **MongoDB Connection**
   ```
   Connect to MongoDB using MONGODB_URI environment variable
   ```

2. **Database Schema Initialization**
   ```
   ensureCollectionsExist()
   ├─ Create users_certificates collection
   ├─ Create user_signatures collection
   ├─ Create documents collection
   ├─ Create document_signatures collection
   └─ Create signature_audit_log collection
   ```

3. **Index Creation**
   ```
   createIndexes()
   ├─ Create indexes on users_certificates
   ├─ Create indexes on user_signatures
   ├─ Create indexes on documents
   ├─ Create indexes on document_signatures
   └─ Create indexes on signature_audit_log
   ```

4. **Server Ready**
   ```
   All collections and indexes created
   Server can now accept requests
   ```

### Initialization Logging

Console output during startup:
```
🔧 Initializing database schema for document signing...
✓ Created collection: users_certificates
✓ Collection already exists: user_signatures
✓ Created index on users_certificates: {"user_id":1}
✓ Created index on users_certificates: {"certificate_id":1}
... (more indexes)
✅ Database schema initialization completed successfully
```

---

## Query Examples Using Indexes

### Find User's Certificates
```javascript
// Uses index: { user_id: 1, status: 1 }
db.users_certificates.find({ user_id: userId, status: 'active' })
```

### Find Documents by Owner and Status
```javascript
// Uses index: { owner_id: 1, status: 1 }
db.documents.find({ owner_id: ownerId, status: 'pending_signature' })
```

### Find All Signatures for a Document
```javascript
// Uses index: { document_id: 1 }
db.document_signatures.find({ document_id: docId })
```

### Find Recent Audit Logs
```javascript
// Uses index: { timestamp: -1 }
db.signature_audit_log.find().sort({ timestamp: -1 }).limit(100)
```

### Find User's Default Signature
```javascript
// Uses index: { user_id: 1, is_default: 1 }
db.user_signatures.findOne({ user_id: userId, is_default: true })
```

### Audit Trail for Specific Action
```javascript
// Uses index: { timestamp: -1, action: 1 }
db.signature_audit_log
  .find({ action: 'document_signed', timestamp: { $gte: startDate } })
  .sort({ timestamp: -1 })
```

---

## Data Integrity Constraints

### Unique Constraints
- `certificate_id` - Prevents duplicate certificates
- `serial_number` - Ensures unique certificate serials
- `fingerprint_sha256` - Unique certificate fingerprints
- `file_hash_sha256` - Prevents duplicate document uploads

### Required Fields
All critical fields are marked as required:
- Document must have owner
- Certificate must have public key
- Signature must reference document and signer
- Audit logs must have action and timestamp

### Referential Integrity
Foreign keys (ObjectId fields) reference related documents:
- `user_id` → User collection
- `document_id` → Document collection
- `signer_id` → User collection
- `certificate_id` → UserCertificate collection

---

## Performance Considerations

### Index Coverage
Indexes are designed to cover most common queries:
- User-centric queries: `user_id` indexes
- Status-based filtering: `status` indexes
- Time-based queries: `timestamp`, `created_at` indexes
- Combined queries: Compound indexes

### Index Size Trade-offs
- Additional indexes improve query speed
- Trade-off: Slightly slower writes (index maintenance)
- Optimal balance for typical signing workflow

### Recommended MongoDB Settings
```javascript
// For production deployments
db.setProfilingLevel(1, { slowms: 100 })  // Log queries > 100ms
db.createIndex({ ns: 1, "key": 1 }, { background: true })  // Background indexing
```

---

## File Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── User.js                 (existing, modified in 1.3)
│   │   ├── UserCertificate.js      (existing, has indexes)
│   │   ├── UserSignature.js        (NEW)
│   │   ├── Document.js             (NEW)
│   │   ├── DocumentSignature.js    (NEW)
│   │   └── SignatureAuditLog.js    (NEW)
│   ├── utils/
│   │   ├── databaseInit.js         (updated)
│   │   └── indexManager.js         (reference in databaseInit)
│   └── server.js                   (modified)
```

---

## Git Commits

Implemented with 6 separate commits:

1. `feat: Create UserSignature model with schema and indexes for storing user signatures`
2. `feat: Create Document model with schema and indexes for storing documents`
3. `feat: Create DocumentSignature model with schema and indexes for document signatures`
4. `feat: Create SignatureAuditLog model with schema and indexes for audit trail`
5. `feat: Integrate database schema initialization with MongoDB connection`

---

## Environment Variables Required

```env
MONGODB_URI=mongodb://localhost:27017/signistruct
NODE_ENV=development
```

---

## Testing the Database Setup

### 1. Verify Collections Created
```javascript
// In MongoDB shell
show collections
// Output should include:
// users_certificates
// user_signatures
// documents
// document_signatures
// signature_audit_log
```

### 2. Verify Indexes Created
```javascript
// Check indexes for users_certificates
db.users_certificates.getIndexes()

// Output example:
// [
//   { v: 2, key: { _id: 1 } },
//   { v: 2, key: { user_id: 1 }, name: 'user_id_idx' },
//   { v: 2, key: { certificate_id: 1 }, unique: true, name: 'certificate_id_unique' },
//   ...
// ]
```

### 3. Test Index Usage
```javascript
// Test query performance with explain()
db.documents.find({ owner_id: ObjectId("..."), status: "draft" }).explain("executionStats")

// Should show "COLLSCAN" → "IXSCAN" indicating index usage
```

### 4. Verify Unique Constraints
```javascript
// Try inserting duplicate - should fail
db.users_certificates.insertOne({
  user_id: objectId1,
  certificate_id: "cert123",
  ...
})

// Try same certificate_id again - should get duplicate key error
db.users_certificates.insertOne({
  user_id: objectId2,
  certificate_id: "cert123",  // Duplicate
  ...
})
// Error: E11000 duplicate key error
```

---

## Maintenance Commands

### Monitor Index Usage
```javascript
// Check index statistics
db.collection('users_certificates').aggregate([
  { $indexStats: {} }
])
```

### Rebuild Corrupt Indexes
```javascript
// Drop and recreate indexes
db.users_certificates.dropIndexes()
db.users_certificates.createIndexes([
  { key: { user_id: 1 }, name: 'user_id_idx' },
  // ... all other indexes
])
```

### View Query Execution Plan
```javascript
db.documents.find({ owner_id: userId }).explain("executionStats")
```

---

## Integration Notes

### For Next Phase (Task 2.1 - Create Signature Model)

The UserSignature model has been created with proper schema and indexes in this task.

### For Frontend Integration

Developers should know:
- Documents can be in multiple states: draft, pending_signature, partially_signed, fully_signed
- Each signature tracks signer, timestamp, and certificate
- All operations are logged in audit trail for compliance
- Signatures include placement information for visual verification

### For API Development

Controllers can rely on:
- Efficient indexed queries for user's documents
- Quick status-based filtering
- Fast audit trail retrieval
- Unique constraint enforcement on certificates

---

## Data Model Relationships

```
User
├── Certificates
│   └── UserCertificate (1:1)
├── Signatures
│   └── UserSignature (1:many)
├── Documents
│   └── Document (owner_id) (1:many)
└── Document Signatures
    └── DocumentSignature (signer_id) (1:many)

Document
├── Owner (User)
├── Signers (Array)
└── Signatures
    └── DocumentSignature (document_id) (1:many)

DocumentSignature
├── Document
├── Signer (User)
├── Certificate (UserCertificate)
└── Signature (UserSignature)

SignatureAuditLog
├── Signer (User)
├── Related Document
├── Related Certificate
└── Related Signature
```

---

## Next Steps

- Task 2.1: Create Signature Model (UserSignature already created in this task)
- Task 2.2: Implement Signature API Endpoints
- Phase 2: Full Signature Management Implementation

---

## References

- CertificateService: `backend/src/services/certificateService.js`
- Certificate Controller: `backend/src/controllers/certificateController.js`
- Database Init: `backend/src/utils/databaseInit.js`
- DOCUMENT_SIGNER_ROADMAP.md: Database Schema section
