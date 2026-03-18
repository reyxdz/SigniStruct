# SigniStruct API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api`  
**Authentication:** JWT Bearer Token  
**Content-Type:** `application/json`

---

## Table of Contents
1. [Authentication](#authentication)
2. [Certificates](#certificates)
3. [Signatures](#signatures)
4. [Documents](#documents)
5. [Document Signing](#document-signing)
6. [Verification](#verification)
7. [Audit & Logging](#audit--logging)
8. [Signing Requests](#signing-requests)
9. [Multi-Signer](#multi-signer)
10. [Response Codes](#response-codes)
11. [Error Handling](#error-handling)

---

## Authentication

### Sign Up
Create a new user account.

**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "09123456789",
  "address": "123 Main St, City, State",
  "password": "SecurePass123"
}
```

**Response (201 - Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "09123456789",
    "address": "123 Main St, City, State",
    "createdAt": "2026-02-25T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation Rules:**
- `firstName`: Required, min 2 characters
- `lastName`: Required, min 2 characters
- `email`: Required, valid email format, unique
- `phone`: Required, valid format
- `address`: Required, min 5 characters
- `password`: Required, min 8 characters, must contain uppercase and number

---

### Sign In
Authenticate a user and receive JWT token.

**Endpoint:** `POST /auth/signin`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid email or password

---

### Get Current User
Retrieve authenticated user's profile information.

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "09123456789",
    "address": "123 Main St, City, State",
    "createdAt": "2026-02-25T10:00:00Z"
  }
}
```

---

## Certificates

### Generate Certificate
Generate a new PKI certificate for the user.

**Endpoint:** `POST /certificates/generate`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "commonName": "John Doe"
}
```

**Response (201 - Created):**
```json
{
  "success": true,
  "message": "Certificate generated successfully",
  "certificate": {
    "_id": "507f1f77bcf86cd799439012",
    "user_id": "507f1f77bcf86cd799439011",
    "certificate_pem": "-----BEGIN CERTIFICATE-----...",
    "public_key": "-----BEGIN PUBLIC KEY-----...",
    "fingerprint": "SHA256:...",
    "serial_number": "...",
    "issuer": "SigniStruct",
    "subject": "CN=John Doe",
    "issued_date": "2026-02-25T10:00:00Z",
    "expiration_date": "2027-02-25T10:00:00Z",
    "is_revoked": false,
    "created_at": "2026-02-25T10:00:00Z"
  }
}
```

---

### Get User Certificate
Retrieve the user's current certificate.

**Endpoint:** `GET /certificates/user/:userId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "certificate": {
    "_id": "507f1f77bcf86cd799439012",
    "user_id": "507f1f77bcf86cd799439011",
    "issuer": "SigniStruct",
    "subject": "CN=John Doe",
    "issued_date": "2026-02-25T10:00:00Z",
    "expiration_date": "2027-02-25T10:00:00Z",
    "is_revoked": false
  }
}
```

---

### Verify Certificate
Verify the validity of a certificate.

**Endpoint:** `GET /certificates/verify/:certificateId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "is_valid": true,
  "message": "Certificate is valid",
  "details": {
    "certificate_id": "507f1f77bcf86cd799439012",
    "owner": "John Doe",
    "issued_date": "2026-02-25T10:00:00Z",
    "expiration_date": "2027-02-25T10:00:00Z",
    "is_expired": false,
    "is_revoked": false
  }
}
```

---

### Revoke Certificate
Revoke a user's certificate.

**Endpoint:** `POST /certificates/revoke`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "certificate_id": "507f1f77bcf86cd799439012",
  "reason": "User requested revocation"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Certificate revoked successfully",
  "certificate_id": "507f1f77bcf86cd799439012"
}
```

---

## Signatures

### Create/Upload Signature
Create a new signature (handwritten via pad or uploaded image).

**Endpoint:** `POST /signatures/create`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "signature_image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "signature_type": "handwritten"
}
```

**Signature Types:**
- `handwritten` - Drawn on signature pad
- `uploaded` - Uploaded image file
- `printed` - Text-based signature

**Response (201 - Created):**
```json
{
  "success": true,
  "message": "Signature created successfully",
  "signature": {
    "_id": "507f1f77bcf86cd799439013",
    "user_id": "507f1f77bcf86cd799439011",
    "signature_type": "handwritten",
    "is_default": false,
    "created_at": "2026-02-25T10:00:00Z"
  }
}
```

---

### Get User Signatures
Retrieve all signatures for the authenticated user.

**Endpoint:** `GET /signatures/user`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "count": 3,
  "signatures": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "signature_type": "handwritten",
      "is_default": true,
      "created_at": "2026-02-25T10:00:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "signature_type": "uploaded",
      "is_default": false,
      "created_at": "2026-02-25T11:00:00Z"
    }
  ]
}
```

---

### Get Default Signature
Retrieve the user's default signature.

**Endpoint:** `GET /signatures/default`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "signature": {
    "_id": "507f1f77bcf86cd799439013",
    "user_id": "507f1f77bcf86cd799439011",
    "signature_image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "signature_type": "handwritten",
    "is_default": true,
    "created_at": "2026-02-25T10:00:00Z"
  }
}
```

---

### Set Default Signature
Mark a signature as the user's default.

**Endpoint:** `PUT /signatures/:signatureId/set-default`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Default signature updated",
  "signature_id": "507f1f77bcf86cd799439013"
}
```

---

### Get Signature by ID
Retrieve a specific signature (includes image data).

**Endpoint:** `GET /signatures/:signatureId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "signature": {
    "_id": "507f1f77bcf86cd799439013",
    "user_id": "507f1f77bcf86cd799439011",
    "signature_image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "signature_type": "handwritten",
    "is_default": true,
    "created_at": "2026-02-25T10:00:00Z"
  }
}
```

---

### Delete Signature
Remove a signature.

**Endpoint:** `DELETE /signatures/:signatureId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Signature deleted successfully",
  "signature_id": "507f1f77bcf86cd799439013"
}
```

---

## Documents

### Upload Document
Upload a PDF document for signing.

**Endpoint:** `POST /documents/upload`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `document` (file): PDF file
- `title` (string): Document title
- `description` (string, optional): Document description

**Response (201 - Created):**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "document": {
    "_id": "507f1f77bcf86cd799439015",
    "owner_id": "507f1f77bcf86cd799439011",
    "title": "Contract Agreement",
    "file_url": "/uploads/documents/507f1f77bcf86cd799439015.pdf",
    "file_hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "file_size": 102400,
    "num_pages": 5,
    "status": "draft",
    "created_at": "2026-02-25T10:00:00Z"
  }
}
```

**File Requirements:**
- Format: PDF only
- Max size: 50MB
- Must be valid PDF

---

### Get Documents
Retrieve user's documents with optional filtering.

**Endpoint:** `GET /documents`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): `draft|pending_signature|partially_signed|fully_signed|archived`
- `page` (optional, default: 1): Pagination page number
- `limit` (optional, default: 10): Items per page

**Response (200 - OK):**
```json
{
  "success": true,
  "count": 1,
  "documents": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "title": "Contract Agreement",
      "file_url": "/uploads/documents/507f1f77bcf86cd799439015.pdf",
      "file_size": 102400,
      "num_pages": 5,
      "status": "draft",
      "created_at": "2026-02-25T10:00:00Z",
      "updated_at": "2026-02-25T10:00:00Z"
    }
  ]
}
```

---

### Get Document Details
Retrieve detailed information about a specific document.

**Endpoint:** `GET /documents/:documentId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "document": {
    "_id": "507f1f77bcf86cd799439015",
    "owner_id": "507f1f77bcf86cd799439011",
    "title": "Contract Agreement",
    "description": "Q1 2026 Service Agreement",
    "file_url": "/uploads/documents/507f1f77bcf86cd799439015.pdf",
    "file_hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "file_size": 102400,
    "num_pages": 5,
    "status": "pending_signature",
    "signers": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "user_id": "507f1f77bcf86cd799439016",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "status": "pending",
        "signing_order": 1
      }
    ],
    "created_at": "2026-02-25T10:00:00Z",
    "updated_at": "2026-02-25T10:00:00Z"
  }
}
```

---

### Delete Document
Remove a document (only draft documents can be deleted).

**Endpoint:** `DELETE /documents/:documentId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Document deleted successfully",
  "document_id": "507f1f77bcf86cd799439015"
}
```

---

## Document Signing

### Sign Document
Apply a signature to a document.

**Endpoint:** `POST /documents/:documentId/sign`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "signature_id": "507f1f77bcf86cd799439013",
  "signature_placement": {
    "page": 1,
    "x": 100,
    "y": 200,
    "width": 150,
    "height": 50
  },
  "password": "UserPassword123"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Document signed successfully",
  "document_signature": {
    "_id": "507f1f77bcf86cd799439020",
    "document_id": "507f1f77bcf86cd799439015",
    "signer_id": "507f1f77bcf86cd799439011",
    "signature_id": "507f1f77bcf86cd799439013",
    "signature_value": "...",
    "signature_algorithm": "RSA",
    "timestamp": "2026-02-25T10:00:00Z",
    "is_valid": true,
    "signature_placement": {
      "page": 1,
      "x": 100,
      "y": 200
    }
  },
  "document_status": "fully_signed"
}
```

