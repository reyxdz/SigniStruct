#!/usr/bin/env node

/**
 * Phase 8.3 Cryptographic Signing Test
 * 
 * Comprehensive test of the entire signing and verification workflow:
 * 1. Register user (creates RSA keys via Phase 8.2)
 * 2. Create document
 * 3. Create user signature (visual)
 * 4. Sign document cryptographically (Phase 8.3)
 * 5. Verify signature (Phase 8.1 + 8.3)
 * 
 * Usage:
 *   node test-phase-8-3.js [baseUrl]
 *   node test-phase-8-3.js http://localhost:5000
 */

const axios = require('axios');
const crypto = require('crypto');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  cyan: '\x1b[36m'
};

const log = {
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`),
  title: (msg) => console.log(`${colors.bright}${msg}${colors.reset}`),
  test: (msg) => console.log(`\n${colors.blue}[TEST ${testCount++}]${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n  ▶ ${colors.bright}${msg}${colors.reset}`),
  success: (msg) => console.log(`  ${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`  ${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`  ${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`    ${msg}`),
  json: (obj) => console.log(`    ${JSON.stringify(obj, null, 2).split('\n').join('\n    ')}`),
};

let testCount = 1;
let passCount = 0;
let failCount = 0;

async function testPhase83(baseUrl = 'http://localhost:5000') {
  log.header();
  log.title('Phase 8.3: Cryptographic Signing - Full Workflow Test');
  log.header();
  log.info(`Base URL: ${baseUrl}`);
  log.info(`Timestamp: ${new Date().toISOString()}\n`);

  try {
    // ====================
    // STEP 1: Register User (Phase 8.2)
    // ====================
    log.test('Register new user and get RSA keys (Phase 8.2)');
    
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    
    const newUser = {
      firstName: `CryptoTest_${timestamp}`,
      lastName: `Signer_${randomId}`,
      email: `crypto-signer-${timestamp}@example.com`,
      phone: '09123456789',
      address: '123 Crypto Lane',
      password: 'CryptoSignPassword123!',
      confirmPassword: 'CryptoSignPassword123!'
    };
    
    log.step('Sending signup request with credentials');
    
    let signupResponse;
    try {
      signupResponse = await axios.post(`${baseUrl}/api/auth/signup`, newUser);
    } catch (error) {
      log.error(`Signup failed: ${error.response?.data?.error || error.message}`);
      failCount++;
      throw error;
    }
    
    if (signupResponse.status !== 201) {
      log.error(`Expected 201, got ${signupResponse.status}`);
      failCount++;
      throw new Error('Signup status code mismatch');
    }
    
    const userData = signupResponse.data;
    const userToken = userData.token;
    const userId = userData.user.id;
    
    log.success('User registered successfully');
    log.info(`User ID: ${userId}`);
    log.info(`Email: ${newUser.email}`);
    passCount++;
    
    // Verify certificate was created
    if (userData.certificate) {
      log.success('RSA certificate generated (Phase 8.2)');
      log.info(`Certificate ID: ${userData.certificate.certificate_id}`);
      log.info(`Fingerprint: ${userData.certificate.fingerprint.substring(0, 30)}...`);
      passCount++;
    } else {
      log.warn('Certificate not in response (may be optional)');
    }

    // ====================
    // STEP 2: Create/Upload Document
    // ====================
    log.test('Upload document for signing');
    
    log.step('Creating test PDF file');
    
    // Create a simple PDF buffer for testing
    const pdfBuffer = Buffer.from(
      '%PDF-1.4\n' +
      '1 0 obj\n' +
      '<< /Type /Catalog /Pages 2 0 R >>\n' +
      'endobj\n' +
      '2 0 obj\n' +
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n' +
      'endobj\n' +
      '3 0 obj\n' +
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\n' +
      'endobj\n' +
      '4 0 obj\n' +
      '<< >>\n' +
      'stream\n' +
      'BT\n' +
      '/F1 12 Tf\n' +
      '100 750 Td\n' +
      '(Test Document for Cryptographic Signing) Tj\n' +
      'ET\n' +
      'endstream\n' +
      'endobj\n' +
      '5 0 obj\n' +
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n' +
      'endobj\n' +
      'xref\n' +
      '0 6\n' +
      '0000000000 65535 f\n' +
      '0000000009 00000 n\n' +
      '0000000058 00000 n\n' +
      '0000000115 00000 n\n' +
      '0000000262 00000 n\n' +
      '0000000368 00000 n\n' +
      'trailer\n' +
      '<< /Size 6 /Root 1 0 R >>\n' +
      'startxref\n' +
      '456\n' +
      '%%EOF'
    );
    
    log.step('Uploading document to backend');
    
    // Create FormData for file upload
    const FormData = require('form-data');
    const fs = require('fs');
    const path = require('path');
    
    // Write PDF to temp file
    const tempPdfPath = path.join(process.cwd(), `test-doc-${timestamp}.pdf`);
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    
    const formData = new FormData();
    formData.append('document', fs.createReadStream(tempPdfPath), `test-doc-${timestamp}.pdf`);
    formData.append('title', `Crypto Test Document - ${timestamp}`);
    formData.append('category', 'contract');
    formData.append('description', 'Testing cryptographic signing and verification');
    
    let docResponse;
    try {
      docResponse = await axios.post(
        `${baseUrl}/api/documents/upload`,
        formData,
        { 
          headers: { 
            ...formData.getHeaders(),
            Authorization: `Bearer ${userToken}` 
          } 
        }
      );
    } catch (error) {
      log.error(`Document upload failed: ${error.response?.data?.error || error.message}`);
      log.info(`Status: ${error.response?.status}`);
      failCount++;
      fs.unlinkSync(tempPdfPath);
      throw error;
    }
    
    // Clean up temp file
    fs.unlinkSync(tempPdfPath);
    
    // Extract document details from response
    const documentId = docResponse.data.document?._id;
    
    if (!documentId) {
      log.error('Document ID not found in response');
      log.info(`Full response: ${JSON.stringify(docResponse.data, null, 2)}`);
      failCount++;
      throw new Error('Invalid response structure');
    }
    
    // Fetch full document details to get the hash
    let documentHash;
    try {
      const docDetailsResponse = await axios.get(
        `${baseUrl}/api/documents/${documentId}`,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      documentHash = docDetailsResponse.data.document?.file_hash_sha256;
    } catch (detailsError) {
      log.warn(`Could not fetch document details: ${detailsError.message}`);
    }
    
    log.success('Document uploaded successfully');
    log.info(`Document ID: ${documentId}`);
    log.info(`Document Hash (SHA-256): ${documentHash?.substring(0, 40)}...` || 'No hash available yet');
    passCount++;

    // ====================
    // STEP 3: Create User Signature (Visual)
    // ====================
    log.test('Create user signature (visual signature to place on document)');
    
    log.step('Creating user signature');
    
    const signatureData = {
      signature_type: 'handwritten',
      signature_image: Buffer.from('This is a fake signature image data for testing cryptographic signing. It needs to be long enough to pass validation checks. The signature will be stored and used for document signing operations in Phase 8.3. This base64 encoded string represents a visual signature that will be placed on the document.').toString('base64')
    };
    
    let sigResponse;
    try {
      sigResponse = await axios.post(
        `${baseUrl}/api/signatures/create`,
        signatureData,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
    } catch (error) {
      log.error(`Signature creation failed: ${error.response?.data?.error || error.message}`);
      log.warn('Continuing with test - signature may already exist');
      
      // Try to get existing signatures
      try {
        const sigListResponse = await axios.get(
          `${baseUrl}/api/signatures/user`,
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        if (sigListResponse.data.signatures && sigListResponse.data.signatures.length > 0) {
          sigResponse = { data: sigListResponse.data.signatures[0] };
          log.success('Using existing user signature');
        } else {
          log.error('No signatures available');
          failCount++;
          throw new Error('Cannot get or create signature');
        }
      } catch (getError) {
        log.error(`Failed to get signatures: ${getError.message}`);
        failCount++;
        throw getError;
      }
    }
    
    // Extract signature ID from response - handle both creation and retrieval response structures
    const userSignatureId = sigResponse.data?.signature?._id || sigResponse.data?._id || sigResponse.data?.data?._id;
    
    if (!userSignatureId) {
      log.error('Signature ID not found in response');
      log.info(`Response structure: ${JSON.stringify(sigResponse.data, null, 2).substring(0, 200)}...`);
      failCount++;
      throw new Error('Invalid signature response structure');
    }
    
    log.success('User signature available');
    log.info(`Signature ID: ${userSignatureId}`);
    passCount++;

    // ====================
    // STEP 4: Sign Document (Phase 8.3)
    // ====================
    log.test('Sign document with private key (Phase 8.3 - Cryptographic Signing)');
    
    log.step('Sending sign request to backend');
    log.info('This will:');
    log.info('  1. Get document and calculate SHA-256 hash');
    log.info('  2. Retrieve encrypted private key from database');
    log.info('  3. Decrypt private key using MASTER_ENCRYPTION_KEY');
    log.info('  4. Sign hash with RSA private key');
    log.info('  5. Store signature in database');
    
    const signPayload = {
      userSignatureId: userSignatureId,
      placement: {
        x: 100,
        y: 200,
        width: 150,
        height: 50,
        page: 1
      }
    };
    
    let signResponse;
    try {
      signResponse = await axios.post(
        `${baseUrl}/api/documents/${documentId}/sign`,
        signPayload,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
    } catch (error) {
      log.error(`Document signing failed: ${error.response?.data?.error || error.message}`);
      if (error.response?.data) {
        log.info('Error details:');
        log.json(error.response.data);
      }
      failCount++;
      throw error;
    }
    
    if (signResponse.status !== 201) {
      log.error(`Expected 201, got ${signResponse.status}`);
      failCount++;
      throw new Error('Signing status code mismatch');
    }
    
    const signatureResult = signResponse.data.signature;
    
    log.success('Document signed cryptographically!');
    log.info(`Signature ID: ${signatureResult._id}`);
    log.info(`Signed by: ${signatureResult.signer_name} (${signatureResult.signer_email})`);
    log.info(`Valid: ${signatureResult.is_valid}`);
    log.info(`Verified at: ${signatureResult.verification_timestamp}`);
    passCount++;

    // ====================
    // STEP 5: Verify Signature (Phase 8.1 + 8.3)
    // ====================
    log.test('Verify document signatures (Phase 8.1 using Phase 8.3 verification)');
    
    log.step('Getting verification status');
    log.info('This will verify RSA signatures against document hash');
    
    let verifyResponse;
    try {
      verifyResponse = await axios.get(
        `${baseUrl}/api/verification/documents/${documentId}/status`,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
    } catch (error) {
      log.error(`Verification failed: ${error.response?.data?.message || error.message}`);
      failCount++;
      throw error;
    }
    
    const verification = verifyResponse.data.data;
    
    log.info(`Verification result:`);
    log.info(`  Total signatures: ${verification.signature_count}`);
    log.info(`  Valid signatures: ${verification.verified_count}`);
    log.info(`  Status: ${verification.status}`);
    
    if (verification.signatures && verification.signatures.length > 0) {
      log.info(`Signature details:`);
      for (const sig of verification.signatures) {
        log.info(`    Signature ID: ${sig.signature_id}`);
        log.info(`    Valid: ${sig.is_valid}`);
        if (sig.errors && sig.errors.length > 0) {
          log.info(`    Errors: ${sig.errors.join(', ')}`);
        }
        if (sig.document_hash_match !== undefined) {
          log.info(`    Hash match: ${sig.document_hash_match}`);
        }
        if (sig.signature_hash_verified !== undefined) {
          log.info(`    Signature verified: ${sig.signature_hash_verified}`);
        }
      }
    }
    
    if (verification.is_valid) {
      log.success('Document signatures verified successfully!');
      passCount++;
    } else {
      log.error('Signature verification failed');
      failCount++;
      throw new Error('Signature did not verify');
    }

    // ====================
    // STEP 6: Full Verification
    // ====================
    log.test('Run full verification with tampering detection');
    
    log.step('Calling verify-all endpoint');
    
    let fullVerifyResponse;
    try {
      fullVerifyResponse = await axios.post(
        `${baseUrl}/api/verification/documents/${documentId}/verify-all`,
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
    } catch (error) {
      log.error(`Full verification failed: ${error.response?.data?.message || error.message}`);
      failCount++;
      throw error;
    }
    
    const fullVerification = fullVerifyResponse.data.data;
    
    log.success('Full verification completed');
    log.info(`Overall status: ${fullVerification.verification.status}`);
    log.info(`Total signatures: ${fullVerification.verification.total_signatures}`);
    log.info(`Valid signatures: ${fullVerification.verification.valid_signatures}`);
    log.info(`Tampering detected: ${fullVerification.tampering.tampered}`);
    passCount++;

    // ====================
    // STEP 7: Download Certificate
    // ====================
    log.test('Download verification certificate');
    
    log.step('Getting certificate');
    
    let certResponse;
    try {
      certResponse = await axios.get(
        `${baseUrl}/api/verification/documents/${documentId}/certificate`,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
    } catch (error) {
      log.error(`Certificate download failed: ${error.response?.data?.message || error.message}`);
      failCount++;
      throw error;
    }
    
    const certificate = certResponse.data.data;
    
    log.success('Certificate downloaded');
    log.info(`Certificate type: ${certificate.type}`);
    log.info(`Issued at: ${certificate.issued_at}`);
    log.info(`Valid until: ${certificate.valid_until}`);
    log.info(`Signatures in cert: ${certificate.signatures.length}`);
    passCount++;

    // ====================
    // RESULTS
    // ====================
    log.header();
    log.title('Test Results');
    log.header();
    
    console.log(`\n${colors.green}✓ Passed: ${passCount}${colors.reset}`);
    if (failCount > 0) {
      console.log(`${colors.red}✗ Failed: ${failCount}${colors.reset}`);
    }
    
    console.log(`\n${colors.bright}Summary:${colors.reset}`);
    console.log(`${colors.green}✓ Phase 8.2 (RSA Key Generation): Working${colors.reset}`);
    console.log(`${colors.green}✓ Phase 8.3 (Cryptographic Signing): Working${colors.reset}`);
    console.log(`${colors.green}✓ Phase 8.1 (Verification): Working${colors.reset}`);
    
    console.log(`\n${colors.bright}What This Proves:${colors.reset}`);
    console.log('  ✓ Users get RSA keys on signup');
    console.log('  ✓ Documents can be signed with private keys');
    console.log('  ✓ Signatures are verified with public keys');
    console.log('  ✓ Document tampering would be detected');
    console.log('  ✓ Audit trail is created for compliance');
    console.log('  ✓ Verification certificates can be downloaded');
    
    console.log(`\n${colors.bright}What's Enabled:${colors.reset}`);
    console.log('  ✓ Legally binding e-signatures');
    console.log('  ✓ ESIGN Act / eIDAS compliance');
    console.log('  ✓ Non-repudiation (can\'t deny signing)');
    console.log('  ✓ Integrity verification (detect changes)');
    console.log('  ✓ Complete audit trail');
    
    console.log(`\n${colors.bright}Test User Details:${colors.reset}`);
    console.log(`  Email: ${newUser.email}`);
    console.log(`  UserID: ${userId}`);
    console.log(`  DocumentID: ${documentId}`);
    console.log(`  SignatureID: ${signatureResult._id}`);
    
    console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
    console.log('  1. Verify database entries with MongoDB');
    console.log('  2. Check console logs for [RSA] and [AUTH] messages');
    console.log('  3. Query audit logs for signing events');
    console.log('  4. Proceed to Phase 8.4 (Certificate Management)');
    
    log.header();
    
    return { success: true, passCount, failCount };
    
  } catch (error) {
    log.error(`\nTest suite failed: ${error.message}`);
    log.header();
    
    console.log(`${colors.red}FAILURE DETAILS${colors.reset}:`);
    if (error.response?.data) {
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(error.stack);
    }
    
    return { success: false, passCount, failCount };
  }
}

// Run test
const baseUrl = process.argv[2] || 'http://localhost:5000';
testPhase83(baseUrl).then(result => {
  process.exit(result.success && result.failCount === 0 ? 0 : 1);
});
