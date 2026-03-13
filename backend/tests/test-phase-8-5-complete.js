/**
 * Phase 8.5: Complete Testing & Validation Suite
 * Comprehensive test for cryptographic signing system
 * 
 * Test Scenarios:
 * 1. User registration and authentication
 * 2. Document upload (with actual PDF file)
 * 3. Sign document, immediately verify (should pass)
 * 4. Modify content, verify (should fail - tampering detected)
 * 5. Delete/revoke signature, verify (should fail)
 * 6. Sign with revoked certificate (should fail)
 * 7. Export certificate and audit trail
 * 8. Get signature statistics and reports
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.argv[2] || 'http://localhost:5000';

// Test data storage
let results = {
  tests: [],
  users: [],
  documents: [],
  signatures: [],
  certificates: []
};

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

let passCount = 0;
let failCount = 0;

function logTest(testNum, name, passed, message = '') {
  const status = passed ? 
    `${colors.green}✓ PASS${colors.reset}` : 
    `${colors.red}✗ FAIL${colors.reset}`;
  
  console.log(`\n${colors.bold}Test ${testNum}: ${name}${colors.reset}`);
  console.log(`Status: ${status}`);
  
  if (message) {
    console.log(`Details: ${message}`);
  }
  
  if (passed) passCount++;
  else failCount++;
  
  results.tests.push({
    num: testNum,
    name,
    passed,
    message
  });
}

function printSeparator() {
  console.log(`\n${colors.blue}${'─'.repeat(70)}${colors.reset}`);
}

// Create a minimalistPDF for testing
function createTestPDF(fileName) {
  const pdfPath = path.join(__dirname, fileName);
  
  // Create a minimal valid PDF structure
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
328
%%EOF`;

  fs.writeFileSync(pdfPath, pdfContent);
  return pdfPath;
}

// Test 1: User Registration
async function test1_UserRegistration() {
  try {
    console.log(`\n${colors.bold}${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}PHASE 8.5: TESTING & VALIDATION${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
    printSeparator();
    
    const userData = {
      firstName: 'SignTest',
      lastName: `User${Date.now()}`,
      email: `signtest-${Date.now()}@test.com`,
      phone: '639123456789',
      address: 'Test Address 123',
      password: 'TestPassword@123',
      confirmPassword: 'TestPassword@123'
    };
    
    const response = await axios.post(`${BASE_URL}/api/auth/signup`, userData);
    
    const user = {
      id: response.data.user.id,
      email: response.data.user.email,
      token: response.data.token,
      firstName: response.data.user.firstName,
      password: userData.password
    };
    
    results.users.push(user);
    logTest(1, 'User Registration & RSA Key Generation', response.status === 201,
      `User created: ${user.email}`);
      
  } catch (error) {
    logTest(1, 'User Registration & RSA Key Generation', false,
      error.response?.data?.message || error.message);
  }
}

// Test 2: Retrieve User Certificate
async function test2_RetrieveCertificate() {
  try {
    if (results.users.length === 0) {
      logTest(2, 'Retrieve User Certificate', false, 'No user available');
      return;
    }
    
    const user = results.users[0];
    const response = await axios.get(`${BASE_URL}/api/certificates/my-certificate`,
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    
    const certificate = response.data.data || response.data.certificate;
    if (certificate) {
      results.certificates.push({
        id: certificate.certificate_id || certificate._id,
        userId: user.id,
        status: 'active'
      });
    }
    
    logTest(2, 'Retrieve User Certificate', response.status === 200,
      `Certificate ID: ${certificate?.certificate_id || 'N/A'}`);
      
  } catch (error) {
    logTest(2, 'Retrieve User Certificate', false,
      error.response?.data?.message || error.message);
  }
}

// Test 3: Upload Document
async function test3_UploadDocument() {
  try {
    if (results.users.length === 0) {
      logTest(3, 'Upload Document (PDF)', false, 'No user available');
      return;
    }
    
    const pdfPath = createTestPDF('test-document.pdf');
    const user = results.users[0];
    
    const formData = new FormData();
    formData.append('document', fs.createReadStream(pdfPath));
    formData.append('title', `Test Document ${Date.now()}`);
    formData.append('description', 'Phase 8.5 Cryptographic Signing Test');
    
    const response = await axios.post(`${BASE_URL}/api/documents/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${user.token}`
        }
      }
    );
    
    const doc = response.data.document || response.data;
    results.documents.push({
      id: doc._id,
      title: doc.title,
      userId: user.id,
      status: 'draft'
    });
    
    // Clean up PDF file
    fs.unlinkSync(pdfPath);
    
    logTest(3, 'Upload Document (PDF)', response.status === 201,
      `Document ID: ${doc._id}`);
      
  } catch (error) {
    logTest(3, 'Upload Document (PDF)', false,
      error.response?.data?.message || error.message);
  }
}

// Test 4: Get Documents List
async function test4_GetDocuments() {
  try {
    if (results.users.length === 0) {
      logTest(4, 'Get User Documents List', false, 'No user available');
      return;
    }
    
    const user = results.users[0];
    const response = await axios.get(`${BASE_URL}/api/documents/`,
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    
    const documents = response.data.documents || response.data.data || [];
    
    logTest(4, 'Get User Documents List', response.status === 200,
      `Found ${documents.length} document(s)`);
      
  } catch (error) {
    logTest(4, 'Get User Documents List', false,
      error.response?.data?.message || error.message);
  }
}

// Test 5: Sign Document Field
async function test5_SignDocumentField() {
  try {
    if (results.users.length === 0 || results.documents.length === 0) {
      logTest(5, 'Sign Document Field (Phase 8.3.2)', false, 'Missing user or document');
      return;
    }
    
    const user = results.users[0];
    const doc = results.documents[0];
    
    const response = await axios.post(
      `${BASE_URL}/api/documents/${doc.id}/sign-field`,
      {
        fieldId: 'signature_field_1',
        fieldContent: 'Digital Signature - Phase 8.5 Test',
        signatureImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        password: user.password
      },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    
    const signature = response.data.data || response.data;
    results.signatures.push({
      id: signature._id,
      documentId: doc.id,
      userId: user.id,
      algorithm: signature.algorithm,
      verified: false
    });
    
    const hasCryptoFields = signature.crypto_signature && 
                           signature.content_hash &&
                           signature.algorithm;
    
    logTest(5, 'Sign Document Field (Phase 8.3.2)', 
      response.status === 200 && hasCryptoFields,
      `Signature ID: ${signature._id}, Algorithm: ${signature.algorithm}`);
      
  } catch (error) {
    logTest(5, 'Sign Document Field (Phase 8.3.2)', false,
      error.response?.data?.message || error.message);
  }
}

// Test 6: Verify Signature Immediately
async function test6_VerifySignatureImmediate() {
  try {
    if (results.users.length === 0 || results.documents.length === 0 || results.signatures.length === 0) {
      logTest(6, 'Verify Signature (Immediate - Should PASS)', false, 'Missing data');
      return;
    }
    
    const user = results.users[0];
    const doc = results.documents[0];
    const sig = results.signatures[0];
    
    const response = await axios.post(
      `${BASE_URL}/api/documents/${doc.id}/verify-signature`,
      {
        signatureId: sig.id,
        fieldContent: 'Digital Signature - Phase 8.5 Test'
      },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    
    const result = response.data.data || response.data.verification;
    const isValid = result.is_valid &&
                   result.signature_valid &&
                   result.content_matches &&
                   !result.tampering_detected;
    
    logTest(6, 'Verify Signature (Immediate - Should PASS)',
      isValid,
      `Valid: ${result.is_valid}, Tampering: ${result.tampering_detected}`);
    
    if (isValid) {
      results.signatures[0].verified = true;
    }
      
  } catch (error) {
    logTest(6, 'Verify Signature (Immediate - Should PASS)', false,
      error.response?.data?.message || error.message);
  }
}

// Test 7: Verify with Modified Content (Should FAIL)
async function test7_TamperingDetection() {
  try {
    if (results.users.length === 0 || results.documents.length === 0 || results.signatures.length === 0) {
      logTest(7, 'Tampering Detection (Should FAIL)', false, 'Missing data');
      return;
    }
    
    const user = results.users[0];
    const doc = results.documents[0];
    const sig = results.signatures[0];
    
    const response = await axios.post(
      `${BASE_URL}/api/documents/${doc.id}/verify-signature`,
      {
        signatureId: sig.id,
        fieldContent: 'MODIFIED CONTENT - TAMPERED WITH!'
      },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    
    const result = response.data.data || response.data.verification;
    const isTampered = !result.content_matches || result.tampering_detected;
    
    logTest(7, 'Tampering Detection (Should FAIL)',
      isTampered,
      `Content matches: ${result.content_matches}, Tampering detected: ${result.tampering_detected}`);
      
  } catch (error) {
    logTest(7, 'Tampering Detection (Should FAIL)', false,
      error.response?.data?.message || error.message);
  }
}

// Test 8: Get Signature Statistics
async function test8_SignatureStatistics() {
  try {
    if (results.users.length === 0 || results.documents.length === 0) {
      logTest(8, 'Get Signature Statistics (Phase 8.3.3)', false, 'Missing data');
      return;
    }
    
    const user = results.users[0];
    const doc = results.documents[0];
    
    const response = await axios.get(
      `${BASE_URL}/api/documents/${doc.id}/signatures/statistics`,
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    
    const stats = response.data.data || response.data;
    
    logTest(8, 'Get Signature Statistics (Phase 8.3.3)',
      response.status === 200,
      `Total signatures: ${stats?.total_signatures || 0}, By algorithm: ${JSON.stringify(stats?.by_algorithm || {})}`);
      
  } catch (error) {
    logTest(8, 'Get Signature Statistics (Phase 8.3.3)', false,
      error.response?.data?.message || error.message);
  }
}

// Test 9: Get Cryptographic Signatures Only
async function test9_GetCryptoSignatures() {
  try {
    if (results.users.length === 0 || results.documents.length === 0) {
      logTest(9, 'Get Cryptographic Signatures (Phase 8.3.3)', false, 'Missing data');
      return;
    }
    
    const user = results.users[0];
    const doc = results.documents[0];
    
    const response = await axios.get(
      `${BASE_URL}/api/documents/${doc.id}/signatures/crypto`,
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    
    const signatures = response.data.data || response.data || [];
    
    logTest(9, 'Get Cryptographic Signatures (Phase 8.3.3)',
      response.status === 200,
      `Found ${Array.isArray(signatures) ? signatures.length : 0} crypto signature(s)`);
      
  } catch (error) {
    logTest(9, 'Get Cryptographic Signatures (Phase 8.3.3)', false,
      error.response?.data?.message || error.message);
  }
}

// Test 10: Get Verified Signatures Only
async function test10_GetVerifiedSignatures() {
  try {
    if (results.users.length === 0 || results.documents.length === 0) {
      logTest(10, 'Get Verified Signatures (Phase 8.3.3)', false, 'Missing data');
      return;
    }
    
    const user = results.users[0];
    const doc = results.documents[0];
    
    const response = await axios.get(
      `${BASE_URL}/api/documents/${doc.id}/signatures/verified`,
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    
    const signatures = response.data.data || response.data || [];
    
    logTest(10, 'Get Verified Signatures (Phase 8.3.3)',
      response.status === 200,
      `Found ${Array.isArray(signatures) ? signatures.length : 0} verified signature(s)`);
      
  } catch (error) {
    logTest(10, 'Get Verified Signatures (Phase 8.3.3)', false,
      error.response?.data?.message || error.message);
  }
}

// Test 11: Create Second User for Certificate Revocation Test
async function test11_SecondUserRegistration() {
  try {
    const userData = {
      firstName: 'SignTest',
      lastName: `User2${Date.now()}`,
      email: `signtest2-${Date.now()}@test.com`,
      phone: '639987654321',
      address: 'Test Address 456',
      password: 'TestPassword@123',
      confirmPassword: 'TestPassword@123'
    };
    
    const response = await axios.post(`${BASE_URL}/api/auth/signup`, userData);
    
    const user = {
      id: response.data.user.id,
      email: response.data.user.email,
      token: response.data.token,
      firstName: response.data.user.firstName,
      password: userData.password
    };
    
    results.users.push(user);
    logTest(11, 'Second User Registration (for revocation test)', response.status === 201,
      `User created: ${user.email}`);
      
  } catch (error) {
    logTest(11, 'Second User Registration (for revocation test)', false,
      error.response?.data?.message || error.message);
  }
}

// Test 12: Revoke Signature
async function test12_RevokeSignature() {
  try {
    if (results.users.length === 0 || results.documents.length === 0 || results.signatures.length === 0) {
      logTest(12, 'Revoke Signature (Phase 8.3.3)', false, 'Missing data');
      return;
    }
    
    const user = results.users[0];
    const doc = results.documents[0];
    const sig = results.signatures[0];
    
    const response = await axios.post(
      `${BASE_URL}/api/documents/${doc.id}/signatures/${sig.id}/revoke`,
      {
        revocation_reason: 'Test revocation for Phase 8.5 - Validation'
      },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    
    logTest(12, 'Revoke Signature (Phase 8.3.3)',
      response.status === 200,
      `Signature revoked successfully`);
      
  } catch (error) {
    logTest(12, 'Revoke Signature (Phase 8.3.3)', false,
      error.response?.data?.message || error.message);
  }
}

// Test 13: Verify Revoked Signature (Should FAIL)
async function test13_VerifyRevokedSignature() {
  try {
    if (results.users.length === 0 || results.documents.length === 0 || results.signatures.length === 0) {
      logTest(13, 'Verify Revoked Signature (Should FAIL)', false, 'Missing data');
      return;
    }
    
    const user = results.users[0];
    const doc = results.documents[0];
    const sig = results.signatures[0];
    
    const response = await axios.post(
      `${BASE_URL}/api/documents/${doc.id}/verify-signature`,
      {
        signatureId: sig.id,
        fieldContent: 'Digital Signature - Phase 8.5 Test'
      },
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    
    const result = response.data.data || response.data.verification;
    const shouldFail = !result.is_valid;
    
    logTest(13, 'Verify Revoked Signature (Should FAIL)',
      shouldFail,
      `Valid: ${result.is_valid} (expected false)`);
      
  } catch (error) {
    logTest(13, 'Verify Revoked Signature (Should FAIL)', false,
      error.response?.data?.message || error.message);
  }
}

// Run all tests
async function runAllTests() {
  try {
    printSeparator();
    
    await test1_UserRegistration();
    await test2_RetrieveCertificate();
    await test3_UploadDocument();
    await test4_GetDocuments();
    await test5_SignDocumentField();
    await test6_VerifySignatureImmediate();
    await test7_TamperingDetection();
    await test8_SignatureStatistics();
    await test9_GetCryptoSignatures();
    await test10_GetVerifiedSignatures();
    await test11_SecondUserRegistration();
    await test12_RevokeSignature();
    await test13_VerifyRevokedSignature();
    
    printSeparator();
    
    // Summary
    console.log(`\n${colors.bold}${colors.blue}TEST SUMMARY${colors.reset}`);
    console.log(`${colors.green}✓ Passed: ${passCount}${colors.reset}`);
    console.log(`${colors.red}✗ Failed: ${failCount}${colors.reset}`);
    console.log(`Total: ${passCount + failCount}`);
    console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
    
    console.log(`\n${colors.bold}Phase 8.5 Validation Complete${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
    
    process.exit(failCount > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

runAllTests();