---

### Get Document Signatures
Retrieve all signatures on a document.

**Endpoint:** `GET /documents/:documentId/signatures`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "count": 2,
  "signatures": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "signer_id": "507f1f77bcf86cd799439011",
      "signer_name": "John Doe",
      "signature_value": "...",
      "timestamp": "2026-02-25T10:00:00Z",
      "is_valid": true,
      "signature_placement": {
        "page": 1,
        "x": 100,
        "y": 200
      }
    }
  ]
}
```

---

## Verification

### Verify Document
Verify the authenticity and integrity of all signatures on a document.

**Endpoint:** `POST /documents/:documentId/verify`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "is_valid": true,
  "document": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "Contract Agreement",
    "status": "fully_signed"
  },
  "signatures": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "signer_name": "John Doe",
      "timestamp": "2026-02-25T10:00:00Z",
      "is_valid": true,
      "certificate_valid": true,
      "hash_match": true,
      "signature_tamper_detected": false
    }
  ],
  "overall_status": {
    "all_signatures_valid": true,
    "all_certificates_valid": true,
    "document_integrity": "intact",
    "verification_timestamp": "2026-02-25T10:30:00Z"
  }
}
```

---

### Verify Signature
Verify a specific signature.

**Endpoint:** `GET /verify/signature/:signatureId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "is_valid": true,
  "signature": {
    "_id": "507f1f77bcf86cd799439020",
    "document_id": "507f1f77bcf86cd799439015",
    "signer_name": "John Doe",
    "timestamp": "2026-02-25T10:00:00Z"
  },
  "verification_details": {
    "signature_valid": true,
    "certificate_valid": true,
    "certificate_not_expired": true,
    "certificate_not_revoked": true,
    "hash_match": true,
    "no_tampering": true
  }
}
```

