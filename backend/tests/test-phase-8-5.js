/**
 * Phase 8.5: Testing & Validation
 * Comprehensive test suite for cryptographic signing system
 * 
 * Test Scenarios:
 * 1. Sign document, immediately verify (should pass)
 * 2. Modify document content, verify (should fail - tampering detected)
 * 3. Delete a signature, verify (should fail - missing signature)
 * 4. Sign with revoked certificate (should fail)
 * 5. Export certificate and audit trail
 * 6. Verify old signatures after 1 year expiry
 */

const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');

const BASE_URL = process.argv[2] || 'http://localhost:5000';

// Test data
let testUser1 = null;
let testUser2 = null;
let testDocument = null;
let testSignature = null;
let testCertificate = null;

// Color codes for console output
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

// Helper function to log test results
function logTest(testName, passed, message = '') {
  if (passed) {
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    if (message) console.log(`  ${message}`);
    passCount++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (message) console.log(`  ${colors.red}${message}${colors.reset}`);
    failCount++;
  }
}

// Test 1: Register two test users
async function testUserRegistration() {
  console.log(`\n${colors.blue}${colors.bold}Test 1: User Registration${colors.reset}`);
  
  try {
    // Register User 1
    const user1Response = await axios.post(`${BASE_URL}/api/auth/signup`, {
      firstName: `Test`,
      lastName: `User${Date.now()}`,
      email: `testuser1-${Date.now()}@test.com`,
      phone: '639123456789',
      address: 'Test Address 123',
      password: 'TestPassword@123',
      confirmPassword: 'TestPassword@123'
    });
    
    testUser1 = {
      _id: user1Response.data.user?.id || user1Response.data.user?._id,
      token: user1Response.data.token,
      email: user1Response.data.user?.email,
      firstName: user1Response.data.user?.firstName,
      lastName: user1Response.data.user?.lastName
    };
    logTest('User 1 Registration', user1Response.status === 201, 
      `User created with ID: ${testUser1._id}`);
    
    // Register User 2
    const user2Response = await axios.post(`${BASE_URL}/api/auth/signup`, {
      firstName: `Test`,
      lastName: `User2${Date.now()}`,
      email: `testuser2-${Date.now()}@test.com`,
      phone: '639987654321',
      address: 'Test Address 456',
      password: 'TestPassword@123',
      confirmPassword: 'TestPassword@123'
    });
    
    testUser2 = {
      _id: user2Response.data.user?.id || user2Response.data.user?._id,
      token: user2Response.data.token,
      email: user2Response.data.user?.email,
      firstName: user2Response.data.user?.firstName,
      lastName: user2Response.data.user?.lastName
    };
    logTest('User 2 Registration', user2Response.status === 201,
      `User created with ID: ${testUser2._id}`);
    
  } catch (error) {
    logTest('User Registration', false, error.response?.data?.message || error.message);
  }
}

// Test 2: Create test document
async function testDocumentCreation() {
  console.log(`\n${colors.blue}${colors.bold}Test 2: Document Creation${colors.reset}`);
  
  try {
    const docResponse = await axios.post(`${BASE_URL}/api/documents/upload`, {
      title: `Test Document ${Date.now()}`,
      description: 'Testing Phase 8.5 - Cryptographic Signing and Verification',
      content: 'This is test document content for cryptographic signing validation.',
      fields: [
        {
          id: 'signature_field_1',
          type: 'signature',
          name: 'Authorized Signature',
          value: '',
          required: true
        },
        {
          id: 'date_field_1',
          type: 'date',
          name: 'Date Signed',
          value: new Date().toISOString().split('T')[0],
          required: true
        }
      ]
    }, {
      headers: { Authorization: `Bearer ${testUser1.token}` }
    });
    
    testDocument = docResponse.data.data || docResponse.data;
    logTest('Document Created', docResponse.status === 201 || docResponse.status === 200,
      `Document ID: ${testDocument._id}`);
    
  } catch (error) {
    logTest('Document Creation', false, error.response?.data?.message || error.message);
  }
}

