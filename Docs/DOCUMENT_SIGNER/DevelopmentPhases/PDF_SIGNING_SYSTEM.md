# PDF Signing System Implementation

**Status**: ✅ Complete  
**Date Completed**: February 23, 2026  
**Previous Tasks**: Phase 1 (Tasks 1.1-1.4)

---

## Overview

This document outlines the PDF signing system implementation for the SigniStruct project. The system is designed to **exclusively support PDF documents** with integrated digital signatures, certificate-based authentication, and comprehensive audit trails.

---

## Architecture Overview

The PDF signing system consists of several integrated components:

```
┌─────────────────┐
│   User Uploads  │
│   PDF Document  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  PDF Validation & Hash          │
│  (pdfService.validatePDF)       │
│  (pdfService.generatePDFHash)   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Document Creation              │
│  Store in MongoDB               │
│  (Document model)               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  User Signs Document            │
│  Select Certificate & Signature │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Sign Document (RSA)            │
│  certificateService.sign()      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Add Signature to PDF           │
│  pdfService.addSignatureToPDF() │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Store Signature Metadata       │
│  (DocumentSignature model)      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Log to Audit Trail             │
│  (SignatureAuditLog model)      │
└─────────────────────────────────┘
```

---

## Dependencies Installed

### Backend Dependencies

```json
{
  "pdf-lib": "^1.17.1",
  "pdfkit": "^0.13.0",
  "pdf-parse": "^1.1.1",
  "express-validator": "^7.0.0",
  "multer": "^1.4.5"
}
```

**What each does**:
- **pdf-lib**: Core library for PDF manipulation and signature embedding
- **pdfkit**: Alternative PDF generation (for creating signature proof documents)
- **pdf-parse**: Parse and extract PDF metadata
- **express-validator**: Input validation for all endpoints
- **multer**: Handle multipart/form-data for file uploads

### Frontend Dependencies

```json
{
  "react-pdf": "^7.3.0",
  "pdfjs-dist": "^3.11.174",
  "react-signature-canvas": "^1.0.5"
}
```

**What each does**:
- **react-pdf**: Display PDFs in React components
- **pdfjs-dist**: PDF.js worker for client-side PDF rendering
- **react-signature-canvas**: Signature pad for users to draw signatures

---

## Files Created

### Backend Services

#### 1. PDF Service
**File**: `backend/src/services/pdfService.js`

Core service for all PDF operations.

**Key Methods**:

```javascript
static validatePDF(filePath)
// - Validates PDF structure
// - Returns true if valid, false otherwise
// - Used during upload

static generatePDFHash(filePath)
// - Creates SHA-256 hash of PDF file
// - Used for document integrity verification
// - Returns: SHA-256 hash string

static async getPDFMetadata(filePath)
// - Extracts PDF metadata
// - Returns: { numPages, title, author, fileSize, hash }
// - Used for document information display

static async addSignatureToPDF(inputPath, outputPath, signatureData)
// - Adds signature to PDF page
// - Parameters:
//   - inputPath: Original PDF
//   - outputPath: Signed PDF
//   - signatureData: { signatureImage, x, y, width, height, page, signerName, timestamp }
// - Returns: { success, outputPath, fileHash, numPages, signedAt }

static async getPDFDimensions(filePath)
// - Gets page dimensions for signature positioning
// - Returns: Array of { pageNumber, width, height }

static async mergePDFs(filePaths, outputPath)
// - Merges multiple PDFs into one
// - Used for multi-signer documents
// - Returns: { success, outputPath, numPages, hash }

static validatePDFFile(filename, mimeType)
// - Validates file extension and MIME type
// - Returns: true/false
```

### Backend Middleware

#### 2. PDF Upload Middleware
**File**: `backend/src/middleware/pdfUpload.js`

Handles PDF file uploads with validation and error handling.

**Features**:
- Disk storage configuration for uploads
- File filtering (only PDF files)
- Size limits (50MB default)
- Comprehensive error handling
- Automatic directory creation