---

## Audit & Logging

### Get Audit Log
Retrieve the audit trail for a document.

**Endpoint:** `GET /audit/documents/:documentId`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `action` (optional): `upload|sign|verify|share|request_signature|download`
- `limit` (optional, default: 50): Number of records
- `offset` (optional, default: 0): Starting record

**Response (200 - OK):**
```json
{
  "success": true,
  "count": 5,
  "logs": [
    {
      "_id": "507f1f77bcf86cd799439025",
      "action": "upload",
      "user_id": "507f1f77bcf86cd799439011",
      "user_name": "John Doe",
      "document_id": "507f1f77bcf86cd799439015",
      "details": "Document uploaded",
      "timestamp": "2026-02-25T10:00:00Z",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0..."
    },
    {
      "_id": "507f1f77bcf86cd799439026",
      "action": "sign",
      "user_id": "507f1f77bcf86cd799439011",
      "user_name": "John Doe",
      "document_id": "507f1f77bcf86cd799439015",
      "details": "Document signed with signature ID 507f1f77bcf86cd799439013",
      "timestamp": "2026-02-25T10:15:00Z",
      "ip_address": "192.168.1.1"
    }
  ]
}
```

---

### Export Audit Report
Export audit trail as CSV.

**Endpoint:** `GET /audit/documents/:documentId/export`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
Returns CSV file with audit trail data.

```
action,user_name,timestamp,details,ip_address
upload,John Doe,2026-02-25T10:00:00Z,Document uploaded,192.168.1.1
sign,John Doe,2026-02-25T10:15:00Z,Document signed with signature ID 507f1f77bcf86cd799439013,192.168.1.1
```

---

### Get User Activity
Retrieve all activities performed by a user.

**Endpoint:** `GET /audit/users/:userId/activity`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional, default: 50): Number of records
- `days` (optional, default: 30): Last N days

**Response (200 - OK):**
```json
{
  "success": true,
  "count": 12,
  "activities": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "action": "sign",
      "document_id": "507f1f77bcf86cd799439015",
      "document_title": "Contract Agreement",
      "timestamp": "2026-02-25T10:15:00Z",
      "status": "success"
    }
  ]
}
```

---

## Signing Requests

### Create Signing Request
Request someone else to sign a document.

**Endpoint:** `POST /signing-requests/create`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "document_id": "507f1f77bcf86cd799439015",
  "recipient_email": "jane@example.com",
  "message": "Please review and sign this contract",
  "expires_in_days": 7,
  "signing_order": 1
}
```

**Response (201 - Created):**
```json
{
  "success": true,
  "message": "Signing request created and sent",
  "request": {
    "_id": "507f1f77bcf86cd799439035",
    "document_id": "507f1f77bcf86cd799439015",
    "document_title": "Contract Agreement",
    "requester_id": "507f1f77bcf86cd799439011",
    "requester_name": "John Doe",
    "recipient_email": "jane@example.com",
    "status": "pending",
    "expires_at": "2026-03-04T10:00:00Z",
    "signing_order": 1,
    "created_at": "2026-02-25T10:00:00Z"
  }
}
```

---

### Get Signing Requests
Retrieve signing requests for the authenticated user.

**Endpoint:** `GET /signing-requests`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): `pending|signed|rejected|expired`
- `type` (optional): `sent|received`

**Response (200 - OK):**
```json
{
  "success": true,
  "count": 3,
  "requests": [
    {
      "_id": "507f1f77bcf86cd799439035",
      "document_id": "507f1f77bcf86cd799439015",
      "document_title": "Contract Agreement",
      "requester_name": "John Doe",
      "status": "pending",
      "expires_at": "2026-03-04T10:00:00Z",
      "created_at": "2026-02-25T10:00:00Z"
    }
  ]
}
```

---

### Accept Signing Request
Accept a signing request and proceed to sign.

**Endpoint:** `PUT /signing-requests/:requestId/accept`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Signing request accepted",
  "request_id": "507f1f77bcf86cd799439035",
  "document_id": "507f1f77bcf86cd799439015"
}
```

