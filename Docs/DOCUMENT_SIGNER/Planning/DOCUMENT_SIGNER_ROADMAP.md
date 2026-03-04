# Document Signer - Implementation Roadmap & Task Breakdown

## Quick Reference: What's Needed

### ✅✅✅ PHASE 1: COMPLETED ✅✅✅
### Phase 1: PKI Foundation

**Status**: All 4 tasks completed successfully!
- Task 1.1: Certificate Generation Service ✅
- Task 1.2: Certificate API Endpoints ✅
- Task 1.3: User Model Update ✅
- Task 1.4: Database Schema & Indexes ✅
- **NEW**: PDF-only Document Support ✅

#### ✅ Task 1.1: Setup Certificate Generation Service --- DONE
**Files to create:**
- `backend/src/services/certificateService.js`

**What it does:**
```javascript
// Generate RSA key pair (2048-bit)
// Create self-signed certificate
// Encrypt private key with AES-256
// Return certificate + public key
```

**Dependencies:**
```javascript
npm install node-rsa node-forge
```

**Database update:**
- Create `users_certificates` collection index

---

#### ✅ Task 1.2: Create Certificate API Endpoints --- DONE
**Files to create:**
- `backend/src/routes/certificateRoutes.js`
- `backend/src/controllers/certificateController.js`
- `backend/src/middleware/certificateValidation.js`

**Endpoints:**
```
POST   /api/certificates/generate
GET    /api/certificates/user/:userId
POST   /api/certificates/revoke
GET    /api/certificates/verify/:certificateId
```

**Logic:**
- Check if user already has certificate
- If not, generate new one
- Store to MongoDB
- Return to frontend

---

#### ✅ Task 1.3: Update User Model --- DONE
**File to modify:**
- `backend/src/models/User.js`

**Add field:**
```javascript
certificate_id: {
  type: ObjectId,
  ref: 'Certificate',
  default: null
}
```

---

#### ✅ Task 1.4: Update Database Schema --- DONE
**Create migrations or create indexes:**
```javascript
db.users_certificates.createIndex({ user_id: 1 }, { unique: false })
db.users_certificates.createIndex({ certificate_id: 1 }, { unique: true })
db.user_signatures.createIndex({ user_id: 1 })
db.documents.createIndex({ owner_id: 1 })
db.documents.createIndex({ status: 1 })
db.document_signatures.createIndex({ document_id: 1 })
db.document_signatures.createIndex({ signer_id: 1 })
db.signature_audit_log.createIndex({ timestamp: -1 })
```

---

### ✅✅✅ PHASE 2: COMPLETED ✅✅✅
### Phase 2: Signature Management (Next in Priority)

#### ✅ Task 2.1: Create Signature Model --- DONE
**File to create:**
- `backend/src/models/UserSignature.js`

**Schema:**
```javascript
{
  user_id: ObjectId,
  signature_image: String (Base64),
  signature_type: String,
  created_at: Date,
  is_default: Boolean
}
```

---

#### ✅ Task 2.2: Create Signature API Endpoints --- DONE
**Files to create:**
- `backend/src/routes/signatureRoutes.js`
- `backend/src/controllers/signatureController.js`

**Endpoints:**
```
POST   /api/signatures/create
GET    /api/signatures/user
PUT    /api/signatures/:signatureId/set-default
DELETE /api/signatures/:signatureId
```

---

#### ✅ Task 2.3: Build Signature Creation UI (Frontend) --- DONE
**Files to create:**
- `frontend/src/pages/Signature/CreateSignaturePage.js`
- `frontend/src/components/Signature/SignaturePad.js`
- `frontend/src/components/Signature/SignatureUploader.js`

**Features:**
- Canvas signature pad (draw signature)
- Upload signature image
- Preview
- Save to database

---

#### ✅ Task 2.4: Update Dashboard --- DONE
**File to modify:**
- `frontend/src/pages/Dashboard/Dashboard.js`

**Add:**
- "Create Signature" button
- Navigation to signature management
- Show current signature status

---

### ✅✅✅ PHASE 3: COMPLETED ✅✅✅
### Phase 3: Document Management

#### ✅ Task 3.1: Create Document Model --- DONE
**File to create:**
- `backend/src/models/Document.js`

**Schema:**
```javascript
{
  owner_id: ObjectId,
  title: String,
  file_url: String,
  file_hash_sha256: String,
  status: String,
  signers: Array,
  created_at: Date,
  updated_at: Date
}
```

---

#### Task 3.2: Create Document Upload Service
**File to create:**
- `backend/src/services/documentService.js`

**Functions:**
```javascript
uploadDocument(file, userId, title)
// - Save file to disk/S3
// - Generate SHA-256 hash
// - Create document in DB
// - Return document_id

generateDocumentHash(filePath)
// - Read file
// - Generate SHA-256
// - Return hash
```

