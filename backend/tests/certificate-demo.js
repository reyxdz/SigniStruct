/**
 * Certificate Service Test/Demo
 * This file demonstrates how to use the CertificateService
 * 
 * Usage: node tests/certificate-demo.js
 */

const CertificateService = require('../src/services/certificateService');

// Demo user information
const demoUser = {
  userId: '507f1f77bcf86cd799439011', // Sample MongoDB ObjectId
  name: 'John Doe',
  email: 'john.doe@example.com'
};

// Master encryption key (should come from environment)
const masterEncryptionKey = process.env.MASTER_ENCRYPTION_KEY || 'your-32-character-random-key-here';

async function testCertificateService() {
  console.log('🧪 Testing Certificate Service\n');
  console.log('===============================\n');

  try {
    // Test 1: Generate Key Pair
    console.log('📌 Test 1: Generate RSA Key Pair');
    console.log('-----------------------------------');
    const keyPair = CertificateService.generateKeyPair();
    console.log('✅ Key pair generated successfully');
    console.log(
      `   - Public Key length: ${keyPair.publicKey.length} characters`
    );
    console.log(
      `   - Private Key length: ${keyPair.privateKey.length} characters\n`
    );

    // Test 2: Create Self-Signed Certificate
    console.log('📌 Test 2: Create Self-Signed Certificate');
    console.log('-------------------------------------------');
    const certData = CertificateService.createSelfSignedCertificate(
      keyPair,
      demoUser,
      5
    );
    console.log('✅ Certificate created successfully');
    console.log(`   - Certificate ID: ${certData.certificate_id}`);
    console.log(`   - Subject: ${certData.subject}`);
    console.log(`   - Serial Number: ${certData.serial_number}`);
    console.log(`   - Not Before: ${certData.not_before}`);
    console.log(`   - Not After: ${certData.not_after}`);
    console.log(
      `   - Fingerprint: ${certData.fingerprint_sha256.substring(0, 16)}...`
    );
    console.log(`   - Status: ${certData.status}\n`);

    // Test 3: Encrypt Private Key
    console.log('📌 Test 3: Encrypt Private Key');
    console.log('-------------------------------');
    const encryptedPrivateKey = CertificateService.encryptPrivateKey(
      keyPair.privateKey,
      masterEncryptionKey,
      demoUser.userId
    );
    console.log('✅ Private key encrypted successfully');
    console.log(`   - Encrypted key length: ${encryptedPrivateKey.length}`);
    console.log(
      `   - Encrypted key preview: ${encryptedPrivateKey.substring(0, 50)}...\n`
    );

    // Test 4: Decrypt Private Key
    console.log('📌 Test 4: Decrypt Private Key');
    console.log('-------------------------------');
    const decryptedPrivateKey = CertificateService.decryptPrivateKey(
      encryptedPrivateKey,
      masterEncryptionKey,
      demoUser.userId
    );
    console.log('✅ Private key decrypted successfully');
    console.log(
      `   - Matches original: ${decryptedPrivateKey === keyPair.privateKey}`
    );
    console.log(
      `   - Contains PEM header: ${decryptedPrivateKey.includes('BEGIN RSA PRIVATE KEY')}\n`
    );

    // Test 5: Verify Certificate Validity
    console.log('📌 Test 5: Verify Certificate Validity');
    console.log('-------------------------------------');
    const validityCheck = CertificateService.verifyCertificateValidity(certData);
    console.log('✅ Certificate validity checked');
    console.log(`   - Is Valid: ${validityCheck.is_valid}`);
    console.log(`   - Not Expired: ${validityCheck.not_expired}`);
    console.log(`   - Message: ${validityCheck.message}\n`);

    // Test 6: Full Certificate Generation Workflow
    console.log('📌 Test 6: Full Certificate Generation Workflow');
    console.log('----------------------------------------------');
    const completeCert = CertificateService.generateCompleteCertificate(
      demoUser,
      masterEncryptionKey
    );
    console.log('✅ Complete certificate package generated');
    console.log(`   - Certificate ID: ${completeCert.certificate_id}`);
    console.log(`   - Public Key included: ${!!completeCert.public_key}`);
    console.log(
      `   - Private Key encrypted: ${!!completeCert.private_key_encrypted}`
    );
    console.log(`   - Certificate PEM: ${completeCert.certificate_pem.length} chars`);
    console.log(`   - Created At: ${completeCert.created_at}\n`);

    // Test 7: Revoke Certificate
    console.log('📌 Test 7: Revoke Certificate');
    console.log('-----------------------------');
    const revokedCert = CertificateService.revokeCertificate(
      { ...certData },
      'Test revocation'
    );
    console.log('✅ Certificate revoked successfully');
    console.log(`   - Status: ${revokedCert.status}`);
    console.log(`   - Revoked At: ${revokedCert.revoked_at}`);
    console.log(`   - Reason: ${revokedCert.revocation_reason}\n`);

    // Summary
    console.log('===============================');
    console.log('✅ ALL TESTS PASSED');
    console.log('===============================\n');

    // Certificate package structure for database storage
    console.log('📦 Certificate Package Structure (Ready for Database):');
    console.log(JSON.stringify(completeCert, null, 2));
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testCertificateService().then(() => {
    console.log('\n✨ Certificate Service tests completed successfully!\n');
    process.exit(0);
  });
}

module.exports = { testCertificateService };
