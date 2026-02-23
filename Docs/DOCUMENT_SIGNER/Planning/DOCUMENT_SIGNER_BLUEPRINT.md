# Document Signer Implementation Blueprint

## Project Overview
Implementation of a complete document signing system with PKI support, ensuring secure digital signatures, signature ownership, and compliance with document signing standards.

**Document Format**: PDF Only - The system exclusively supports PDF documents for signing and verification.

---

## Key Components

### Backend Services
- **CertificateService**: RSA key pair generation, certificate creation, encryption/decryption
- **PDFService**: PDF validation, hashing, signature embedding, dimension tracking (NEW)
- **SigningService**: Document signing with RSA, signature verification
- **EncryptionService**: AES-256 encryption/decryption for private keys

### Frontend Components
- **PDF Viewer**: React-PDF for displaying PDF documents
- **Signature Pad**: Canvas-based signature drawing
- **Signature Uploader**: Upload pre-drawn or typed signatures
- **Document Signer**: Place signatures on specific PDF pages

---

## 1. ARCHITECTURE & FLOW

### 1.1 User Journey Flow
```
Dashboard
    ↓
    ├── View Documents (List of documents to sign)
    ├── Upload Document (PDF only)
    ├── Create Signature (or use existing)
    │   ├── Signature Pad (Draw signature)
    │   ├── Upload Signature Image
    │   └── Generate Digital Certificate (PKI)
    │
    ↓
Signature Management
    ├── Store User Signature
    ├── Generate/Store Public Key Certificate
    └── Store Private Key (encrypted, server-side)
    ↓
Document Signing Page
    ├── Display Document
    ├── Signature Placement Tool
    ├── Review & Confirm
    └── Sign (Apply Signature + PKI)
    ↓
Post-Signing
    ├── Generate Signature Metadata
    ├── Create Signature Hash
    ├── Sign with Private Key
    ├── Store Signed Document
    └── Send Confirmation Email
```

---

## 2. PKI (PUBLIC KEY INFRASTRUCTURE) IMPLEMENTATION

### 2.1 Certificate Generation Flow
```
User Registration/Signature Creation
    ↓
Generate Key Pair (RSA 2048-bit)
    ├── Private Key (stored encrypted on server)
    └── Public Key (used for verification)
    ↓
Create Self-Signed Certificate
    ├── Subject: User Name, Email
    ├── Validity: e.g., 1-5 years
    ├── Algorithm: SHA-256 with RSA
    └── Serial Number: Unique
    ↓
Store Certificate Data
    ├── Public Certificate (PEM format)
    ├── Encrypted Private Key (Server-side encrypted with Master Key)
    └── Certificate Metadata
```

### 2.2 Digital Signing Process
```
Document Ready to Sign
    ↓
Generate Document Hash (SHA-256)
    ↓
Retrieve User's Private Key (decrypted temporarily)
    ↓
Sign Hash with Private Key (RSA-PSS)
    ↓
Generate Signature (Binary/Base64)
    ↓
Create Signature Envelope
    {
        "document_id": "...",
        "signer_id": "...",
        "signature_image": "...",
        "signature_hash": "...",
        "certificate": "...",
        "timestamp": "ISO-8601",
        "coordinates": { "x": 100, "y": 200 },
        "page": 1
    }
    ↓
Verify Signature (Optional - verify what was signed)
    ↓
Store Signed Document
```

### 2.3 Verification Process
```
Signed Document Received
    ↓
Extract Signature Envelope
    ↓
Get Document Hash (reproduce from original)
    ↓
Verify Signature with Public Certificate
    {
        Public Key (from certificate)
        Signed Hash
        Document Hash
        → Valid? ✓/✗
    }
    ↓
Check Certificate Validity
    ├── Not Expired?
    ├── Not Revoked?
    └── Signed by Trusted Authority?
    ↓
Confirm Document Authenticity
```

---

## 3. DATABASE SCHEMA

### 3.1 New Collections/Tables

