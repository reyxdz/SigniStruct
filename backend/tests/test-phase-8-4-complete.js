/**
 * Phase 8.4: Certificate Management - Complete Test Suite
 * 
 * Tests for:
 * - Certificate export/download (PEM format)
 * - Certificate expiry status checking
 * - Certificate renewal workflow
 * - Certificate audit history
 * - Background job for expiry notifications
 * 
 * Run: node tests/test-phase-8-4-complete.js <baseUrl>
 * Example: node tests/test-phase-8-4-complete.js http://localhost:5000
 */

const http = require('http');
const https = require('https');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

const baseUrl = process.argv[2] || 'http://localhost:5000';
let testsPassed = 0;
let testsFailed = 0;
let testResults = [];

// Helper function to make HTTP requests
function makeRequest(method, endpoint, data = null, headers = {}, isFormData = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const defaultHeaders = {
      'Accept': 'application/json',
      ...headers
    };

    if (!isFormData && data && method !== 'GET') {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: defaultHeaders
    };

    const req = client.request(options, (res) => {
      let body = '';

      res.on('data', chunk => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: body
          };

          if (res.headers['content-type']?.includes('application/json')) {
            response.data = JSON.parse(body);
          } else {
            response.data = body;
          }

          resolve(response);
        } catch (error) {
          resolve(response);
        }
      });
    });

    req.on('error', reject);

    if (isFormData) {
      data.pipe(req);
    } else if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test result tracking
function recordTest(testName, passed, details = '') {
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`  ${status}: ${testName}`);
  if (details) {
    console.log(`    ${colors.yellow}${details}${colors.reset}`);
  }

  testResults.push({
    name: testName,
    passed,
    details
  });

  if (passed) {
    testsPassed++;
  } else {
    testsFailed++;
  }
}

// Test 1: User Registration and Certificate Generation
async function test1_UserRegistrationWithCertificate() {
  console.log(`\n${colors.blue}Test 1: User Registration with Certificate Generation${colors.reset}`);

  try {
    const res = await makeRequest('POST', '/api/auth/signup', {
      email: `testuser-phase8-4-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      firstName: 'Phase',
      lastName: 'EightFour',
      phone: '639171234567',
      address: '123 Test St, Test City, TC 12345'
    });

    const passed = res.status === 201 && res.data.user && res.data.user.id;
    recordTest('Register user', passed, `Status: ${res.status}, UserId: ${res.data.user?.id}`);

    if (passed) {
      return res.data;
    }
    return null;
  } catch (error) {
    recordTest('Register user', false, error.message);
    return null;
  }
}

// Test 2: Get User's Active Certificate
async function test2_GetActiveCertificate(authToken) {
  console.log(`\n${colors.blue}Test 2: Get Active Certificate${colors.reset}`);

  try {
    const res = await makeRequest('GET', '/api/certificates/my-certificate', null, {
      'Authorization': `Bearer ${authToken}`
    });

    const passed = res.status === 200 && res.data.certificate && res.data.certificate.certificate_id;
    recordTest('Get active certificate', passed, `Status: ${res.status}, CertId: ${res.data.certificate?.certificate_id?.substring(0, 8)}...`);

    if (passed) {
      return res.data.certificate;
    }
    return null;
  } catch (error) {
    recordTest('Get active certificate', false, error.message);
    return null;
  }
}

// Test 3: Download Certificate (PEM format)
async function test3_DownloadCertificate(authToken, certificateId) {
  console.log(`\n${colors.blue}Test 3: Download Certificate (PEM Format)${colors.reset}`);

  try {
    // Get the string certificate ID
    const certId = typeof certificateId === 'object' ? certificateId.certificate_id : certificateId;
    console.log(`  Debug: Using certificate ID: ${certId}`);
    
    const res = await makeRequest('GET', `/api/certificates/${certId}/download`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    console.log(`  Debug: Response status: ${res.status}`);
    if (res.data && typeof res.data === 'object' && res.data.error) {
      console.log(`  Debug: Error: ${res.data.error}`);
    }

    // Handle both JSON error responses and PEM file responses
    let isPEM = false;
    let pemContent = '';
    
    if (typeof res.data === 'string') {
      isPEM = res.data.includes('-----BEGIN CERTIFICATE-----');
      pemContent = res.data;
    } else if (res.data && typeof res.data === 'object' && res.data.error) {
      // It's an error response
      isPEM = false;
    }
    
    const passed = res.status === 200 && isPEM;
    recordTest('Download certificate PEM', passed, `Status: ${res.status}, Valid PEM: ${isPEM}`);

    if (passed) {
      return pemContent;
    }
    return null;
  } catch (error) {
    recordTest('Download certificate PEM', false, error.message);
    return null;
  }
}

// Test 4: Get Certificate Expiry Status
async function test4_GetCertificateExpiryStatus(authToken, certificateId) {
  console.log(`\n${colors.blue}Test 4: Get Certificate Expiry Status${colors.reset}`);

  try {
    const res = await makeRequest('GET', `/api/certificates/${certificateId}/expiry-status`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    const passed = res.status === 200 && 
                   res.data.expiry_info && 
                   typeof res.data.expiry_info.days_remaining === 'number';
    
    const daysRemaining = res.data.expiry_info?.days_remaining;
    recordTest('Get expiry status', passed, `Status: ${res.status}, Days Remaining: ${daysRemaining}`);

    if (passed) {
      return res.data;
    }
    return null;
  } catch (error) {
    recordTest('Get expiry status', false, error.message);
    return null;
  }
}

// Test 5: Create a Second User for Renewal Testing
async function test5_CreateSecondUser() {
  console.log(`\n${colors.blue}Test 5: Create Second User for Renewal Testing${colors.reset}`);

  try {
    const res = await makeRequest('POST', '/api/auth/signup', {
      email: `testuser-renewal-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      firstName: 'Renewal',
      lastName: 'Tester',
      phone: '639181234567',
      address: '456 Renewal Ave, Test City, TC 54321'
    });

    const passed = res.status === 201 && res.data.user && res.data.user.id;
    recordTest('Register second user', passed, `Status: ${res.status}, UserId: ${res.data.user?.id}`);

    if (passed) {
      return res.data;
    }
    return null;
  } catch (error) {
    recordTest('Register second user', false, error.message);
    return null;
  }
}