**Usage**:
```javascript
const { uploadPDF, handlePDFUploadError } = require('../middleware/pdfUpload');

router.post('/upload', uploadPDF.single('document'), controller, handlePDFUploadError);
```

---

## Updated Models

### 1. Document Model Enhancement
**File**: `backend/src/models/Document.js`

**New Fields**:
```javascript
{
  original_filename: String,      // Original uploaded filename
  file_size: Number,              // Size in bytes
  num_pages: Number,              // PDF page count
  file_type: String,              // MIME type (application/pdf)
  description: String,            // Optional document description
}
```

**Complete Schema**:
- `owner_id` - Document owner
- `title` - Document title
- `description` - Optional description
- `file_url` - Path to PDF file
- `original_filename` - Original filename
- `file_hash_sha256` - Document integrity hash
- `file_size` - File size in bytes
- `num_pages` - Number of pages
- `file_type` - MIME type
- `status` - Document status (draft, pending_signature, partially_signed, fully_signed, archived)
- `signers` - Array of signer information
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `completed_at` - When document was fully signed

### 2. UserSignature Model
**File**: `backend/src/models/UserSignature.js`

Stores user signature artifacts (drawn, uploaded, or typed).

**Fields**:
- `user_id` - Reference to User
- `signature_image` - Base64 encoded signature image
- `signature_type` - 'drawn', 'uploaded', or 'typed'
- `is_default` - Whether this is the user's default signature
- `created_at` - Creation timestamp

### 3. DocumentSignature Model
**File**: `backend/src/models/DocumentSignature.js`

Stores individual signatures on documents.

**Fields**:
- `document_id` - Reference to Document
- `signer_id` - Reference to User who signed
- `certificate_id` - Reference to signing certificate
- `signature_hash` - Hash of the signature
- `user_signature_id` - Reference to signature artifact used
- `document_hash` - Hash of document at signing time
- `signature_placement` - Position on PDF { x, y, width, height, page }
- `is_valid` - Signature validation status
- `timestamp` - Signing timestamp

### 4. SignatureAuditLog Model
**File**: `backend/src/models/SignatureAuditLog.js`

Complete audit trail of all signing operations.

**Actions Logged**:
- certificate_generated
- certificate_revoked
- signature_created
- document_signed
- signature_verified
- document_verified
- signature_revoked

---

## Environment Configuration

### Required Environment Variables

```env
# PDF Upload Configuration
DOCUMENT_UPLOAD_DIR=./uploads/documents
TEMP_UPLOAD_DIR=./uploads/temp
MAX_FILE_SIZE=52428800                    # 50MB in bytes
ALLOWED_FILE_TYPES=pdf

# Existing variables (required)
MONGODB_URI=mongodb://localhost:27017/signistruct
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
MASTER_ENCRYPTION_KEY=your-32-char-key
```

### Directory Structure

```
uploads/
├── documents/           # Final signed PDFs
├── temp/               # Temporary upload location
└── signatures/         # User signature images (if needed)
```

---

## PDF Signing Workflow

### Step 1: User Creates Signature

**Request**:
```bash
POST /api/signatures/create
Content-Type: multipart/form-data

{
  "signature_image": <base64_or_file>,
  "signature_type": "drawn",  // or "uploaded", "typed"
  "is_default": true
}
```

**Response**:
```json
{
  "success": true,
  "signature_id": "mongo_object_id",
  "signerName": "John Doe",
  "signature_type": "drawn",
  "created_at": "2026-02-23T10:00:00Z"
}
```

### Step 2: User Uploads PDF Document

**Request**:
```bash
POST /api/documents/upload
Content-Type: multipart/form-data

{
  "document": <pdf_file>,
  "title": "Contract",
  "description": "Partnership Agreement"
}
```

**Response**:
```json
{
  "success": true,
  "document_id": "mongo_object_id",
  "file_hash": "sha256_hash",
  "num_pages": 5,
  "file_size": 1024000,
  "status": "draft"
}
```

