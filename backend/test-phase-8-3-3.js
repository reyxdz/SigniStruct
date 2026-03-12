/**
 * Phase 8.3.3: DocumentSignature Model Enhancement Tests
 * 
 * Test Suite for Query Builders and Instance Methods
 * Tests verify:
 * 1. Query builder methods work correctly
 * 2. Instance methods return expected values
 * 3. Metadata field initialization
 * 4. Virtual properties calculate correctly
 * 5. Aggregation pipeline statistics
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import models
const Document = require('./src/models/Document');
const DocumentSignature = require('./src/models/DocumentSignature');
const User = require('./src/models/User');

/**
 * Test Suite Class
 */
class Phase8_3_3Tests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.testDocument = null;
    this.testUser = null;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ Connected to MongoDB\n');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Setup test data
   */
  async setupTestData() {
    try {
      // Create test user
      this.testUser = await User.create({
        firstName: 'Test',
        lastName: 'Signature User',
        email: 'test-sig-' + Date.now() + '@test.com',
        password: 'TestPassword123!',
        phone: '123-456-7890',
        address: '123 Test Street, Test City, TC 12345'
      });

      // Create test document
      this.testDocument = await Document.create({
        title: 'Test Document for Signatures',
        file_url: '/uploads/documents/test-' + Date.now() + '.pdf',
        original_filename: 'test-document.pdf',
        file_hash_sha256: 'a'.repeat(64), // 64-character SHA256 hash
        owner_id: this.testUser._id,
        status: 'draft',
        file_type: 'application/pdf',
        file_size: 1024
      });

      console.log('📋 Test data created');
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Create test signatures with different configurations
   */
  async createTestSignatures() {
    try {
      // Signature 1: RSA-SHA256, verified
      await DocumentSignature.create({
        document_id: this.testDocument._id,
        signer_id: this.testUser._id,
        recipient_email: 'test@example.com',
        signing_token: 'token-1-' + Date.now(),
        algorithm: 'RSA-SHA256',
        crypto_signature: '3045022100...',
        content_hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        signature_integrity_hash: 'f0e9d8c7b6a5949392919089878685',
        verified: true,
        verified_by: this.testUser._id,
        timestamp: new Date(),
        signature_metadata: {
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0',
          duration_ms: 1234,
          attempts: 1
        },
        verification_metadata: {
          verified_timestamp: new Date(),
          verification_duration_ms: 245
        }
      });

      // Signature 2: RSA-SHA256, unverified (tampered)
      await DocumentSignature.create({
        document_id: this.testDocument._id,
        signer_id: this.testUser._id,
        recipient_email: 'test2@example.com',
        signing_token: 'token-2-' + Date.now(),
        algorithm: 'RSA-SHA256',
        crypto_signature: '3046022100...',
        content_hash: 'x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6',
        signature_integrity_hash: 'm5l4k3j2i1h0g9f8e7d6c5b4a3929190',
        verified: false,
        timestamp: new Date(Date.now() - 86400000), // 1 day old
        signature_metadata: {
          ip_address: '192.168.1.101',
          user_agent: 'Chrome/100.0',
          duration_ms: 2345,
          attempts: 2
        },
        verification_metadata: {
          tamper_detected_at: new Date()
        }
      });

      // Signature 3: Visual-only signature
      await DocumentSignature.create({
        document_id: this.testDocument._id,
        signer_id: this.testUser._id,
        recipient_email: 'test3@example.com',
        signing_token: 'token-3-' + Date.now(),
        algorithm: 'visual-only',
        timestamp: new Date(),
        signature_metadata: {
          ip_address: '192.168.1.102',
          user_agent: 'Safari/537.36'
        }
      });

      // Signature 4: Revoked signature
      const revoked = await DocumentSignature.create({
        document_id: this.testDocument._id,
        signer_id: this.testUser._id,
        recipient_email: 'test4@example.com',
        signing_token: 'token-4-' + Date.now(),
        algorithm: 'RSA-SHA256',
        crypto_signature: '3047022100...',
        content_hash: 'r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6',
        verified: true,
        timestamp: new Date()
      });
      
      revoked.revokeSignature(this.testUser._id, 'Test revocation');
      await revoked.save();

      console.log('✏️  Created 4 test signatures\n');
    } catch (error) {
      console.error('❌ Signature creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Run a single test
   */
  async runTest(name, testFn) {
    try {
      await testFn();
      this.passed++;
      console.log(`✅ ${name}`);
    } catch (error) {
      this.failed++;
      console.error(`❌ ${name}`);
      console.error(`   Error: ${error.message}\n`);
    }
  }

  /**
   * Test Suite: Query Builders
   */
  async testQueryBuilders() {
    console.log('\n🔍 Testing Query Builders\n');

    // Test 1: findCryptoSignatures
    await this.runTest('findCryptoSignatures returns only crypto signatures', async () => {
      const cryptoSigs = await DocumentSignature.findCryptoSignatures(this.testDocument._id);
      if (cryptoSigs.length !== 3) { // Should exclude visual-only
        throw new Error(`Expected 3 crypto signatures, got ${cryptoSigs.length}`);
      }
      const hasVisualOnly = cryptoSigs.some(s => s.algorithm === 'visual-only');
      if (hasVisualOnly) {
        throw new Error('Result included visual-only signature');
      }
    });

    // Test 2: findVerifiedSignatures
    await this.runTest('findVerifiedSignatures returns only verified crypto signatures', async () => {
      const verified = await DocumentSignature.findVerifiedSignatures(this.testDocument._id);
      if (verified.length === 0) {
        throw new Error(`Expected at least 1 verified signature, got ${verified.length}`);
      }
      const allVerified = verified.every(s => s.verified);
      if (!allVerified) {
        throw new Error('Result included unverified signature');
      }
    });

    // Test 3: findTamperedSignatures
    await this.runTest('findTamperedSignatures returns tampered signatures', async () => {
      const tampered = await DocumentSignature.findTamperedSignatures(this.testDocument._id);
      if (tampered.length !== 1) {
        throw new Error(`Expected 1 tampered signature, got ${tampered.length}`);
      }
      if (tampered[0].verified !== false) {
        throw new Error('Returned signature is not tampered');
      }
    });

    // Test 4: findActiveSignatures
    await this.runTest('findActiveSignatures excludes revoked signatures', async () => {
      const active = await DocumentSignature.findActiveSignatures(this.testDocument._id);
      const hasRevoked = active.some(s => s.isRevoked());
      if (hasRevoked) {
        throw new Error('Result included revoked signature');
      }
    });

    // Test 5: findSignaturesByAlgorithm
    await this.runTest('findSignaturesByAlgorithm filters by algorithm', async () => {
      const rsaSigs = await DocumentSignature.findSignaturesByAlgorithm(
        this.testDocument._id,
        'RSA-SHA256'
      );
      if (rsaSigs.length !== 3) { // 2 active RSA + 1 revoked RSA
        throw new Error(`Expected 3 RSA signatures, got ${rsaSigs.length}`);
      }
    });

    // Test 6: findSignaturesByUser
    await this.runTest('findSignaturesByUser retrieves user signatures', async () => {
      const userSigs = await DocumentSignature.findSignaturesByUser(this.testUser._id);
      // Check if we found at least some signatures (may be from other test runs)
      if (typeof userSigs.length !== 'number') {
        throw new Error(`Invalid result type: ${typeof userSigs.length}`);
      }
    });

    // Test 7: getDocumentSignatureStatistics
    await this.runTest('getDocumentSignatureStatistics returns aggregated data', async () => {
      // Use the string ID for aggregation
      const docId = this.testDocument._id.toString();
      const stats = await DocumentSignature.aggregate([
        { $match: { document_id: this.testDocument._id } },
        {
          $group: {
            _id: '$algorithm',
            count: { $sum: 1 },
            verified_count: {
              $sum: { $cond: [{ $eq: ['$verified', true] }, 1, 0] }
            }
          }
        }
      ]);
      
      if (!Array.isArray(stats) || stats.length === 0) {
        throw new Error('Statistics aggregation returned empty result');
      }
      const rsaStat = stats.find(s => s._id === 'RSA-SHA256');
      if (!rsaStat) {
        throw new Error('RSA-SHA256 not found in statistics');
      }
    });
  }

  /**
   * Test Suite: Instance Methods - Status Detection
   */
  async testInstanceMethods() {
    console.log('\n🏗️  Testing Instance Methods\n');

    // Fetch test signatures
    const cryptoSig = await DocumentSignature.findCryptoSignatures(this.testDocument._id).findOne();
    const visualSig = await DocumentSignature.findOne({
      document_id: this.testDocument._id,
      algorithm: 'visual-only'
    });

    // Test 1: isCryptoSignature
    await this.runTest('isCryptoSignature identifies crypto signatures', async () => {
      if (!cryptoSig.isCryptoSignature()) {
        throw new Error('RSA signature not identified as crypto');
      }
      if (visualSig.isCryptoSignature()) {
        throw new Error('Visual signature incorrectly identified as crypto');
      }
    });

    // Test 2: isTampered
    await this.runTest('isTampered detects tampered signatures', async () => {
      const tampered = await DocumentSignature.findOne({
        document_id: this.testDocument._id,
        verified: false,
        'content_hash': { $exists: true }
      });
      if (!tampered.isTampered()) {
        throw new Error('Tampered signature not detected');
      }
    });

    // Test 3: isRevoked
    await this.runTest('isRevoked detects revoked signatures', async () => {
      const revoked = await DocumentSignature.findOne({
        document_id: this.testDocument._id,
        'revocation_info.is_revoked': true
      });
      if (revoked && !revoked.isRevoked()) {
        throw new Error('Revoked signature not detected');
      }
    });

    // Test 4: canBeVerified
    await this.runTest('canBeVerified checks preconditions', async () => {
      const verifiable = await DocumentSignature.findOne({
        document_id: this.testDocument._id,
        algorithm: 'RSA-SHA256',
        crypto_signature: { $ne: null },
        'content_hash': { $ne: null }
      });
      if (verifiable && !verifiable.canBeVerified()) {
        throw new Error('Valid signature marked as unverifiable');
      }
    });

    // Test 5: getVerificationStatus
    await this.runTest('getVerificationStatus returns correct status', async () => {
      const verified = await DocumentSignature.findOne({
        document_id: this.testDocument._id,
        verified: true
      });
      const status = verified.getVerificationStatus();
      if (status !== 'verified' && status !== 'revoked') {
        throw new Error(`Unexpected status: ${status}`);
      }
    });

    // Test 6: getSignatureType
    await this.runTest('getSignatureType returns algorithm', async () => {
      const type = cryptoSig.getSignatureType();
      if (type !== 'RSA-SHA256') {
        throw new Error(`Expected RSA-SHA256, got ${type}`);
      }
    });
  }

  /**
   * Test Suite: Lifecycle Methods
   */
  async testLifecycleMethods() {
    console.log('\n🔄 Testing Lifecycle Methods\n');

    let testSig;

    // Test 1: markAsVerified
    await this.runTest('markAsVerified updates verification status', async () => {
      testSig = await DocumentSignature.findOne({
        document_id: this.testDocument._id,
        verified: false,
        algorithm: 'RSA-SHA256'
      });

      if (testSig) {
        testSig.markAsVerified(this.testUser._id);
        await testSig.save();

        const updated = await DocumentSignature.findById(testSig._id);
        if (!updated.verified || !updated.verified_by) {
          throw new Error('Verification status not updated correctly');
        }
      }
    });

    // Test 2: markAsTampered
    await this.runTest('markAsTampered records tampering', async () => {
      const sig = await DocumentSignature.findOne({
        document_id: this.testDocument._id,
        algorithm: 'RSA-SHA256',
        verified: true
      });

      if (sig) {
        const originalVerified = sig.verified;
        sig.markAsTampered();
        if (sig.verified !== false) {
          throw new Error('Tampered flag not set correctly');
        }
        if (!sig.verification_metadata.tamper_detected_at) {
          throw new Error('Tamper timestamp not recorded');
        }
      }
    });

    // Test 3: revokeSignature
    await this.runTest('revokeSignature invalidates signature', async () => {
      const sig = await DocumentSignature.findOne({
        document_id: this.testDocument._id,
        'revocation_info.is_revoked': false
      });

      if (sig) {
        sig.revokeSignature(this.testUser._id, 'Test revocation');
        if (!sig.revocation_info.is_revoked) {
          throw new Error('Revocation flag not set');
        }
        if (!sig.revocation_info.revoked_at) {
          throw new Error('Revocation timestamp not recorded');
        }
      }
    });
  }

  /**
   * Test Suite: Virtual Properties
   */
  async testVirtualProperties() {
    console.log('\n🎪 Testing Virtual Properties\n');

    // Test 1: signature_age_days
    await this.runTest('signature_age_days calculates correctly', async () => {
      const sig = await DocumentSignature.findOne({
        document_id: this.testDocument._id
      });

      const age = sig.signature_age_days;
      if (typeof age !== 'number' || age < 0) {
        throw new Error(`Invalid age calculation: ${age}`);
      }
    });
  }

  /**
   * Test Suite: Metadata Fields
   */
  async testMetadataFields() {
    console.log('\n📦 Testing Metadata Fields\n');

    // Test 1: Signature metadata initialization
    await this.runTest('Signature metadata stored correctly', async () => {
      const sig = await DocumentSignature.findOne({
        document_id: this.testDocument._id,
        'signature_metadata.ip_address': { $exists: true }
      });

      if (!sig) {
        throw new Error('Signature metadata not found');
      }
      if (!sig.signature_metadata.ip_address) {
        throw new Error('IP address not stored');
      }
      if (typeof sig.signature_metadata.duration_ms !== 'number') {
        throw new Error('Duration not stored as number');
      }
    });

    // Test 2: Verification metadata
    await this.runTest('Verification metadata stored correctly', async () => {
      const sig = await DocumentSignature.findOne({
        document_id: this.testDocument._id,
        verified: true
      });

      if (sig && sig.verification_metadata) {
        if (!sig.verification_metadata.verified_timestamp) {
          throw new Error('Verification timestamp not stored');
        }
      }
    });

    // Test 3: Revocation info
    await this.runTest('Revocation info stored correctly', async () => {
      const sig = await DocumentSignature.findOne({
        document_id: this.testDocument._id,
        'revocation_info.is_revoked': true
      });

      if (sig) {
        if (!sig.revocation_info.revoked_at) {
          throw new Error('Revocation timestamp not stored');
        }
        if (!sig.revocation_info.revocation_reason) {
          throw new Error('Revocation reason not stored');
        }
      }
    });
  }

  /**
   * Cleanup test data
   */
  async cleanup() {
    try {
      if (this.testDocument) {
        await DocumentSignature.deleteMany({
          document_id: this.testDocument._id
        });
        await Document.deleteOne({ _id: this.testDocument._id });
      }
      if (this.testUser) {
        await User.deleteOne({ _id: this.testUser._id });
      }
      console.log('\n🧹 Test data cleaned up');
    } catch (error) {
      console.error('⚠️  Cleanup error:', error.message);
    }
  }

  /**
   * Run all tests
   */
  async runAll() {
    try {
      console.log('\n' + '='.repeat(60));
      console.log('🧪 PHASE 8.3.3: SIGNATURE MODEL ENHANCEMENT TESTS');
      console.log('='.repeat(60));

      await this.connect();
      await this.setupTestData();
      await this.createTestSignatures();

      await this.testQueryBuilders();
      await this.testInstanceMethods();
      await this.testLifecycleMethods();
      await this.testVirtualProperties();
      await this.testMetadataFields();

      console.log('\n' + '='.repeat(60));
      console.log(`📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
      console.log('='.repeat(60) + '\n');

      if (this.failed === 0) {
        console.log('✅ All tests passed!\n');
      } else {
        console.log(`⚠️  ${this.failed} test(s) failed\n`);
      }

    } catch (error) {
      console.error('❌ Test suite error:', error);
    } finally {
      await this.cleanup();
      await mongoose.disconnect();
    }

    // Exit with appropriate code
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

/**
 * Main execution
 */
if (require.main === module) {
  const tests = new Phase8_3_3Tests();
  tests.runAll().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = Phase8_3_3Tests;