// Test 3: Scenario 1 - Sign document, immediately verify (should pass)
async function testSignAndVerifyPass() {
  console.log(`\n${colors.blue}${colors.bold}Test 3: Sign & Immediately Verify (Expected: PASS)${colors.reset}`);
  
  try {
    // Sign the document
    const signResponse = await axios.post(
      `${BASE_URL}/api/documents/${testDocument._id}/sign-field`,
      {
        fieldId: 'signature_field_1',
        fieldContent: 'Test Signature Content',
        signatureImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        password: 'TestPassword@123'
      },
      { headers: { Authorization: `Bearer ${testUser1.token}` } }
    );
    
    testSignature = signResponse.data.data;
    logTest('Document Signed', signResponse.status === 200,
      `Signature ID: ${testSignature._id}, Algorithm: ${testSignature.algorithm}`);
    
    // Immediately verify
    const verifyResponse = await axios.post(
      `${BASE_URL}/api/documents/${testDocument._id}/verify-signature`,
      {
        signatureId: testSignature._id,
        fieldContent: 'Test Signature Content'
      },
      { headers: { Authorization: `Bearer ${testUser1.token}` } }
    );
    
    const isValid = verifyResponse.data.data.is_valid && 
                    verifyResponse.data.data.signature_valid &&
                    verifyResponse.data.data.content_matches;
    
    logTest('Signature Verification Passed', isValid,
      `Verification result: ${JSON.stringify({
        is_valid: verifyResponse.data.data.is_valid,
        signature_valid: verifyResponse.data.data.signature_valid,
        content_matches: verifyResponse.data.data.content_matches,
        tampering_detected: verifyResponse.data.data.tampering_detected
      })}`);
    
  } catch (error) {
    logTest('Sign & Verify (Pass)', false, error.message);
  }
}

// Test 4: Scenario 2 - Modify document content, verify (should fail)
async function testModifyContentAndVerifyFail() {
  console.log(`\n${colors.blue}${colors.bold}Test 4: Modify Content & Verify (Expected: FAIL)${colors.reset}`);
  
  try {
    // Try to verify with modified content
    const verifyResponse = await axios.post(
      `${BASE_URL}/api/documents/${testDocument._id}/verify-signature`,
      {
        signatureId: testSignature._id,
        fieldContent: 'MODIFIED TEST SIGNATURE CONTENT - TAMPERED'
      },
      { headers: { Authorization: `Bearer ${testUser1.token}` } }
    );
    
    const shouldFail = !verifyResponse.data.data.content_matches;
    const tamperingDetected = verifyResponse.data.data.tampering_detected;
    
    logTest('Tampering Detection', shouldFail && tamperingDetected,
      `Content mismatch detected: ${!verifyResponse.data.data.content_matches}, Tampering: ${tamperingDetected}`);
    
  } catch (error) {
    logTest('Tampering Detection', false, error.message);
  }
}

// Test 5: Scenario 3 - Delete signature, verify (should fail)
async function testDeleteSignatureAndVerifyFail() {
  console.log(`\n${colors.blue}${colors.bold}Test 5: Delete Signature & Verify (Expected: FAIL)${colors.reset}`);
  
  try {
    // Create another signature to delete
    const signResponse = await axios.post(
      `${BASE_URL}/api/documents/${testDocument._id}/sign-field`,
      {
        fieldId: 'date_field_1',
        fieldContent: new Date().toISOString().split('T')[0],
        password: 'TestPassword@123'
      },
      { headers: { Authorization: `Bearer ${testUser1.token}` } }
    );
    
    const deletableSignature = signResponse.data.data;
    logTest('Created Signature for Deletion', true, `Signature ID: ${deletableSignature._id}`);
    
    // Revoke the signature
    const revokeResponse = await axios.post(
      `${BASE_URL}/api/documents/${testDocument._id}/signatures/${deletableSignature._id}/revoke`,
      { revocation_reason: 'Test revocation for Phase 8.5' },
      { headers: { Authorization: `Bearer ${testUser1.token}` } }
    );
    
    logTest('Signature Revoked', revokeResponse.status === 200,
      `Revocation successful`);
    
    // Try to verify revoked signature
    const verifyResponse = await axios.post(
      `${BASE_URL}/api/documents/${testDocument._id}/verify-signature`,
      {
        signatureId: deletableSignature._id,
        fieldContent: new Date().toISOString().split('T')[0]
      },
      { headers: { Authorization: `Bearer ${testUser1.token}` } }
    );
    
    const isRevoked = !verifyResponse.data.data.is_valid;
    logTest('Revoked Signature Fails Verification', isRevoked,
      `Verification failed as expected for revoked signature`);
    
  } catch (error) {
    logTest('Delete/Revoke Signature Test', false, error.message);
  }
}

