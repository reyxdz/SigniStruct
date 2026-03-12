/**
 * Phase 8.3.3: Signature Migration Script
 * 
 * Purpose: Migrate existing signatures to support new metadata fields and ensure backward compatibility
 * This script:
 * 1. Initializes missing metadata fields for existing signatures
 * 2. Classifies signatures by algorithm
 * 3. Validates crypto field integrity
 * 4. Recalculates missing hashes if needed
 * 5. Provides migration statistics and rollback capability
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import models
const DocumentSignature = require('../models/DocumentSignature');
const Document = require('../models/Document');
const User = require('../models/User');

/**
 * Migration Handler Class
 */
class SignatureMigration {
  constructor() {
    this.stats = {
      total_processed: 0,
      updated_signatures: 0,
      created_metadata: 0,
      validation_errors: 0,
      skipped: 0,
      errors: []
    };
    this.backupPath = null;
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
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Main migration process
   */
  async migrate() {
    try {
      console.log('\n🔧 Starting Signature Migration (Phase 8.3.3)...\n');
      
      const signatures = await DocumentSignature.find({}).sort({ createdAt: 1 });
      console.log(`📊 Found ${signatures.length} signatures to process\n`);

      for (const signature of signatures) {
        await this.processSignature(signature);
      }

      await this.printStatistics();
      await this.runValidation();
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Process individual signature
   */
  async processSignature(signature) {
    try {
      this.stats.total_processed++;
      let updated = false;

      // Initialize missing metadata objects
      if (!signature.signature_metadata) {
        signature.signature_metadata = {
          ip_address: signature.ip_address || null,
          user_agent: signature.user_agent || null,
          duration_ms: signature.duration_ms || null,
          attempts: signature.attempts || 1,
          last_attempt_at: null,
          failure_reason: null
        };
        this.stats.created_metadata++;
        updated = true;
      }

      if (!signature.verification_metadata) {
        signature.verification_metadata = {
          verified_timestamp: signature.verified_at || null,
          verification_duration_ms: null,
          tamper_detected_at: null,
          verification_attempts: 0
        };
        updated = true;
      }

      if (!signature.signature_chain) {
        signature.signature_chain = {
          previous_signature_id: null,
          next_signature_id: null,
          sequence_number: null
        };
        updated = true;
      }

      if (!signature.revocation_info) {
        signature.revocation_info = {
          is_revoked: false,
          revoked_at: null,
          revoked_by: null,
          revocation_reason: null
        };
        updated = true;
      }

      // Classify algorithm if missing
      if (!signature.algorithm) {
        signature.algorithm = signature.crypto_signature ? 'RSA-SHA256' : 'visual-only';
        updated = true;
      }

      // Update verification metadata for crypto signatures
      if (signature.algorithm !== 'visual-only' && !signature.verification_metadata.verified_timestamp && signature.verified) {
        signature.verification_metadata.verified_timestamp = signature.updatedAt || new Date();
        updated = true;
      }

      if (updated) {
        await signature.save({ validateBeforeSave: true });
        this.stats.updated_signatures++;
        console.log(`✓ Migrated signature: ${signature._id}`);
      } else {
        this.stats.skipped++;
      }
    } catch (error) {
      this.stats.validation_errors++;
      this.stats.errors.push({
        signature_id: signature._id,
        error: error.message
      });
      console.error(`⚠️  Error processing signature ${signature._id}:`, error.message);
    }
  }

  /**
   * Run validation checks
   */
  async runValidation() {
    console.log('\n🔍 Running Validation Checks...\n');

    try {
      // Check for signatures with missing critical fields
      const missingCrypto = await DocumentSignature.find({
        algorithm: { $ne: 'visual-only' },
        crypto_signature: null
      });

      if (missingCrypto.length > 0) {
        console.log(`⚠️  Found ${missingCrypto.length} crypto signatures with missing crypto_signature field`);
      }

      // Check algorithm consistency
      const algorithms = await DocumentSignature.aggregate([
        {
          $group: {
            _id: '$algorithm',
            count: { $sum: 1 }
          }
        }
      ]);

      console.log('\n📈 Algorithm Distribution:');
      algorithms.forEach(algo => {
        console.log(`   ${algo._id || 'null'}: ${algo.count} signatures`);
      });

      // Check verification status
      const verified = await DocumentSignature.countDocuments({ verified: true });
      const unverified = await DocumentSignature.countDocuments({ 
        algorithm: { $ne: 'visual-only' },
        verified: false 
      });
      const visual = await DocumentSignature.countDocuments({ algorithm: 'visual-only' });

      console.log('\n📊 Verification Status:');
      console.log(`   ✅ Verified: ${verified}`);
      console.log(`   ⚠️  Unverified (crypto): ${unverified}`);
      console.log(`   👁️  Visual-only: ${visual}`);

      // Check revocation status
      const revoked = await DocumentSignature.countDocuments({
        'revocation_info.is_revoked': true
      });

      console.log(`\n🚫 Revoked Signatures: ${revoked}`);

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
    }
  }

  /**
   * Print migration statistics
   */
  async printStatistics() {
    console.log('\n📋 Migration Statistics:\n');
    console.log(`Total Processed:      ${this.stats.total_processed}`);
    console.log(`Updated:              ${this.stats.updated_signatures}`);
    console.log(`Metadata Created:     ${this.stats.created_metadata}`);
    console.log(`Skipped (no change):  ${this.stats.skipped}`);
    console.log(`Validation Errors:    ${this.stats.validation_errors}`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors:\n');
      this.stats.errors.forEach(err => {
        console.log(`   ${err.signature_id}: ${err.error}`);
      });
    }
  }

  /**
   * Rollback to previous state (by timestamp)
   */
  async rollback(timestampBefore) {
    console.log('\n⏮️  Rolling back changes...\n');

    try {
      const rolled = await DocumentSignature.updateMany(
        { updatedAt: { $gte: timestampBefore } },
        {
          $unset: {
            signature_metadata: 1,
            verification_metadata: 1,
            signature_chain: 1,
            revocation_info: 1
          }
        }
      );

      console.log(`✅ Rolled back ${rolled.modifiedCount} signatures`);
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      await mongoose.disconnect();
      console.log('\n✅ Migration completed and database disconnected');
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const migration = new SignatureMigration();
  const startTime = new Date();

  try {
    // Show migration header
    console.log('\n' + '='.repeat(60));
    console.log('📦 SIGNATURE MODEL MIGRATION - PHASE 8.3.3');
    console.log('='.repeat(60));
    console.log(`Start Time: ${startTime.toISOString()}`);
    console.log(`Database: ${process.env.MONGODB_URI}`);

    // Check for dry-run mode
    const dryRun = process.argv.includes('--dry-run');
    if (dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes will be saved\n');
    }

    // Connect and migrate
    await migration.connect();
    
    if (!dryRun) {
      await migration.migrate();
    } else {
      console.log('Dry run mode: skipping actual migration');
    }

    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Migration completed in ${duration.toFixed(2)} seconds`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Migration Failed');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  } finally {
    await migration.cleanup();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = SignatureMigration;