---

#### ✅ Task 3.3: Create Document API Endpoints --- DONE
**Files to create:**
- `backend/src/routes/documentRoutes.js`
- `backend/src/controllers/documentController.js`

**Endpoints:**
```
POST   /api/documents/upload
GET    /api/documents
GET    /api/documents/:documentId
DELETE /api/documents/:documentId
```

---

#### ✅ Task 3.4: Build Document Management UI --- DONE
**Files to create:**
- `frontend/src/pages/Documents/DocumentsPage.js`
- `frontend/src/components/Documents/DocumentUploader.js`
- `frontend/src/components/Documents/DocumentList.js`

**Features:**
- Upload document
- List documents
- View document details
- Delete draft documents

---

### ✅✅✅ PHASE 4: COMPLETED ✅✅✅
### Phase 4: Document Signing

#### ✅ Task 4.1: Create Digital Signature Service --- DONE
**File to create:**
- `backend/src/services/signingService.js`

**Functions:**
```javascript
signDocument(documentId, userId, signatureData)
// 1. Get document hash
// 2. Get user's private key (decrypt)
// 3. Sign hash with private key (RSA)
// 4. Create signature envelope
// 5. Store signature
// 6. Update document status
// 7. Log to audit trail

verifySignature(signatureHash, documentHash, certificateId)
// 1. Get certificate public key
// 2. Verify signature
// 3. Return is_valid boolean
```

**Dependencies:**
```
npm install node-rsa
```

---

#### ✅ Task 4.2: Create Encryption/Decryption Service --- DONE
**File to create:**
- `backend/src/services/encryptionService.js`

**Functions:**
```javascript
encryptPrivateKey(privateKey, masterkeyOrUserId)
// - Encrypt with AES-256
// - Return encrypted string

decryptPrivateKey(encryptedKey, masterkeyOrUserId)
// - Decrypt with AES-256
// - Return original private key
```

**Dependencies:**
```
npm install crypto-js
```

---

#### ✅ Task 4.3: Create Signature API Endpoints --- DONE
**File to modify:**
- `backend/src/routes/documentRoutes.js` (add signing routes)

**Endpoints:**
```
POST   /api/documents/:documentId/sign
GET    /api/documents/:documentId/signatures
POST   /api/documents/:documentId/verify
```

---

#### ✅ Task 4.4: Build Document Signer UI --- DONE
**Files to create:**
- `frontend/src/pages/Signing/DocumentSignerPage.js`
- `frontend/src/components/Signing/DocumentViewer.js`
- `frontend/src/components/Signing/SignaturePlacementTool.js`
- `frontend/src/components/Signing/SignatureSelector.js`

**Features:**
- Display document
- Place signature on document
- Select signature type
- Review before signing
- Sign button with confirmation
- Show success/error

**Dependencies:**
```
npm install react-pdf react-signature-canvas
```

---

### ✅✅✅ PHASE 5: COMPLETED ✅✅✅
### Phase 5: Verification & Audit

#### ✅ Task 5.1: Create Verification Service --- DONE
**File to create:**
- `backend/src/services/verificationService.js`

**Functions:**
```javascript
verifyDocument(documentId)
// - Get all signatures
// - Verify each signature
// - Check certificate validity
// - Return overall validity status

verifySignature(signatureId)
// - Get signature & certificate
// - Verify signature hash
// - Check certificate not expired
// - Check certificate not revoked

generateAuditLog(action, userId, details)
// - Create audit log entry
// - Include timestamp, IP, user agent
// - Store to database
```

---

#### ✅ Task 5.2: Create Audit Trail UI --- DONE
**Files to create:**
- `frontend/src/components/Audit/AuditTrail.js`
- `frontend/src/pages/Audit/AuditPage.js`

**Features:**
- Timeline view of signing events
- Filter by document/user/action
- Download audit report
- Show verification status

---

### ✅✅✅ PHASE 6: COMPLETED ✅✅✅
### Phase 6: Multi-Signer & Advanced Features

#### ✅ Task 6.1: Multi-Signer Support --- DONE
**Modify:**
- `backend/src/models/Document.js` - update signers array
- Add signing workflow orchestration

**Features:**
- Sequential signing requirement
- Parallel signing support
- Signing order enforcement
- Signing deadline

---

#### ✅ Task 6.2: Document Sharing & Signing Requests --- DONE
**Files to create:**
- `backend/src/models/SigningRequest.js`
- `backend/src/routes/signingRequestRoutes.js`

**Features:**
- Share document with others
- Send signing request
- Signing request status tracking
- Expiration dates

---

### DETAILED DEVELOPMENT STEPS: DONE ✅
## Detailed Development Steps

### ✅ DONE ✅ Step 1: Install Required Dependencies