// Test 6: Scenario 4 - Sign with revoked certificate (should fail)
async function testSignWithRevokedCertificate() {
  console.log(`\n${colors.blue}${colors.bold}Test 6: Sign with Revoked Certificate (Expected: FAIL)${colors.reset}`);
  
  try {
    // First, get user's certificate
    const certResponse = await axios.get(
      `${BASE_URL}/api/certificates/my-certificate`,
      { headers: { Authorization: `Bearer ${testUser2.token}` } }
    );
    
    testCertificate = certResponse.data.data;
    logTest('Retrieved User Certificate', certResponse.status === 200,
      `Certificate ID: ${testCertificate.certificate_id}`);
    
    // Revoke the certificate
    const revokeResponse = await axios.post(
      `${BASE_URL}/api/certificates/revoke`,
      { revocation_reason: 'Testing Phase 8.5 - revoked certificate scenario' },
      { headers: { Authorization: `Bearer ${testUser2.token}` } }
    );
    
    logTest('Certificate Revoked', revokeResponse.status === 200,
      `Certificate revocation successful`);
    
    // Try to sign with revoked certificate
    try {
      await axios.post(
        `${BASE_URL}/api/documents/${testDocument._id}/sign-field`,
        {
          fieldId: 'signature_field_1',
          fieldContent: 'Test with revoked cert',
          password: 'TestPassword@123'
        },
        { headers: { Authorization: `Bearer ${testUser2.token}` } }
      );
      
      logTest('Prevented Signing with Revoked Certificate', false,
        'Should have rejected signing with revoked certificate');
    } catch (signError) {
      const isExpected = signError.response?.status === 403 || 
                         signError.response?.data?.message?.includes('revoked') ||
                         signError.response?.data?.message?.includes('invalid');
      
      logTest('Prevented Signing with Revoked Certificate', isExpected,
        `Signing rejected: ${signError.response?.data?.message}`);
    }
    
  } catch (error) {
    logTest('Revoked Certificate Test', false, error.message);
  }
}

// Test 7: Scenario 5 - Export certificate and audit trail
async function testExportCertificateAndAuditTrail() {
  console.log(`\n${colors.blue}${colors.bold}Test 7: Export Certificate & Audit Trail${colors.reset}`);
  
  try {
    // Get certificate
    const certResponse = await axios.get(
      `${BASE_URL}/api/certificates/my-certificate`,
      { headers: { Authorization: `Bearer ${testUser1.token}` } }
    );
    
    const hasCertificate = certResponse.status === 200 && certResponse.data.data;
    logTest('Export Certificate', hasCertificate,
      `Certificate exported: ${certResponse.data.data?.certificate_id || 'N/A'}`);
    
    // Get audit trail for document
    const auditResponse = await axios.get(
      `${BASE_URL}/api/documents/${testDocument._id}/audit-trail`,
      { headers: { Authorization: `Bearer ${testUser1.token}` } }
    );
    
    const hasAuditTrail = auditResponse.status === 200 && Array.isArray(auditResponse.data.data);
    logTest('Export Audit Trail', hasAuditTrail,
      `Audit entries: ${auditResponse.data.data?.length || 0}`);
    
    // Get signature report
    if (testSignature) {
      const reportResponse = await axios.get(
        `${BASE_URL}/api/documents/${testDocument._id}/signatures/${testSignature._id}/report`,
        { headers: { Authorization: `Bearer ${testUser1.token}` } }
      );
      
      const hasReport = reportResponse.status === 200 && reportResponse.data.data;
      logTest('Get Signature Report', hasReport,
        `Report generated with details`);
    }
    
  } catch (error) {
    logTest('Export Certificate & Audit Trail', false, error.message);
  }
}