#### users_certificates (New)
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User),
  certificate_id: String (unique),
  public_key: String (PEM format),
  private_key_encrypted: String (AES-256 encrypted),
  certificate_pem: String (Self-signed certificate),
  issuer: "SigniStruct",
  subject: "User Name <email@example.com>",
  serial_number: String,
  not_before: Date,
  not_after: Date,
  fingerprint_sha256: String,
  status: "active" | "revoked" | "expired",
  created_at: Date,
  revoked_at: Date (optional),
  revocation_reason: String (optional)
}
```

#### user_signatures (New)
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User),
  signature_image: String (Base64/URL),
  signature_type: "handwritten" | "uploaded" | "printed",
  created_at: Date,
  is_default: Boolean
}
```

#### documents (New/Extend if exists)
```javascript
{
  _id: ObjectId,
  owner_id: ObjectId (ref: User),
  title: String,
  file_url: String (uploaded file path),
  file_hash_sha256: String,
  status: "draft" | "pending_signature" | "signed" | "rejected",
  created_at: Date,
  updated_at: Date,
  
  // For documents requiring multiple signatures
  signers: [
    {
      signer_id: ObjectId (ref: User),
      status: "pending" | "signed" | "declined",
      signed_at: Date (optional),
      order: Number
    }
  ]
}
```

#### document_signatures (New)
```javascript
{
  _id: ObjectId,
  document_id: ObjectId (ref: Document),
  signer_id: ObjectId (ref: User),
  signature_image: String (Base64),
  signature_hash: String (RSA signature),
  certificate_id: String,
  certificate_fingerprint: String,
  position: {
    page: Number,
    x: Number,
    y: Number,
    width: Number,
    height: Number
  },
  timestamp: Date (ISO-8601 with timezone),
  ip_address: String,
  user_agent: String,
  
  // Verification fields
  is_valid: Boolean,
  verified_at: Date,
  verification_method: String,
  
  metadata: {
    browser: String,
    device: String,
    location: String (optional, if geolocation enabled)
  }
}
```

#### signature_audit_log (New)
```javascript
{
  _id: ObjectId,
  action: "signature_generated" | "document_signed" | "signature_verified" | "certificate_revoked",
  signer_id: ObjectId,
  document_id: ObjectId,
  details: Object,
  timestamp: Date,
  ip_address: String
}
```

---

## 4. BACKEND API ENDPOINTS

### 4.1 Certificate Management
```
POST   /api/certificates/generate
       Generate PKI certificate for user
       Body: { user_id }
       Response: { certificate_id, public_key, message }

GET    /api/certificates/user/:userId
       Get user's certificate
       Response: { certificate (without private key), status }

POST   /api/certificates/revoke
       Revoke a certificate
       Body: { certificate_id, reason }
       Response: { message, revoked_at }

GET    /api/certificates/verify/:certificateId
       Verify certificate validity
       Response: { is_valid, not_expired, not_revoked, fingerprint }
```

### 4.2 Signature Management
```
POST   /api/signatures/create
       Create/upload user signature
       Body: { signature_image (base64), type }
       Response: { signature_id }

GET    /api/signatures/user
       Get user's signatures
       Response: [{ signature_id, type, is_default, created_at }]

PUT    /api/signatures/:signatureId/set-default
       Set default signature
       Response: { message }
```

### 4.3 Document Management
```
POST   /api/documents/upload
       Upload document
       Body: { file, title }
       Response: { document_id, file_hash }

GET    /api/documents
       List user's documents
       Response: [{ document_id, title, status, created_at }]

GET    /api/documents/:documentId
       Get document details
       Response: { document, signers, signatures }

DELETE /api/documents/:documentId
       Delete document (draft only)
```

### 4.4 Document Signing
```
POST   /api/documents/:documentId/sign
       Sign document
       Body: {
         signature_id,
         signature_image,
         position: { page, x, y, width, height },
         certificate_id
       }
       Response: { signature_id, document_id, signed_at }

GET    /api/documents/:documentId/signatures
       Get all signatures on document
       Response: [{ signature object with verification status }]

POST   /api/documents/:documentId/verify
       Verify document signatures
       Response: {
         is_valid: boolean,
         signatures: [
           { signer_id, is_valid, verified_at, certificate_valid }
         ]
       }
```

