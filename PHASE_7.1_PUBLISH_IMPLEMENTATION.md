# Phase 7.1: Publish Flow Implementation

## Overview
Phase 7.1 implements the document publishing workflow, allowing document owners to validate their document setup, publish documents, and send signing invitations to recipients via email.

## Implementation Summary

### Backend Implementation

#### 1. Enhanced DocumentSignature Model (`backend/src/models/DocumentSignature.js`)
**Changes:**
- Made `signer_id` and `certificate_id` optional (for pending signatures)
- Added `recipient_email` and `recipient_name` fields (for email invitations)
- Added `signing_token` field (JWT token for signing page access)
- Added `status` enum field supporting: `pending`, `signed`, `declined`, `expired`
- Added `fields` array to track which fields this recipient must sign
- Made all signature fields optional to support both pending and completed signatures
- Added compound index on `document_id` and `recipient_email` for efficient lookups

**Purpose:** Allows tracking of both pending signing invitations and completed signatures in a single model

#### 2. New PublishDocument Endpoint (`POST /api/documents/:documentId/publish`)

**Location:** `backend/src/controllers/documentController.js` (new method: `publishDocument`)

**Functionality:**
1. **Ownership Validation:** Verifies the requesting user owns the document
2. **Document Validation:**
   - Ensures document has at least one field
   - Validates that all recipient fields have at least one assigned recipient
3. **Recipient Collection:** Extracts unique recipients from all recipient fields
4. **Token Generation:** Creates JWT signing tokens for each recipient:
   - Token payload: `{ documentId, recipientEmail, recipientName, type: 'signing' }`
   - Expiration: 30 days
5. **DocumentSignature Records:** Creates a record for each recipient with:
   - Status: `pending`
   - Signing token for page access
   - List of field IDs the recipient must sign
6. **Email Invitations:** Sends HTML emails to each recipient with:
   - Document title and sender information
   - Signing link with embedded token
   - Expiration notice (30 days)
7. **Status Update:** Updates document status to `pending_signature`
8. **Response:** Returns detailed response with:
   - Recipient count
   - List of recipients
   - Email results (success/failure per recipient)
   - Email results include messageId tracking

**Route:** `POST /api/documents/:documentId/publish`
**Authentication:** Required (verifyToken middleware)
**Authorization:** Document owner only

**Response Format:**
```json
{
  "success": true,
  "message": "Document published and invitations sent",
  "data": {
    "documentId": "ObjectId",
    "title": "Document Title",
    "status": "pending_signature",
    "recipientCount": 2,
    "recipients": [
      { "email": "recipient@example.com", "name": "John Doe", "userId": "ObjectId" }
    ],
    "emailResults": [
      { "email": "recipient@example.com", "success": true, "messageId": "..." }
    ],
    "publishedAt": "ISO Date"
  }
}
```

### Frontend Implementation

#### 1. Validation Logic (`frontend/src/pages/DocumentEditor/DocumentEditorPage.js`)

**New Method:** `validatePublishRequirements(documentObj)`
**Validates:**
- Document has at least one field
- Document has at least one recipient field
- Each recipient field has at least one assigned recipient

**Returns:**
```javascript
{
  valid: boolean,
  message: string // Explains validation failure (if applicable)
}
```

#### 2. Publish Handler Enhancement

**Updated Method:** `handlePublishDocument()`
**Flow:**
1. Call `validatePublishRequirements()` with document object
2. Show alert if validation fails (prevents invalid publish attempts)
3. Display confirmation dialog asking user to confirm publishing
4. If confirmed, make `POST /documents/:documentId/publish` request
5. On success:
   - Show success alert with recipient count and email results
   - Refresh document data to reflect new status
6. On error:
   - Show error alert with backend error message
7. Always catch and log errors with full response details

**User Feedback:**
- Validation errors are immediately shown in alert dialogs
- Confirmation dialog explains that recipients will receive invitations
- Success message shows how many recipients received emails
- Error messages include backend error details for troubleshooting

### Data Flow

