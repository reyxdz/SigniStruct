# Phase 8.1.2 Quick Test with cURL
# 
# This script tests the POST /api/verification/documents/:documentId/verify-all endpoint
#
# Requirements:
#   - curl installed
#   - Backend running on http://localhost:5000
#   - Valid JWT token from user login
#   - Document ID from a document you own
#
# Usage:
#   ./test-phase-8-1-2.sh <JWT_TOKEN> <DOCUMENT_ID>
#
# Example:
#   ./test-phase-8-1-2.sh "eyJhbGciOi..." "507f1f77bcf86cd799439011"

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <JWT_TOKEN> <DOCUMENT_ID>"
  echo ""
  echo "Example:"
  echo "  $0 \"eyJhbGciOi...\" \"507f1f77bcf86cd799439011\""
  exit 1
fi

BASE_URL="${BASE_URL:-http://localhost:5000}"
JWT_TOKEN="$1"
DOCUMENT_ID="$2"

if [ -z "$DOCUMENT_ID" ]; then
  DOCUMENT_ID="invalid_id_test"
  echo "⚠️  Document ID not provided, using invalid ID for testing"
fi

echo "═══════════════════════════════════════════════════════════"
echo "Phase 8.1.2 Verification Endpoint Test"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Base URL:     $BASE_URL"
echo "JWT Token:    ${JWT_TOKEN:0:20}..."
echo "Document ID:  $DOCUMENT_ID"
echo ""
echo "Sending POST request..."
echo ""

# Send the request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "$BASE_URL/api/verification/documents/$DOCUMENT_ID/verify-all" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

# Split response and status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Display results
echo "═══════════════════════════════════════════════════════════"
echo "Response Received"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Status Code: $HTTP_CODE"
echo ""
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Validate response
if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Status 200 OK - Verification successful"
  echo ""
  echo "Checking response structure..."
  
  if echo "$BODY" | jq -e '.success' > /dev/null 2>&1; then
    echo "  ✓ Has 'success' field"
  fi
  
  if echo "$BODY" | jq -e '.data.verification' > /dev/null 2>&1; then
    echo "  ✓ Has verification data"
    
    TITLE=$(echo "$BODY" | jq -r '.data.verification.document_title // "N/A"')
    SIGS=$(echo "$BODY" | jq -r '.data.verification.signature_count // "N/A"')
    VALID=$(echo "$BODY" | jq -r '.data.verification.verified_count // "N/A"')
    
    echo "    - Document: $TITLE"
    echo "    - Total Signatures: $SIGS"
    echo "    - Valid Signatures: $VALID"
  fi
  
  if echo "$BODY" | jq -e '.data.tampering' > /dev/null 2>&1; then
    echo "  ✓ Has tampering data"
  fi
  
  if echo "$BODY" | jq -e '.data.summary.requestId' > /dev/null 2>&1; then
    REQ_ID=$(echo "$BODY" | jq -r '.data.summary.requestId')
    echo "  ✓ Has request ID: $REQ_ID"
  fi
  
elif [ "$HTTP_CODE" = "404" ]; then
  echo "✗ Status 404 - Document not found"
  echo "  (This is expected if the Document ID is invalid or doesn't exist)"
  
elif [ "$HTTP_CODE" = "403" ]; then
  echo "✗ Status 403 - Unauthorized"
  echo "  (This is expected if you're not the document owner)"
  
elif [ "$HTTP_CODE" = "401" ]; then
  echo "✗ Status 401 - Unauthorized (Invalid JWT)"
  echo "  (Check that your JWT token is valid)"
  
else
  echo "✗ Status $HTTP_CODE - Unexpected response"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Test Complete"
echo "═══════════════════════════════════════════════════════════"