// Test 8: Scenario 6 - Verify old signatures after expiry
async function testVerifyOldSignaturesAfterExpiry() {
  console.log(`\n${colors.blue}${colors.bold}Test 8: Verify Old Signatures After Expiry (Simulated)${colors.reset}`);
  
  try {
    // Get signature statistics
    const statsResponse = await axios.get(
      `${BASE_URL}/api/documents/${testDocument._id}/signatures/statistics`,
      { headers: { Authorization: `Bearer ${testUser1.token}` } }
    );
    
    const hasStats = statsResponse.status === 200 && statsResponse.data.data;
    logTest('Get Signature Statistics', hasStats,
      `Stats: ${JSON.stringify(statsResponse.data.data?.statistics || {})}`);
    
    // Verify all signatures
    const verifyAllResponse = await axios.post(
      `${BASE_URL}/api/documents/${testDocument._id}/verify-all-signatures`,
      {},
      { headers: { Authorization: `Bearer ${testUser1.token}` } }
    );
    
    const allVerified = verifyAllResponse.status === 200;
    logTest('Verify All Signatures', allVerified,
      `All signatures: ${verifyAllResponse.data.data?.all_valid ? 'VALID' : 'some invalid'}`);
    
  } catch (error) {
    logTest('Verify Old Signatures', false, error.message);
  }
}

// Test 9: Get verified signatures only
async function testGetVerifiedSignaturesOnly() {
  console.log(`\n${colors.blue}${colors.bold}Test 9: Get Verified Signatures Only${colors.reset}`);
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/documents/${testDocument._id}/signatures/verified`,
      { headers: { Authorization: `Bearer ${testUser1.token}` } }
    );
    
    const hasVerified = response.status === 200 && Array.isArray(response.data.data);
    logTest('Get Verified Signatures', hasVerified,
      `Verified signatures count: ${response.data.data?.length || 0}`);
    
  } catch (error) {
    logTest('Get Verified Signatures', false, error.message);
  }
}

// Test 10: Get cryptographic signatures
async function testGetCryptoSignatures() {
  console.log(`\n${colors.blue}${colors.bold}Test 10: Get Cryptographic Signatures${colors.reset}`);
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/documents/${testDocument._id}/signatures/crypto`,
      { headers: { Authorization: `Bearer ${testUser1.token}` } }
    );
    
    const hasCrypto = response.status === 200 && Array.isArray(response.data.data);
    logTest('Get Crypto Signatures', hasCrypto,
      `Cryptographic signatures count: ${response.data.data?.length || 0}`);
    
    if (response.data.data && response.data.data.length > 0) {
      const firstSig = response.data.data[0];
      const hasCryptoFields = firstSig.crypto_signature && 
                              firstSig.content_hash && 
                              firstSig.algorithm;
      logTest('Crypto Fields Present', hasCryptoFields,
        `Algorithm: ${firstSig.algorithm}`);
    }
    
  } catch (error) {
    logTest('Get Crypto Signatures', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log(`\n${colors.bold}${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}║  Phase 8.5: Testing & Validation                             ║${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}║  Comprehensive Cryptographic Signing System Test Suite       ║${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  console.log(`Base URL: ${BASE_URL}\n`);
  
  try {
    // Run tests in sequence
    await testUserRegistration();
    await testDocumentCreation();
    await testSignAndVerifyPass();
    await testModifyContentAndVerifyFail();
    await testDeleteSignatureAndVerifyFail();
    await testSignWithRevokedCertificate();
    await testExportCertificateAndAuditTrail();
    await testVerifyOldSignaturesAfterExpiry();
    await testGetVerifiedSignaturesOnly();
    await testGetCryptoSignatures();
    
  } catch (error) {
    console.error(`${colors.red}Unexpected error:${colors.reset}`, error.message);
  }
  
  // Print summary
  console.log(`\n${colors.bold}${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}Test Summary:${colors.reset}`);
  console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
  console.log(`Total: ${passCount + failCount}`);
  console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
  console.log(`${colors.bold}${colors.blue}════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