```
User clicks "Publish" Button (DOM)
    ↓
handlePublishDocument() called
    ↓
validatePublishRequirements(document) checks:
  • Document has fields
  • Recipient fields exist
  • All recipient fields assigned
    ↓
If invalid → Show Alert & return
    ↓
If valid → Show Confirmation Dialog
    ↓
If not confirmed → return
    ↓
If confirmed → POST /documents/:documentId/publish
    ↓
Backend validatePublish checks:
  • Document exists
  • User owns document
  • Fields exist with recipients
    ↓
Backend generates:
  • JWT signing tokens (1 per recipient)
  • DocumentSignature records (1 per recipient)
  • Email invitations via EmailService
    ↓
Backend updates:
  • Document status → "pending_signature"
  • Document publishedAt timestamp
    ↓
Response: { success, data: { recipientCount, emailResults, ... } }
    ↓
Frontend shows:
  • Success alert with recipient count
  • Refresh document to show new status
    ↓
User can see document status changed to "pending_signature"
```

## API Integration Points

### New Endpoint
- **URL:** `POST /api/documents/:documentId/publish`
- **Authentication:** Bearer token (JWT)
- **Required:** Valid document ID in URL
- **Body:** Empty (all data fetched from document)

### Connected Endpoints
- **EmailService:** Sends HTML emails using configured provider
- **JWT Generation:** Uses `process.env.JWT_SECRET` from .env
- **Frontend URL:** Uses `process.env.FRONTEND_URL` for signing link (defaults to `http://localhost:3000`)

## Environment Variables Required

```env
# For JWT token generation (already exists)
JWT_SECRET=test_jwt_secret_key_change_this_in_production

# For email service (already exists)
EMAIL_PROVIDER=smtp  # or 'gmail', 'sendgrid'
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_password
EMAIL_FROM_ADDRESS=noreply@signistruct.com

# Optional, for frontend signing links
FRONTEND_URL=http://localhost:3000
```

## Testing Checklist

- [x] Backend validates document ownership
- [x] Backend validates all recipient fields have recipients
- [x] Frontend validates before attempting publish
- [x] Frontend shows confirmation dialog
- [x] JWT tokens generated with correct payload
- [x] DocumentSignature records created for each recipient
- [x] Email templates formatted correctly
- [x] Document status updated to `pending_signature`
- [x] Success response includes recipient details and email results
- [x] Error handling for missing email configuration
- [x] Error messages displayed to user

## Error Scenarios Handled

1. **Document Not Found** → 404 response
2. **Not Document Owner** → 403 response
3. **No Fields in Document** → 400 response with message
4. **No Recipient Fields** → 400 response with message
5. **Recipient Field without Recipients** → 400 response listing affected fields
6. **Email Service Not Initialized** → Emails skipped with warning logged
7. **Email Send Failure** → Individual recipient error tracked, operation continues

## Future Enhancements (Phase 7.2+)

- Signing view page: `/documents/:documentId/sign/:signingToken`
- Recipient compliance with field signing
- Signature data storage and verification
- Document completion tracking
- Signing reminders and deadline enforcement
- Audit trail for publishing and signing events

## Commits

1. **Backend Implementation**
   - Message: "Phase 7.1: Backend - Add publish endpoint with validation, JWT tokens, and email invitations"
   - Changes:
     - Added `publishDocument` method with full logic
     - Updated DocumentSignature model with new fields
     - Added route: `POST /api/documents/:documentId/publish`

2. **Frontend Implementation**
   - Message: "Phase 7.1: Frontend - Add publish handler with validation and confirmation dialog"
   - Changes:
     - Added `validatePublishRequirements` method
     - Updated `handlePublishDocument` with full implementation
     - Added user confirmation dialogs
     - Enhanced error and success messaging

## Summary

Phase 7.1 successfully implements the document publishing workflow. Users can now:
1. ✅ Create documents with fields
2. ✅ Assign recipients to those fields
3. ✅ Publish documents with full validation
4. ✅ Send signing invitations via email
5. ✅ Track recipient status via DocumentSignature records

The system is ready for Phase 7.2 (Recipient Signing View) and Phase 7.3 (Signature Submission).