### 4.5 Signature Verification
```
POST   /api/verify/signature
       Verify a specific signature
       Body: {
         signature_hash,
         document_hash,
         certificate_id
       }
       Response: { is_valid, verified_at, details }

POST   /api/verify/document
       Verify entire document
       Body: { document_id }
       Response: {
         is_valid,
         all_signatures_valid: boolean,
         signatures: [verification results]
       }
```

### 4.6 Audit & Compliance
```
GET    /api/audit-log
       Get signature audit log
       Query: { document_id, signer_id, action, date_from, date_to }
       Response: [audit entries]

GET    /api/documents/:documentId/audit
       Get document-specific audit trail
       Response: [all actions on this document]
```

---

## 5. FRONTEND COMPONENTS & PAGES

### 5.1 New Pages
1. **SignatureCreationPage** (`/create-signature`)
   - Signature Pad (draw signature)
   - Upload Signature Image
   - Preview
   - Generate Certificate

2. **DocumentSignerPage** (`/documents/:id/sign`)
   - PDF/Document Viewer
   - Signature Placement Tool
   - Signature Selector
   - Position Preview
   - Sign & Submit
   - Verification Display

3. **SignedDocumentsPage** (`/documents/signed`)
   - List of signed documents
   - Verification status badges
   - Download/Share options
   - Audit trail viewer

4. **DocumentManagementPage** (`/documents`)
   - Upload documents
   - View document status
   - Initiate signing workflow
   - View/manage signers

### 5.2 New Components
1. **SignaturePad** Component
   - Canvas-based drawing
   - Clear/undo
   - Adjust thickness/color
   - Save as image

2. **DocumentViewer** Component
   - Display PDF/images
   - Navigation (page by page)
   - Zoom controls
   - Signature layer overlay

3. **SignaturePlacementTool** Component
   - Click-to-place signature
   - Drag to reposition
   - Resize signature
   - Page selection

4. **CertificateDisplay** Component
   - Show certificate details
   - Validity status
   - Download certificate
   - Verification info

5. **AuditTrail** Component
   - Timeline of signing events
   - Who signed, when, from where
   - Verification results
   - Download audit report

---

## 6. SECURITY IMPLEMENTATION

### 6.1 Key Management
```
Master Encryption Key (MEK)
    ├── Stored in: Environment variable / Vault
    ├── Rotation: Every 90 days
    └── Backup: Secure backup procedure

User Private Keys (Encrypted)
    ├── Algorithm: AES-256-CBC
    ├── Key: Derived from MEK + user_id
    ├── Storage: Database (encrypted)
    └── Access: Decrypted only when needed for signing
```

### 6.2 Signature Process Security
- **Document Hash**: SHA-256 (reproducible)
- **Signature Algorithm**: RSA-PSS with SHA-256
- **Key Size**: 2048-bit (minimum, 4096-bit recommended)
- **Timestamp**: Secure timestamp (NTP)
- **Nonce**: Include in signature to prevent replay attacks

### 6.3 Transport Security
- HTTPS/TLS 1.3 only
- Certificate pinning (optional)
- HSTS headers enabled
- CORS properly configured

### 6.4 Data Protection
- PII encryption at rest
- Document encryption (optional)
- Audit logging (immutable)
- Access control (role-based)

---

## 7. IMPLEMENTATION PHASES

### Phase 1: PKI Foundation (Week 1-2)
- [ ] Certificate generation service
- [ ] Key storage/encryption
- [ ] Certificate model & API
- [ ] Basic certificate display

### Phase 2: Signature Management (Week 2-3)
- [ ] Signature creation (pad + upload)
- [ ] User signature storage
- [ ] Signature selection UI
- [ ] Default signature management

### Phase 3: Document Signing Flow (Week 3-4)
- [ ] Document upload
- [ ] Document viewer
- [ ] Signature placement tool
- [ ] Sign document endpoint
- [ ] Signature storage

### Phase 4: Verification & Audit (Week 4-5)
- [ ] Signature verification logic
- [ ] Certificate validation
- [ ] Audit logging
- [ ] Audit trail display

### Phase 5: Multi-Signer & Features (Week 5-6)
- [ ] Multi-signer workflows
- [ ] Document sharing
- [ ] Signing requests
- [ ] Notifications

