# Phase 3 Task 3.1: Document Model Implementation

**Date Completed**: February 25, 2026  
**Status**: ✅ COMPLETED

## Overview

Task 3.1 involved creating the Document model that serves as the foundation for document management in the SigniStruct system. This model defines the schema for storing document information in MongoDB and enables proper data validation and indexing.

## Implementation Details

### File Created
- `backend/src/models/Document.js`

### Schema Definition

The Document model implements the following schema structure:

```javascript
{
  owner_id: ObjectId (required, indexed),
  title: String (required),
  description: String (optional),
  file_url: String (required),
  original_filename: String (required),
  file_hash_sha256: String (required, unique),
  file_size: Number (required),
  num_pages: Number (default: 1),
  file_type: String (default: 'application/pdf'),
  status: String (enum: ['draft', 'pending_signature', 'partially_signed', 'fully_signed', 'archived'], default: 'draft'),
  signers: [
    {
      user_id: ObjectId,
      email: String,
      signed_at: Date,
      signature_id: ObjectId,
      status: String (enum: ['pending', 'signed', 'declined'])
    }
  ],
  created_at: Date (default: now, indexed),
  updated_at: Date (default: now),
  completed_at: Date (optional)
}
```

### Key Fields Explained

| Field | Type | Description | Index |
|-------|------|-------------|-------|
| `owner_id` | ObjectId | References the User who owns/uploaded the document | Yes |
| `title` | String | Document title/name | No |
| `description` | String | Optional document description | No |
| `file_url` | String | Path or URL to the stored PDF file | No |
| `original_filename` | String | Original filename when uploaded | No |
| `file_hash_sha256` | String | SHA-256 hash of file content for integrity verification | Yes (unique) |
| `file_size` | Number | Size of the document in bytes | No |
| `num_pages` | Number | Number of pages in the PDF | No |
| `file_type` | String | MIME type of the file | No |
| `status` | String | Current document workflow status | Yes |
| `signers` | Array | List of signers with their status and signature information | No |
| `created_at` | Date | Document creation timestamp | Yes |
| `updated_at` | Date | Last modification timestamp | No |
| `completed_at` | Date | When document reached fully_signed status | No |

### Database Indexes

Three compound and single-field indexes were created for optimal query performance:

```javascript
documentSchema.index({ owner_id: 1, status: 1 });  // For filtering user's documents by status
documentSchema.index({ status: 1 });               // For filtering by status globally
documentSchema.index({ created_at: -1 });          // For sorting documents by date
```

### Features Implemented

1. **Automatic Timestamp Management**
   - Uses Mongoose middleware to automatically update `updated_at` field before each save
   - Supports both `created_at` and `updated_at` timestamps

2. **Status Tracking**
   - `draft`: Document uploaded but not ready for signing
   - `pending_signature`: Document ready and awaiting initial signatures
   - `partially_signed`: Some signers have signed, others pending
   - `fully_signed`: All signers have completed signing
   - `archived`: Document archived/inactive

3. **Signer Management**
   - Stores array of signers with their:
     - User ID and email for identification
     - Referenced signature ID from the signatures collection
     - Individual signing status (pending, signed, declined)
     - Timestamp when they signed

4. **File Integrity**
   - `file_hash_sha256` field stores cryptographic hash for verifying document hasn't been modified
   - Unique constraint ensures no duplicate documents by content

5. **Document Metadata**
   - Captures original filename, file size, and page count
   - Enables better document management and display

### Connection to Other Models

The Document model integrates with:
- **User Model**: via `owner_id` reference
- **UserSignature Model**: via signatures referenced in signers array
- **DocumentSignature Model**: for detailed signature records (to be implemented in Phase 4)

## Testing Considerations

When testing the Document Model, verify:
- [ ] Documents can be created with valid owner_id
- [ ] File hash uniqueness is enforced (attempting to create duplicate should fail)
- [ ] Status transitions follow the defined enum values
- [ ] Signer array structure is properly validated
- [ ] Timestamps are automatically set and updated
- [ ] Indexes are properly created for performance
- [ ] Document can be queried by owner_id efficiently
- [ ] Document can be queried by status efficiently

## Next Steps

This Document Model enables:
1. **Phase 3 Task 3.2**: Document Upload Service implementation
2. **Phase 3 Task 3.3**: Document API Endpoints creation
3. **Phase 3 Task 3.4**: Document Management UI development

## Database Collection

The model creates a `documents` collection in MongoDB with the following sample document structure:

```json
{
  "_id": ObjectId,
  "owner_id": ObjectId,
  "title": "Q4 2026 Financial Report",
  "description": "Quarterly financial statements requiring signatures",
  "file_url": "/uploads/documents/doc_1708878421234.pdf",
  "original_filename": "Q4_2026_Report.pdf",
  "file_hash_sha256": "abc123def456...",
  "file_size": 2048576,
  "num_pages": 15,
  "file_type": "application/pdf",
  "status": "pending_signature",
  "signers": [
    {
      "user_id": ObjectId,
      "email": "user@example.com",
      "status": "pending",
      "signature_id": null,
      "signed_at": null
    }
  ],
  "created_at": ISODate("2026-02-25T10:00:00Z"),
  "updated_at": ISODate("2026-02-25T10:00:00Z"),
  "completed_at": null
}
```

## Migration Notes

If migrating from an earlier implementation:
- The unique constraint on `file_hash_sha256` should be verified to exist
- All existing documents should have valid `owner_id` references
- Document status values should be normalized to the enum values defined
- Timestamps should be verified as valid Date objects

---

**Implementation Status**: ✅ Complete and Ready for Integration
