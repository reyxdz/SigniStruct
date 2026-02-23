# Phase 1 Task 1.2: Certificate API Endpoints

**Status**: ✅ Complete  
**Date Completed**: February 23, 2026  
**Related Task**: Task 1.1 (Certificate Generation Service)

---

## Overview

This task implements the Certificate API endpoints that allow users to generate, retrieve, verify, and revoke digital certificates. These endpoints provide the public interface for the certificate management system and integrate with the certificate service created in Task 1.1.

---

## Files Created

### 1. Certificate Routes
**File**: `backend/src/routes/certificateRoutes.js`

Defines all certificate-related API endpoints with middleware integration.

```javascript
// Routes defined:
POST   /api/certificates/generate          - Generate new certificate
GET    /api/certificates/user/:userId      - Get active certificate
GET    /api/certificates/user/:userId/all  - Get all certificates
GET    /api/certificates/verify/:certificateId - Verify certificate
POST   /api/certificates/revoke            - Revoke certificate
```

### 2. Certificate Controller
**File**: `backend/src/controllers/certificateController.js`

Contains all business logic for certificate operations:
- `generateCertificate()` - Creates new PKI certificate for user
- `getUserCertificate()` - Retrieves active certificate
- `getAllUserCertificates()` - Lists all certificates (active and revoked)
- `verifyCertificate()` - Validates certificate status
- `revokeCertificate()` - Marks certificate as revoked

### 3. Certificate Validation Middleware
**File**: `backend/src/middleware/certificateValidation.js`

Input validation rules for all certificate endpoints using `express-validator`:
- `validateGenerateCertificate` - Validates email, name, validity years
- `validateUserId` - Validates MongoDB ObjectId format
- `validateCertificateId` - Validates certificate ID format
- `validateRevokeCertificate` - Validates revocation request

---

## Files Modified

### User Model
**File**: `backend/src/models/User.js`

Added field:
```javascript
certificate_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'UserCertificate',
  default: null
}
```

### Server Configuration
**File**: `backend/src/server.js`

Registered certificate routes:
```javascript
const certificateRoutes = require('./routes/certificateRoutes');
app.use('/api/certificates', certificateRoutes);
```

---

## API Endpoints Details

### 1. Generate Certificate
**Endpoint**: `POST /api/certificates/generate`  
**Access**: Private (Authentication required)  
**Validation**: Email, Name, Optional Validity Years