```powershell
# Backend
cd backend
npm install node-rsa node-forge crypto-js multer express-validator pdf-lib pdfkit pdf-parse

# Frontend
cd ../frontend
npm install react-pdf pdfjs-dist react-signature-canvas axios
```

---

### ✅ DONE ✅ Step 2: Create Environment Variables

**backend/.env** (add):
```
MASTER_ENCRYPTION_KEY=your-32-character-random-key-here
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=7d
DOCUMENT_UPLOAD_DIR=./uploads/documents
SIGNATURE_UPLOAD_DIR=./uploads/signatures
MAX_FILE_SIZE=52428800  # 50MB
ALLOWED_FILE_TYPES=pdf
```

---

### ✅ DONE ✅ Step 3: Create File Upload Handling

**backend/src/middleware/fileUpload.js**
```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.DOCUMENT_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random()}.${file.ext}`;
    cb(null, uniqueName);
  }
});

module.exports = multer({ 
  storage,
  limits: { fileSize: process.env.MAX_FILE_SIZE }
});
```

---

### ✅ DONE ✅ Step 4: Update Server.js with New Routes

**backend/src/server.js** (add routes):
```javascript
const certificateRoutes = require('./routes/certificateRoutes');
const documentRoutes = require('./routes/documentRoutes');
const signatureRoutes = require('./routes/signatureRoutes');

app.use('/api/certificates', certificateRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/signatures', signatureRoutes);
```

---

## Testing Plan

### Unit Test Files to Create
- `backend/tests/services/certificateService.test.js`
- `backend/tests/services/signingService.test.js`
- `backend/tests/services/verificationService.test.js`
- `frontend/tests/components/SignaturePad.test.js`
- `frontend/tests/components/DocumentViewer.test.js`

### Integration Test Scenarios
1. User creates certificate
2. User uploads document
3. User signs document
4. User verifies signature
5. Multiple users sign same document

### E2E Test Flow
```
1. Login to dashboard
2. Click "Create Signature"
3. Draw/upload signature
4. Save signature
5. Click "Upload Document"
6. Upload a PDF document
7. Click "Sign Document"
8. Place signature on document
9. Click "Sign"
10. Verify document shows as signed
11. Download signed document
12. Verify audit trail
```

---

## Database Migration Script

**Create**: `backend/src/migrations/create-signing-collections.js`

```javascript
const MongoDB = require('mongodb');

async function createSchemaAndIndexes() {
  // Create users_certificates
  db.createCollection('users_certificates', {
    validator: { ... }
  });
  
  // Create user_signatures
  db.createCollection('user_signatures', {
    validator: { ... }
  });
  
  // Create documents
  db.createCollection('documents', {
    validator: { ... }
  });
  
  // Create document_signatures
  db.createCollection('document_signatures', {
    validator: { ... }
  });
  
  // Create indexes
  db.users_certificates.createIndex({ user_id: 1 });
  db.documents.createIndex({ owner_id: 1 });
  // ... more indexes
  
  console.log('Schema and indexes created successfully');
}
```

---

## Progress Tracking Template

Use this to track implementation progress:

```markdown
### Phase 1: PKI Foundation
- [ ] Task 1.1: Certificate generation service
- [ ] Task 1.2: Certificate API endpoints
- [ ] Task 1.3: Update User model
- [ ] Task 1.4: Database schema setup
- [ ] Testing & debugging
- **Status**: 0/5 tasks complete

### Phase 2: Signature Management
- [ ] Task 2.1: Create Signature model
- [ ] Task 2.2: Signature API endpoints
- [ ] Task 2.3: Signature creation UI
- [ ] Task 2.4: Dashboard update
- [ ] Testing & debugging
- **Status**: 0/5 tasks complete
```

---

## Security Checklist

Before moving to production:
- [ ] Private keys encrypted with strong key
- [ ] No hardcoded secrets in code
- [ ] HTTPS/TLS enabled
- [ ] Input validation on all endpoints
- [ ] Rate limiting on sensitive endpoints
- [ ] CORS properly configured
- [ ] CSRF protection enabled
- [ ] SQL injection prevention (using Mongoose)
- [ ] XSS prevention (React escaping + DOMPurify)
- [ ] File upload scanning (virus scan optional)
- [ ] Audit logging enabled
- [ ] Regular security updates
- [ ] Penetration testing completed

---

## Next Immediate Actions

**When Ready to Start Implementation:**

1. Review this blueprint with the user
2. Confirm all requirements understood
3. Create feature branch: `git checkout -b feature/document-signer`
4. Install dependencies
5. Create certificate service
6. Create database models
7. Create API endpoints
8. Build UI components
9. Test end-to-end
10. Submit PR for review

---

**Created**: February 23, 2026
**Status**: Ready for Development