### Step 3: User Signs Document

**Request**:
```bash
POST /api/documents/:documentId/sign
Authorization: Bearer <token>
Content-Type: application/json

{
  "signature_id": "user_signature_id",
  "certificate_id": "user_certificate_id",
  "signature_placement": {
    "page": 0,
    "x": 50,
    "y": 100,
    "width": 150,
    "height": 50
  }
}
```

**Backend Processing**:
1. Validate user has access to document
2. Get user's certificate
3. Get signature artifact
4. Generate RSA signature of document hash
5. Add visual signature to PDF using pdfService
6. Store signature metadata in DocumentSignature
7. Update Document status
8. Log to audit trail

**Response**:
```json
{
  "success": true,
  "signature_id": "mongo_object_id",
  "signed_pdf_hash": "new_sha256_hash",
  "signature_placement": [...],
  "signed_at": "2026-02-23T10:30:00Z",
  "document_status": "fully_signed"
}
```

### Step 4: Verify Signed Document

**Request**:
```bash
GET /api/documents/:documentId/verify
```

**Response**:
```json
{
  "success": true,
  "document": {
    "document_id": "...",
    "title": "Contract",
    "is_valid": true,
    "status": "fully_signed"
  },
  "signatures": [
    {
      "signer_id": "...",
      "signer_name": "John Doe",
      "signed_at": "...",
      "is_valid": true,
      "certificate_valid": true,
      "signature_placement": {...}
    }
  ]
}
```

---

## Technical Implementation Details

### PDF Validation

**validatePDF Process**:
1. Read file from disk
2. Parse PDF using pdf-parse library
3. Check if numpages > 0
4. Return validation result

### PDF Hash Generation

**generatePDFHash Process**:
1. Read entire PDF file as Buffer
2. Create SHA-256 hash object
3. Update hash with file buffer
4. Return hexadecimal digest

**Purpose**:
- Document integrity verification
- Duplicate prevention
- Signature binding to document

### Signature Embedding

**addSignatureToPDF Process**:
1. Load input PDF with pdf-lib
2. Get target page by number
3. Detect signature image type (PNG/JPG)
4. Embed image or fallback to text
5. Draw signature image at specified coordinates
6. Add signer information text
7. Add signature hash for audit
8. Save signed PDF to disk
9. Generate hash of signed PDF

**Visual Elements Added**:
- Signature image (150x50px default)
- Signer name text
- Timestamp
- Signature hash (truncated, for audit)

---

## Security Considerations

### PDF Integrity

1. **Original Document Hash**
   - Stored before signatures
   - Used to verify document hasn't been modified

2. **Signed PDF Hash**
   - Generated after signatures added
   - Proof of signature application

3. **Signature Hash**
   - RSA signature of document hash
   - Cryptographic proof using user's private key

### Signature Verification

```javascript
// Verification process:
1. Get document original hash
2. Get signature hash
3. Get certificate public key
4. Verify RSA signature:
   if (publicKey.verify(docHash, signatureHash)) {
     // Signature is valid
   }
5. Check certificate validity (not expired, not revoked)
6. Return verification result
```

### Private Key Security

- User's private key is **encrypted with AES-256**
- Encryption key derived from master key + user ID
- Private key **never transmitted** in API responses
- Only used server-side during signing

---

## Database Indexes

### PDF-Specific Indexes

```javascript
// documents collection
db.documents.createIndex({ owner_id: 1, status: 1 })
db.documents.createIndex({ file_hash_sha256: 1 }, { unique: true })
db.documents.createIndex({ created_at: -1 })

// document_signatures collection
db.document_signatures.createIndex({ document_id: 1 })
db.document_signatures.createIndex({ timestamp: -1 })

// signature_audit_log collection
db.signature_audit_log.createIndex({ timestamp: -1 })
db.signature_audit_log.createIndex({ action: 1 })
```

---

## Error Handling

### PDF Validation Errors