---

### Reject Signing Request
Reject a signing request.

**Endpoint:** `PUT /signing-requests/:requestId/reject`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "reason": "Unable to sign at this time"
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Signing request rejected",
  "request_id": "507f1f77bcf86cd799439035"
}
```

---

## Multi-Signer

### Add Signers to Document
Add multiple signers with specific signing order.

**Endpoint:** `POST /documents/:documentId/signers`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "signers": [
    {
      "email": "jane@example.com",
      "name": "Jane Smith",
      "signing_order": 1,
      "is_required": true
    },
    {
      "email": "bob@example.com",
      "name": "Bob Johnson",
      "signing_order": 2,
      "is_required": true
    }
  ]
}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Signers added successfully",
  "signers": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "document_id": "507f1f77bcf86cd799439015",
      "email": "jane@example.com",
      "name": "Jane Smith",
      "status": "pending",
      "signing_order": 1
    }
  ]
}
```

---

### Get Document Signers
Retrieve all signers and their signing status.

**Endpoint:** `GET /documents/:documentId/signers`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "signers": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "status": "signed",
      "signing_order": 1,
      "signed_at": "2026-02-25T10:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439041",
      "name": "Bob Johnson",
      "email": "bob@example.com",
      "status": "pending",
      "signing_order": 2,
      "signed_at": null
    }
  ]
}
```

---

### Remove Signer
Remove a signer from a document (only if not yet signed).

**Endpoint:** `DELETE /documents/:documentId/signers/:signerId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 - OK):**
```json
{
  "success": true,
  "message": "Signer removed successfully",
  "signer_id": "507f1f77bcf86cd799439040"
}
```

---

## Response Codes

| Code | Description |
|------|-------------|
| `200` | OK - Request successful |
| `201` | Created - Resource created successfully |
| `400` | Bad Request - Invalid request data |
| `401` | Unauthorized - Invalid or missing token |
| `403` | Forbidden - User lacks permission |
| `404` | Not Found - Resource not found |
| `409` | Conflict - Resource already exists |
| `500` | Internal Server Error - Server error |
| `503` | Service Unavailable - Server temporarily unavailable |

---

## Error Handling

### Standard Error Response

**Format:**
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed description (optional)",
  "timestamp": "2026-02-25T10:00:00Z",
  "path": "/api/documents/upload"
}
```

### Common Errors

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Not found",
  "message": "Document with ID 507f1f77bcf86cd799439999 not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Authentication

All endpoints (except `/auth/signup` and `/auth/signin`) require JWT authentication.

**Header Format:**
```
Authorization: Bearer {jwt_token}
```

**Token Expiry:** 7 days  
**Token Refresh:** Reissued on each login

---

## Rate Limiting

- **General endpoints:** 100 requests per 15 minutes per IP
- **Auth endpoints:** 5 requests per 15 minutes per IP
- **Upload endpoints:** 10 requests per 15 minutes per user

---

## Pagination

List endpoints support pagination with the following parameters:

- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `sort` (optional): Field name with `-` prefix for descending order

**Example:** `GET /documents?page=2&limit=20&sort=-created_at`

---

## Data Types

- **ObjectId:** MongoDB ObjectId (24-character hex string)
- **Date:** ISO 8601 format (e.g., `2026-02-25T10:00:00Z`)
- **Base64:** URL-safe base64 encoded string
- **UUID:** Universally unique identifier

---

## Webhook Events (Future)

The following webhook events will be available in future releases:

- `document.uploaded`
- `document.signed`
- `document.verified`
- `signature.request.created`
- `signature.request.completed`

---

## Support

For API issues or questions:
- **Email:** support@signistruct.com
- **Documentation:** https://docs.signistruct.com
- **GitHub Issues:** https://github.com/reyxdz/SigniStruct/issues

---

**Last Updated:** February 25, 2026  
**API Version:** 1.0.0  
**Status:** Production Ready