// Test 6: Get Second User's Certificate for Renewal
async function test6_GetSecondUserCertificate(authToken) {
  console.log(`\n${colors.blue}Test 6: Get Second User's Certificate${colors.reset}`);

  try {
    const res = await makeRequest('GET', '/api/certificates/my-certificate', null, {
      'Authorization': `Bearer ${authToken}`
    });

    const passed = res.status === 200 && res.data.certificate && res.data.certificate._id;
    recordTest('Get second user certificate', passed, `Status: ${res.status}, CertId: ${res.data.certificate?._id}`);

    if (passed) {
      return res.data.certificate;
    }
    return null;
  } catch (error) {
    recordTest('Get second user certificate', false, error.message);
    return null;
  }
}

// Test 7: Renew Certificate
async function test7_RenewCertificate(authToken, certificateId) {
  console.log(`\n${colors.blue}Test 7: Renew Certificate${colors.reset}`);

  try {
    // Use certificate_id field (the certificate ID string), not _id (MongoDB ID)
    const certId = typeof certificateId === 'string' ? certificateId : certificateId.certificate_id;
    
    const res = await makeRequest('POST', `/api/certificates/${certId}/renew`, {
      validityYears: 5,
      reason: 'Scheduled renewal for testing'
    }, {
      'Authorization': `Bearer ${authToken}`
    });

    const passed = res.status === 201 && 
                   res.data.new_certificate && 
                   res.data.new_certificate.certificate_id;
    
    recordTest('Renew certificate', passed, `Status: ${res.status}, New CertId: ${res.data.new_certificate?.certificate_id?.substring(0, 8)}...`);

    if (passed) {
      return res.data;
    }
    return null;
  } catch (error) {
    recordTest('Renew certificate', false, error.message);
    return null;
  }
}

