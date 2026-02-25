# Phase 3 Task 3.2: Document Upload Service Implementation

**Date Completed**: February 25, 2026  
**Status**: ✅ COMPLETED

## Overview

Task 3.2 involved creating the Document Upload Service that handles the entire document upload workflow. This service manages file validation, SHA-256 hash generation for integrity verification, duplicate detection, and database persistence. It serves as the backend logic for document management operations.

## Implementation Details

### File Created
- `backend/src/services/documentService.js`

### Service Architecture

The documentService module exports seven core functions that handle all document-related operations:

```javascript
module.exports = {
  uploadDocument(),          // Main upload handler
  generateDocumentHash(),    // File hashing utility
  getDocumentById(),         // Retrieve single document
  getUserDocuments(),        // Retrieve user's documents
  deleteDocument(),          // Delete document and file
  updateDocumentStatus(),    // Update document workflow status
  addSignerToDocument()      // Add signers to document
};
```

## Function Specifications

### 1. `generateDocumentHash(filePath)`

**Purpose**: Generate SHA-256 hash of a file for integrity verification

**Parameters**:
- `filePath` (string): Full path to the file to hash

**Returns**: Promise<string> - SHA-256 hash in hexadecimal format

**Implementation Details**:
- Uses Node.js built-in `crypto` module with SHA-256 algorithm
- Streams file content to handle large files efficiently (memory-safe)
- Returns hash as hex string
- Throws error if file cannot be read

**Error Handling**:
```javascript
// Thrown if file read fails
Error: "Error reading file for hashing: [specific error]"
```

**Usage Example**:
```javascript
const hash = await generateDocumentHash('./uploads/documents/doc.pdf');
// Returns: "3f2a5c8b1d4e9f2a7c6b1e3d5f8a2c4e6b8d0f2a4c6e8f0a2b4d6e8f0a2b4d"
```

---

### 2. `uploadDocument(file, userId, title, description)`

**Purpose**: Complete document upload workflow - save file, generate hash, verify uniqueness, and create database record

**Parameters**:
- `file` (Object): Multer file object with properties:
  - `path`: Full file path on disk
  - `originalname`: Original filename from upload
  - `mimetype`: MIME type of file
  - `size`: File size in bytes
- `userId` (string): MongoDB ObjectId of document owner
- `title` (string): Document title (required, trimmed)
- `description` (string, optional): Document description

**Returns**: Promise<Object> with structure:
```javascript
{
  _id: ObjectId,                    // Document ID
  title: string,                    // Document title
  description: string | null,       // Document description
  file_hash_sha256: string,        // SHA-256 hash
  status: "draft",                 // Initial status
  created_at: ISODate,             // Creation timestamp
  message: string                  // "Document uploaded successfully"
}
```

**Implementation Workflow**:
1. **Validation**: Checks file, userId, and title are provided
2. **Hashing**: Generates SHA-256 hash of uploaded file
3. **Duplicate Detection**: Checks if document with same hash exists
4. **File Cleanup**: Deletes uploaded file if duplicate found
5. **File Metadata**: Extracts size, extension, and MIME type
6. **Database Creation**: Creates Document record in MongoDB
7. **Return Summary**: Returns created document info

**Input Validation**:
```javascript
if (!file) throw Error("No file provided")
if (!userId) throw Error("User ID is required")
if (!title) throw Error("Document title is required")
```

**Duplicate Detection**:
- Queries database for existing document with same `file_hash_sha256`
- If found: deletes uploaded file and throws error
- Prevents storing duplicate content

**Database Fields Set**:
- `owner_id`: User ID
- `title`: Trimmed title
- `description`: Trimmed description or null
- `file_url`: Path to stored file
- `original_filename`: Original filename from upload
- `file_hash_sha256`: SHA-256 hash
- `file_size`: File size in bytes
- `file_type`: MIME type
- `status`: Set to "draft"
- `signers`: Empty array
- `created_at` / `updated_at`: Current timestamp

**Error Handling**:
- Input validation errors
- File hashing errors
- Duplicate document error
- Database save errors
- File cleanup on failure

**Automatic Cleanup**:
- If document creation fails, uploaded file is automatically deleted from disk

---

### 3. `getDocumentById(documentId)`

**Purpose**: Retrieve a specific document by ID

**Parameters**:
- `documentId` (string): MongoDB document ID

**Returns**: Promise<Object> - Full document object

**Error Handling**:
```javascript
throw Error("Document not found")
throw Error("Failed to retrieve document: [error]")
```

---

### 4. `getUserDocuments(userId, options)`