**Request Body**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "validityYears": 5
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Certificate generated successfully",
  "certificate": {
    "certificate_id": "string",
    "public_key": "string",
    "issuer": "SigniStruct",
    "subject": "string",
    "serial_number": "string",
    "not_before": "ISO8601 datetime",
    "not_after": "ISO8601 datetime",
    "fingerprint_sha256": "string",
    "status": "active"
  }
}
```

**Error Cases**:
- 400: Validation failed
- 404: User not found
- 409: User already has active certificate
- 500: Certificate generation failed

---

### 2. Get User Certificate (Active)
**Endpoint**: `GET /api/certificates/user/:userId`  
**Access**: Private (User can access own, Admin can access any)  

**Response** (200 OK):
```json
{
  "success": true,
  "certificate": {
    "_id": "MongoDB ObjectId",
    "certificate_id": "string",
    "public_key": "string",
    "issuer": "SigniStruct",
    "subject": "string",
    "serial_number": "string",
    "not_before": "ISO8601 datetime",
    "not_after": "ISO8601 datetime",
    "fingerprint_sha256": "string",
    "status": "active",
    "created_at": "ISO8601 datetime"
  }
}
```

**Error Cases**:
- 403: Unauthorized (cannot access other user's certificate)
- 404: No active certificate found
- 500: Retrieval failed

---

### 3. Get All Certificates
**Endpoint**: `GET /api/certificates/user/:userId/all`  
**Access**: Private (User can access own, Admin can access any)  

**Response** (200 OK):
```json
{
  "success": true,
  "count": 2,
  "certificates": [
    {
      "_id": "MongoDB ObjectId",
      "certificate_id": "string",
      "public_key": "string",
      "issuer": "SigniStruct",
      "subject": "string",
      "serial_number": "string",
      "not_before": "ISO8601 datetime",
      "not_after": "ISO8601 datetime",
      "fingerprint_sha256": "string",
      "status": "active|revoked",
      "created_at": "ISO8601 datetime",
      "revoked_at": "ISO8601 datetime|null"
    }
  ]
}
```

**Error Cases**:
- 403: Unauthorized
- 404: No certificates found
- 500: Retrieval failed

---

### 4. Verify Certificate
**Endpoint**: `GET /api/certificates/verify/:certificateId`  
**Access**: Public (No authentication required)  

**Response** (200 OK):
```json
{
  "success": true,
  "certificate_id": "string",
  "is_valid": true,
  "status": "active",
  "verification_details": {
    "is_expired": false,
    "is_not_yet_valid": false,
    "is_revoked": false,
    "not_before": "ISO8601 datetime",
    "not_after": "ISO8601 datetime",
    "current_time": "ISO8601 datetime"
  },
  "issuer": "SigniStruct",
  "subject": "string",
  "serial_number": "string",
  "fingerprint_sha256": "string"
}
```

**Certificate Validity Checks**:
- `is_expired`: Current time > not_after date
- `is_not_yet_valid`: Current time < not_before date
- `is_revoked`: Status equals "revoked"
- `is_valid`: True only if NOT expired AND NOT pending AND NOT revoked

**Error Cases**:
- 404: Certificate not found
- 500: Verification failed

---

### 5. Revoke Certificate
**Endpoint**: `POST /api/certificates/revoke`  
**Access**: Private (User can revoke own, Admin can revoke any)  

**Request Body**:
```json
{
  "certificateId": "string",
  "reason": "optional reason text (max 500 chars)"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Certificate revoked successfully",
  "certificate_id": "string",
  "revoked_at": "ISO8601 datetime",
  "status": "revoked"
}
```

**Error Cases**:
- 403: Unauthorized (cannot revoke other user's certificate)
- 404: Certificate not found
- 409: Certificate already revoked
- 500: Revocation failed

---

## Implementation Details

### Security Features

1. **Private Key Encryption**: Private keys are encrypted with AES-256 before storage
2. **Authorization Checks**: Users can only access their own certificates unless they're admins
3. **Input Validation**: All inputs are validated using express-validator
4. **No Sensitive Data Exposure**: Encrypted private keys are never returned in API responses
5. **Certificate Expiration**: Automatically checked during verification

### Database Integration

Uses `UserCertificate` model (from Task 1.1) to store:
- Public/private keys (encrypted)
- Certificate metadata
- Status tracking (active/revoked)
- Timestamps

Links to `User` model via `certificate_id` field

### Error Handling

Consistent error responses:
```json
{
  "error": "error message",
  "details": "error details"
}
```

---

## Dependencies

The following npm packages are required (installed in Task 1.1):
- `express-validator` - Input validation
- `node-rsa` - RSA key operations
- `node-forge` - Certificate operations
- `crypto-js` - Encryption/decryption

---

## Testing Scenarios

### Scenario 1: Generate Certificate
```bash
POST /api/certificates/generate
Headers: Authorization: Bearer <token>
Body: { "email": "user@example.com", "name": "John Doe" }
Expected: 201 with certificate data
```

### Scenario 2: Try Duplicate Generation
```bash
POST /api/certificates/generate (2nd time)
Expected: 409 Conflict - User already has active certificate
```

### Scenario 3: Get Own Certificate
```bash
GET /api/certificates/user/<userId>
Headers: Authorization: Bearer <token>
Expected: 200 with certificate data
```

### Scenario 4: Verify Certificate (Public)
```bash
GET /api/certificates/verify/<certificateId>
Expected: 200 with verification details
```

### Scenario 5: Revoke Certificate
```bash
POST /api/certificates/revoke
Headers: Authorization: Bearer <token>
Body: { "certificateId": "<id>", "reason": "User requested" }
Expected: 200 with revocation confirmation
```

### Scenario 6: Access Other User's Certificate (Failure)
```bash
GET /api/certificates/user/<otherUserId>
Headers: Authorization: Bearer <token>
Expected: 403 Unauthorized
```

---

## Integration Notes

### For Next Phase (Task 1.3 - Update User Model)

The User model has already been updated with the `certificate_id` field in this task.

### For Frontend Integration

Frontend developers should use these endpoints to:

1. **Generate Certificate Flow**:
   - Call POST `/api/certificates/generate` after user signup
   - Store certificate data in app state
   - Display confirmation to user

2. **Display Certificate Info**:
   - Call GET `/api/certificates/user/:userId` to fetch current certificate
   - Show certificate details in user dashboard

3. **Verify External Certificates**:
   - Call GET `/api/certificates/verify/:certificateId` (no auth required)
   - Display verification status to users

4. **Revoke Certificate**:
   - Call POST `/api/certificates/revoke` to revoke when needed
   - Prompt user for confirmation before revoking

---

## Environment Variables Required

```env
MASTER_ENCRYPTION_KEY=your-32-character-random-key-here
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=7d
MONGODB_URI=mongodb://localhost:27017/signistruct
```

---

## File Structure

```
backend/
├── src/
│   ├── routes/
│   │   └── certificateRoutes.js          (NEW)
│   ├── controllers/
│   │   └── certificateController.js      (NEW)
│   ├── middleware/
│   │   ├── authMiddleware.js             (existing)
│   │   ├── certificateValidation.js      (NEW)
│   ├── models/
│   │   ├── User.js                       (MODIFIED)
│   │   └── UserCertificate.js            (existing)
│   ├── services/
│   │   └── certificateService.js         (existing)
│   └── server.js                         (MODIFIED)
```

---

## Git Commits

Implemented with 5 separate commits:

1. `feat: Create certificate validation middleware with endpoint validators`
2. `feat: Create certificate controller with generate, retrieve, verify, and revoke endpoints`
3. `feat: Create certificate routes with all four endpoints`
4. `feat: Register certificate routes in server configuration`
5. `feat: Add certificate_id field to User model for certificate reference`

---

## Next Steps

- Task 1.3: Update User Model (Already done as part of this implementation)
- Task 1.4: Update Database Schema with indexes
- Phase 2: Implement Signature Management

---

## References

- Task 1.1: Certificate Generation Service
- DOCUMENT_SIGNER_ROADMAP.md
- UserCertificate Model: `backend/src/models/UserCertificate.js`
- CertificateService: `backend/src/services/certificateService.js`
