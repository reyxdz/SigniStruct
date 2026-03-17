/**
 * Clear All Data Script
 * 
 * Deletes all documents (rows) from every collection in the database
 * WITHOUT dropping the collections (tables) themselves.
 * 
 * Usage:
 *   cd backend
 *   node src/scripts/clearAllData.js
 * 
 * Add --confirm flag to skip the confirmation prompt:
 *   node src/scripts/clearAllData.js --confirm
 */

const mongoose = require('mongoose');
const readline = require('readline');

// Import all models
const User = require('../models/User');
const Document = require('../models/Document');
const DocumentSignature = require('../models/DocumentSignature');
const DocumentSigner = require('../models/DocumentSigner');
const UserSignature = require('../models/UserSignature');
const UserCertificate = require('../models/UserCertificate');
const SigningRequest = require('../models/SigningRequest');
const SignatureAuditLog = require('../models/SignatureAuditLog');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/signistruct';

const models = [
  { name: 'Users', model: User },
  { name: 'Documents', model: Document },
  { name: 'DocumentSignatures', model: DocumentSignature },
  { name: 'DocumentSigners', model: DocumentSigner },
  { name: 'UserSignatures', model: UserSignature },
  { name: 'UserCertificates', model: UserCertificate },
  { name: 'SigningRequests', model: SigningRequest },
  { name: 'SignatureAuditLogs', model: SignatureAuditLog },
];

async function clearAllData() {
  const autoConfirm = process.argv.includes('--confirm');

  console.log('\n⚠️  SigniStruct - Clear All Data');
  console.log('================================');
  console.log(`Database: ${MONGO_URI}`);
  console.log(`Collections to clear: ${models.length}`);
  console.log('');

  if (!autoConfirm) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => {
      rl.question('⚠️  This will DELETE ALL DATA from all collections. Type "yes" to continue: ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Cancelled. No data was deleted.');
      process.exit(0);
    }
  }

  try {
    console.log('\n🔌 Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.\n');

    let totalDeleted = 0;

    for (const { name, model } of models) {
      try {
        const countBefore = await model.countDocuments();
        const result = await model.deleteMany({});
        console.log(`  🗑️  ${name}: deleted ${result.deletedCount} document(s) (was ${countBefore})`);
        totalDeleted += result.deletedCount;
      } catch (err) {
        console.error(`  ❌ ${name}: error - ${err.message}`);
      }
    }

    console.log(`\n✅ Done! Deleted ${totalDeleted} total document(s) across ${models.length} collections.`);
    console.log('   Collections (tables) are preserved.\n');

  } catch (err) {
    console.error('\n❌ Database connection failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearAllData();