**Purpose**: Retrieve all documents for a user with pagination and filtering

**Parameters**:
- `userId` (string): User ID
- `options` (Object, optional):
  - `limit` (number): Documents per page (default: 10)
  - `skip` (number): Number of documents to skip (default: 0)
  - `status` (string, optional): Filter by status

**Returns**: Promise<Array> - Array of document objects sorted by creation date (newest first)

**Query Optimization**:
- Uses compound index `{ owner_id: 1, status: 1 }` for fast filtering
- Sorts by `created_at: -1` for reverse chronological order
- Supports pagination for large result sets

---

### 5. `deleteDocument(documentId, userId)`

**Purpose**: Delete a document and its associated file from disk

**Parameters**:
- `documentId` (string): Document ID to delete
- `userId` (string): Current user ID (for authorization check)

**Returns**: Promise<Object> with structure:
```javascript
{
  message: "Document deleted successfully",
  documentId: string
}
```

**Safety Features**:
- **Authorization Check**: Verifies user owns the document
- **Status Validation**: Only allows deletion of "draft" status documents
- **File Cleanup**: Deletes file from disk before database deletion
- **Atomic Operation**: Database deletion only after file deletion success

**Error Messages**:
```javascript
"Document not found"
"User not authorized to delete this document"
"Cannot delete documents that are not in draft status"
"Failed to delete document: [error]"
```

---

### 6. `updateDocumentStatus(documentId, newStatus)`

**Purpose**: Update document workflow status

**Parameters**:
- `documentId` (string): Document ID
- `newStatus` (string): New status value

**Valid Status Values**:
- `draft`: Initial state, not ready for signing
- `pending_signature`: Ready for signers
- `partially_signed`: Some signers signed, others pending
- `fully_signed`: All signers completed
- `archived`: Document archived/inactive

**Returns**: Promise<Object> - Updated document object

**Special Behavior**:
- When status becomes `fully_signed`: automatically sets `completed_at` to current timestamp
- Always updates `updated_at` field

**Error Handling**:
```javascript
"Invalid status. Must be one of: ..." // For invalid status values
"Document not found"
"Failed to update document status: [error]"
```

---

### 7. `addSignerToDocument(documentId, signerInfo)`

**Purpose**: Add a signer to a document's signers array

**Parameters**:
- `documentId` (string): Document ID
- `signerInfo` (Object):
  - `email` (string, required): Signer's email address
  - `user_id` (string, optional): Signer's MongoDB ObjectId

**Returns**: Promise<Object> - Updated document object

**Signer Object Created**:
```javascript
{
  user_id: ObjectId | null,
  email: string,
  status: "pending",
  signed_at: null,
  signature_id: null
}
```

**Database Operation**:
- Uses MongoDB `$push` operator to append signer to signers array
- Updates `updated_at` timestamp
- Returns modified document

**Error Handling**:
```javascript
"Signer email is required"
"Document not found"
"Failed to add signer: [error]"
```

---

## Database Integration

### Collections Used
- **documents**: Main collection where document records are stored

### Indexes Leveraged
```javascript
documentSchema.index({ owner_id: 1, status: 1 });  // Fast user + status queries
documentSchema.index({ status: 1 });               // Fast status filtering
documentSchema.index({ created_at: -1 });          // Fast sorting by date
```

### Unique Constraints
- `file_hash_sha256` field has unique constraint to prevent duplicate content storage

## File Storage

### Directory Structure
Documents are stored on disk with multer configured to:
- Save to: Directory specified in `DOCUMENT_UPLOAD_DIR` environment variable
- Filename format: Generated by multer (typically timestamp-based)
- File deletion: Recursive cleanup when documents are deleted

### File Path Storage
- Full file path stored in `file_url` field
- Allows serving files directly from disk
- Supports both local storage and S3 migration paths

## Error Handling Strategy

### Graceful Degradation
1. **File upload errors**: Automatically cleanup uploaded files
2. **Database errors**: Logged and wrapped with context
3. **Authorization errors**: Return specific error messages
4. **Validation errors**: Early return with clear messages

### Error Messages
All errors are wrapped with context to assist debugging:
```javascript
throw new Error(`Failed to [operation]: ${error.message}`)
```

## Security Features

1. **Hash-based Integrity**: SHA-256 ensures document content integrity
2. **Duplicate Prevention**: Prevents storing identical content twice
3. **Ownership Verification**: Confirms user owns document before deletion
4. **Status Validation**: Prevents deletion of signed documents
5. **Input Sanitization**: Trims whitespace from text inputs
6. **File Cleanup**: Removes failed uploads from disk