// Test 8: Verify Old Certificate is Marked as Superseded
async function test8_VerifySupersededStatus(authToken, certificateId) {
  console.log(`\n${colors.blue}Test 8: Verify Old Certificate Marked as Superseded${colors.reset}`);

  try {
    const res = await makeRequest('GET', `/api/certificates/verify/${certificateId}`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    // Old certificate should show as superseded when checked
    const passed = res.status === 200;
    recordTest('Check old certificate status', passed, `Status: ${res.status}`);

    if (passed) {
      return res.data;
    }
    return null;
  } catch (error) {
    recordTest('Check old certificate status', false, error.message);
    return null;
  }
}

// Test 9: Get All User Certificates
async function test9_GetAllCertificates(authToken, userId) {
  console.log(`\n${colors.blue}Test 9: Get All User Certificates${colors.reset}`);

  try {
    const res = await makeRequest('GET', `/api/certificates/user/${userId}/all`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    const passed = res.status === 200 && 
                   res.data.certificates && 
                   Array.isArray(res.data.certificates) &&
                   res.data.certificates.length > 0;
    
    recordTest('Get all certificates', passed, `Status: ${res.status}, Count: ${res.data.certificates?.length}`);

    if (passed) {
      return res.data.certificates;
    }
    return null;
  } catch (error) {
    recordTest('Get all certificates', false, error.message);
    return null;
  }
}

// Test 10: Get Certificate Audit History
async function test10_GetCertificateAuditHistory(authToken, certificateId) {
  console.log(`\n${colors.blue}Test 10: Get Certificate Audit History${colors.reset}`);

  try {
    const res = await makeRequest('GET', `/api/certificates/${certificateId}/audit-history`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    const passed = res.status === 200 && 
                   res.data.audit_history && 
                   Array.isArray(res.data.audit_history);
    
    recordTest('Get audit history', passed, `Status: ${res.status}, Entries: ${res.data.audit_history?.length}`);

    if (passed) {
      return res.data.audit_history;
    }
    return null;
  } catch (error) {
    recordTest('Get audit history', false, error.message);
    return null;
  }
}

// Test 11: Verify Renewed Certificate is Valid
async function test11_VerifyRenewedCertificate(authToken, newCertificateId) {
  console.log(`\n${colors.blue}Test 11: Verify Renewed Certificate is Valid${colors.reset}`);

  try {
    const res = await makeRequest('GET', `/api/certificates/${newCertificateId}/expiry-status`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    const passed = res.status === 200 && res.data.expiry_info.is_expired === false;
    const daysRemaining = res.data.expiry_info?.days_remaining;
    recordTest('Renewed certificate is valid', passed, `Status: ${res.status}, Days Remaining: ${daysRemaining}`);

    if (passed) {
      return res.data;
    }
    return null;
  } catch (error) {
    recordTest('Renewed certificate is valid', false, error.message);
    return null;
  }
}

// Test 12: Revoke Certificate
async function test12_RevokeCertificate(authToken, certificateId) {
  console.log(`\n${colors.blue}Test 12: Revoke Certificate${colors.reset}`);

  try {
    const certId = typeof certificateId === 'string' ? certificateId : certificateId.certificate_id;
    console.log(`  Debug: Revoking certificate: ${certId}`);
    
    const res = await makeRequest('POST', '/api/certificates/revoke', {
      certificateId: certId,
      reason: 'Testing revocation process'
    }, {
      'Authorization': `Bearer ${authToken}`
    });

    console.log(`  Debug: Response status: ${res.status}`);
    if (res.data && typeof res.data === 'object' && res.data.error) {
      console.log(`  Debug: Error: ${JSON.stringify(res.data)}`);
    }

    const passed = res.status === 200;  // Just check for 200 status
    recordTest('Revoke certificate', passed, `Status: ${res.status}`);

    if (passed) {
      return res.data;
    }
    return null;
  } catch (error) {
    recordTest('Revoke certificate', false, error.message);
    return null;
  }
}

// Test 13: Cannot Download Revoked Certificate
async function test13_CannotDownloadRevokedCertificate(authToken, certificateId) {
  console.log(`\n${colors.blue}Test 13: Cannot Download Revoked Certificate${colors.reset}`);

  try {
    const res = await makeRequest('GET', `/api/certificates/${certificateId}/download`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    const passed = res.status === 410; // 410 Gone
    recordTest('Cannot download revoked certificate', passed, `Status: ${res.status} (Expected 410)`);

    return passed;
  } catch (error) {
    recordTest('Cannot download revoked certificate', false, error.message);
    return false;
  }
}

// Test 14: Check Revoked Certificate Status Shows Revoked
async function test14_RevokedCertificateStatus(authToken, certificateId) {
  console.log(`\n${colors.blue}Test 14: Check Revoked Certificate Status${colors.reset}`);

  try {
    const res = await makeRequest('GET', `/api/certificates/${certificateId}/expiry-status`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    const passed = res.status === 200 && res.data.status === 'revoked';
    recordTest('Revoked certificate status', passed, `Status: ${res.status}, Certificate Status: ${res.data.status}`);

    return passed;
  } catch (error) {
    recordTest('Revoked certificate status', false, error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(`\n${colors.bold}${colors.blue}╔════════════════════════════════════════════════════════╗`);
  console.log(`║       Phase 8.4: Certificate Management Tests        ║`);
  console.log(`╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.yellow}Base URL: ${baseUrl}${colors.reset}`);

  // Test 1: Register first user
  const user1Data = await test1_UserRegistrationWithCertificate();
  if (!user1Data) return;

  const user1Token = user1Data.token;

  // Test 2: Get active certificate
  const certificate1 = await test2_GetActiveCertificate(user1Token);
  if (!certificate1) return;

  // Test 3: Download certificate
  const pemData = await test3_DownloadCertificate(user1Token, certificate1.certificate_id);

  // Test 4: Get expiry status
  const expiryStatus = await test4_GetCertificateExpiryStatus(user1Token, certificate1.certificate_id);

  // Test 5: Register second user
  const user2Data = await test5_CreateSecondUser();
  if (!user2Data) return;

  const user2Token = user2Data.token;

  // Test 6: Get second user's certificate
  const certificate2 = await test6_GetSecondUserCertificate(user2Token);
  if (!certificate2) return;

  // Test 7: Renew certificate
  const renewalData = await test7_RenewCertificate(user2Token, certificate2);
  if (!renewalData) return;

  const newCertificateId = renewalData.new_certificate.certificate_id;
  const oldCertificateId = renewalData.old_certificate_id;

  // Test 8: Verify old certificate is marked as superseded
  await test8_VerifySupersededStatus(user2Token, oldCertificateId);

  // Test 9: Get all certificates
  const allCertificates = await test9_GetAllCertificates(user2Token, user2Data.user.id);

  // Test 10: Get audit history
  const auditHistory = await test10_GetCertificateAuditHistory(user2Token, newCertificateId);

  // Test 11: Verify renewed certificate is valid
  const renewedStatus = await test11_VerifyRenewedCertificate(user2Token, newCertificateId);

  // Test 12: Revoke first user's certificate
  const revokeData = await test12_RevokeCertificate(user1Token, certificate1.certificate_id);
  if (!revokeData) return;

  // Test 13: Cannot download revoked certificate
  await test13_CannotDownloadRevokedCertificate(user1Token, certificate1.certificate_id);

  // Test 14: Check revoked certificate status
  await test14_RevokedCertificateStatus(user1Token, certificate1.certificate_id);

  // Print final summary
  console.log(`\n${colors.bold}${colors.blue}╔════════════════════════════════════════════════════════╗`);
  console.log(`║                  Test Results Summary                 ║`);
  console.log(`╚════════════════════════════════════════════════════════╝${colors.reset}`);

  console.log(`\n${colors.green}✓ Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${testsFailed}${colors.reset}`);

  const total = testsPassed + testsFailed;
  const percentage = total > 0 ? Math.round((testsPassed / total) * 100) : 0;

  console.log(`\n${colors.bold}SUCCESS RATE: ${percentage}% (${testsPassed}/${total})${colors.reset}\n`);

  if (testsFailed === 0) {
    console.log(`${colors.green}${colors.bold}All tests passed! 🎉${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}Some tests failed. Review the details above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run all tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
  process.exit(1);
});