### Phase 6: Polish & Deployment (Week 6-7)
- [ ] Testing & QA
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

---

## 8. TECHNOLOGY STACK

### Backend
- **Crypto**: `node-rsa`, `crypto` (Node.js built-in)
- **PDF**: `pdf-lib` (manipulation), `pdfkit` (generation), `pdf-parse` (reading)
- **Certificates**: `node-forge` or `pkijs`
- **Encryption**: `crypto-js` / `tweetnacl.js`
- **Timestamps**: NTP client library
- **AWS/Cloud**: S3 for document storage (optional)

### Frontend
- **UI**: React components (existing)
- **PDF Viewer**: `react-pdf` or `pdfjs-dist`
- **Canvas**: `react-signature-canvas`
- **State**: Context API / Redux (for signature state)
- **Crypto**: `TweetNaCl.js` (optional, for client-side verification)

### Database
- MongoDB (existing)

---

## 9. COMPLIANCE & STANDARDS

### Standards to Follow
- **eIDAS** (EU Electronic Identification & Trust Services)
- **ESIGN Act** (USA)
- **UETA** (Uniform Electronic Transactions Act)
- **ISO/IEC 27001** (Information Security)

### Features for Compliance
- ✅ Unique identification (public key + certificate)
- ✅ Timestamping (NTP)
- ✅ Audit trail (immutable)
- ✅ Certificate validity checking
- ✅ Signature integrity verification
- ✅ Signer authentication

---

## 10. TESTING STRATEGY

### Unit Tests
- Certificate generation
- Key encryption/decryption
- Hash generation
- Signature verification

### Integration Tests
- Full signing workflow
- Multi-signer scenario
- Certificate revocation
- Audit logging

### Security Tests
- Private key exposure
- Signature tampering detection
- Certificate forgery attempts
- Replay attack prevention

### E2E Tests
- Dashboard → Document → Sign → Verify flow
- Download signed document
- Audit trail accuracy

---

## 11. OPTIONAL ENHANCEMENTS

### Future Features
1. **Timestamp Authority (TSA)**
   - Integrate external TSA
   - Legal timestamp on signatures

2. **Blockchain Integration**
   - Immutable signature storage
   - Timestamp verification on blockchain

3. **Biometric Signature**
   - Fingerprint recognition
   - Face recognition verification

4. **Mobile Support**
   - Mobile signature pad
   - App-based signing

5. **API for Third-Parties**
   - REST API for external apps
   - Webhook notifications

6. **Advanced Workflows**
   - Conditional signing (sign if condition met)
   - Parallel vs. sequential signatures
   - Signature delegations

---

## 12. DEPLOYMENT CHECKLIST

- [ ] Environment variables configured (Master Key, JWT secrets, etc.)
- [ ] Database backups configured
- [ ] HTTPS/TLS certificates valid
- [ ] Audit logging enabled
- [ ] Rate limiting on signing endpoints
- [ ] CORS properly configured
- [ ] File upload size limits set
- [ ] Document retention policies defined
- [ ] Key rotation procedures documented
- [ ] Disaster recovery plan in place

---

## 13. RISKS & MITIGATION

| Risk | Mitigation |
|------|-----------|
| Private key compromise | Regular rotation, HSM for high-security, encryption at rest |
| Signature forgery | Strong crypto (RSA-2048+), timestamp, audit trail |
| Certificate expiration | Renewal notifications, auto-renewal logic |
| Storage failure | Regular backups, redundancy, database replication |
| Performance (large documents) | Stream processing, chunked uploads, CDN for downloads |
| Legal issues | Compliance with regulations, clear T&C, audit evidence |

---

## 14. SUCCESS METRICS

- ✓ Zero unauthorized signature modifications
- ✓ 99.9% signing success rate
- ✓ < 5s signature generation time
- ✓ < 100ms signature verification time
- ✓ Complete audit trail for all operations
- ✓ Legal admissibility in court (with proper implementation)
- ✓ User adoption rate > 80%

---

**Document Created**: February 23, 2026
**Status**: Ready for Implementation
**Next Step**: Phase 1 - PKI Foundation