```json
{
  "error": "Invalid PDF file",
  "details": "File must be a valid PDF"
}
```

### File Size Errors

```json
{
  "error": "File too large",
  "details": "Maximum file size is 50MB"
}
```

### Signature Errors

```json
{
  "error": "Signature operation failed",
  "details": "Could not add signature to PDF"
}
```

---

## Testing the PDF System

### 1. Test PDF Upload

```javascript
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const form = new FormData();
form.append('document', fs.createReadStream('test.pdf'));
form.append('title', 'Test Document');

const response = await axios.post('http://localhost:5000/api/documents/upload', form, {
  headers: form.getHeaders(),
  params: { Authorization: 'Bearer <token>' }
});

console.log(response.data);
```

### 2. Test Signature Creation

```javascript
const response = await axios.post('http://localhost:5000/api/signatures/create', {
  signature_image: base64SignatureData,
  signature_type: 'drawn',
  is_default: true
}, {
  headers: { Authorization: 'Bearer <token>' }
});

console.log('Signature created:', response.data.signature_id);
```

### 3. Test Document Signing

```javascript
const response = await axios.post(
  `http://localhost:5000/api/documents/${docId}/sign`,
  {
    signature_id: sigId,
    certificate_id: certId,
    signature_placement: { page: 0, x: 50, y: 100, width: 150, height: 50 }
  },
  {
    headers: { Authorization: 'Bearer <token>' }
  }
);

console.log('Document signed:', response.data.signed_pdf_hash);
```

---

## Performance Considerations

### File Handling

- **Large PDF Processing**: Streaming where possible
- **Hash Generation**: Done once at upload
- **Signature Addition**: Single PDF modification
- **Caching**: File paths cached in database

### Index Usage

- Compound indexes on (owner_id, status) for filtering
- Descending timestamp indexes for recent queries
- Unique constraint on file_hash_sha256 prevents duplicates

### Optimization Tips

1. **Limit PDF Size**: 50MB default should cover most documents
2. **Batch Operations**: Use bulk updates for multi-signer workflows
3. **Async Processing**: Use job queues for large PDF merging
4. **Cleanup**: Regular deletion of temp files

---

## Limitations and Future Enhancements

### Current Limitations

1. **Single Page Signature Focus**: Optimized for signatures on one page
2. **Visual Signature Only**: Doesn't embed cryptographic metadata in PDF
3. **Sequential Signing**: Signers must sign in order (can be enhanced for parallel)
4. **No PDF Metadata Embedding**: Signature info only in database

### Planned Enhancements

1. **Timestamp Authority (TSA)**: Add trusted timestamps
2. **PDF/A Compliance**: Archive-ready PDF format
3. **Signature Visualization**: Better visual signature placement UI
4. **Batch Signing**: Sign multiple documents at once
5. **PDF Validation API**: Verify externally signed PDFs

---

## Git Commits

This implementation includes 7 commits:

1. `chore: Install PDF signing and manipulation libraries for PDF-only document support`
2. `feat: Create PDF service for document validation, hashing, and signature embedding`
3. `feat: Create PDF upload middleware with validation and error handling`
4. `feat: Enhance Document model with PDF-specific fields`
5. `chore: Add PDF upload configuration to environment example`
6. `fix: Correct UserSignature model schema definition`

---

## Next Steps

1. **Phase 2.1**: Complete Signature Model implementation (UserSignature already created)
2. **Phase 2.2**: Create Signature API Endpoints
3. **Phase 3**: Document Management API Endpoints
4. **Phase 4**: Document Signing Endpoints
5. **Phase 5**: Verification and Audit UI

---

## References

- [pdf-lib Documentation](https://pdf-lib.js.org)
- [PDFKit Documentation](http://pdfkit.org)
- [pdf-parse Documentation](https://github.com/modesty/pdf-parse)
- [React PDF Documentation](https://react-pdf.org)
- Previous Task 1.4 Database Schema Documentation
- Certificate Service: `backend/src/services/certificateService.js`