## Testing Recommendations

### Unit Tests to Create
- [ ] `generateDocumentHash()` - verify SHA-256 hash generation
- [ ] `uploadDocument()` - valid upload, duplicate detection, validation
- [ ] `getDocumentById()` - retrieve existing and non-existing documents
- [ ] `getUserDocuments()` - pagination, filtering by status
- [ ] `deleteDocument()` - authorization, status validation, file cleanup
- [ ] `updateDocumentStatus()` - valid/invalid status values
- [ ] `addSignerToDocument()` - signer addition and validation

### Integration Tests
- [ ] Upload document → Verify file saved and record created
- [ ] Upload duplicate → Verify second file deleted and error thrown
- [ ] Add signer → Verify signer array updated
- [ ] Delete draft → Verify file and record deleted
- [ ] Delete signed → Verify rejection of deletion
- [ ] Query user documents → Verify pagination and sorting

### Test Scenarios
```javascript
// Test 1: Successful upload
const result = await uploadDocument(file, userId, "Test Doc");
assert(result._id);
assert(result.status === "draft");

// Test 2: Duplicate detection
await uploadDocument(file, userId, "Doc 1");
await uploadDocument(file, userId, "Doc 2"); // Should throw

// Test 3: Authorization
const doc = await uploadDocument(file, userId1, "Doc");
await deleteDocument(doc._id, userId2); // Should throw "not authorized"

// Test 4: Status validation
await updateDocumentStatus(doc._id, "pending_signature");
await deleteDocument(doc._id, userId1); // Should throw "not in draft"
```

## Dependencies

### Built-in Node.js Modules (no installation needed)
- `fs`: File system operations
- `path`: File path utilities
- `crypto`: SHA-256 hashing

### External Dependencies
- `mongoose`: Already installed for database operations
- `multer`: Required for file upload middleware (install separately if needed)

### Document Model
- Requires: `../models/Document` - Already created in Task 3.1

## Environment Variables Required

For full functionality, these should be set in `backend/.env`:

```
DOCUMENT_UPLOAD_DIR=./uploads/documents
MAX_FILE_SIZE=52428800  # 50MB
ALLOWED_FILE_TYPES=pdf
```

## Integration Points

This service integrates with:

1. **Document Model** (Task 3.1)
   - Uses Document Mongoose schema
   - Performs CRUD operations via model

2. **API Controllers** (Task 3.3)
   - Called by document controller methods
   - Returns data to API responses

3. **File Upload Middleware**
   - Consumes multer file objects
   - Operates on uploaded files

4. **Document Routes** (Task 3.4)
   - Endpoints that use this service

## Performance Considerations

### Optimization Features
1. **Stream-based Hashing**: Processes large files without loading entire file in memory
2. **Indexed Queries**: Database queries use optimized indexes
3. **Pagination Support**: Handles large document sets efficiently
4. **Asynchronous Operations**: Non-blocking file I/O and database operations

### Scalability Notes
- File storage can be migrated to S3 by modifying `file_url` handling
- Database queries benefit from existing indexes
- Multer configuration handles concurrent uploads

## Migration Path

If moving from another document storage system:
1. Verify all documents have valid `file_hash_sha256` values
2. Ensure `file_url` paths are valid and accessible
3. Check that all `owner_id` references point to valid users
4. Validate document status values match enum
5. Run integrity verification on file hashes

## Next Implementation Steps

This service enables:
1. **Phase 3 Task 3.3**: Create Document API Endpoints
2. **Phase 3 Task 3.4**: Build Document Management UI
3. **Phase 4**: Document signing functionality

## API Integration Example

How this service will be used in controllers:

```javascript
// Upload endpoint (Task 3.3)
router.post('/upload', authenticate, upload.single('document'), async (req, res) => {
  const { title, description } = req.body;
  const document = await documentService.uploadDocument(
    req.file,
    req.user._id,
    title,
    description
  );
  res.json(document);
});

// Get user documents (Task 3.3)
router.get('/', authenticate, async (req, res) => {
  const documents = await documentService.getUserDocuments(
    req.user._id,
    { limit: 10, skip: 0, status: req.query.status }
  );
  res.json(documents);
});

// Delete document (Task 3.3)
router.delete('/:documentId', authenticate, async (req, res) => {
  const result = await documentService.deleteDocument(
    req.params.documentId,
    req.user._id
  );
  res.json(result);
});
```

---

**Implementation Status**: ✅ Complete and Ready for Task 3.3
