const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Database Migration Script
 * Creates collections and indexes for the Document Signer system
 * 
 * Usage: npm run migrate
 */

async function createSchemaAndIndexes() {
  try {
    console.log('🔄 Starting database migration...\n');

    // Connect to MongoDB
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/signistruct';
    console.log(`📡 Connecting to MongoDB: ${mongoUrl}`);
    
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = mongoose.connection;

    console.log(`✅ Connected to MongoDB\n`);

    // Load all models to trigger schema creation
    const modelsPath = '../models';
    const User = require(`${modelsPath}/User`);
    const UserCertificate = require(`${modelsPath}/UserCertificate`);
    const UserSignature = require(`${modelsPath}/UserSignature`);
    const Document = require(`${modelsPath}/Document`);
    const DocumentSignature = require(`${modelsPath}/DocumentSignature`);
    const SignatureAuditLog = require(`${modelsPath}/SignatureAuditLog`);

    const migrations = [
      {
        name: 'users',
        model: User,
        indexes: [
          { spec: { email: 1 }, options: { unique: true } },
          { spec: { createdAt: -1 } },
        ]
      },
      {
        name: 'usercertificates',
        model: UserCertificate,
        indexes: [
          { spec: { user_id: 1 }, options: { unique: true } },
          { spec: { certificate_id: 1 }, options: { unique: true } },
          { spec: { expiration_date: 1 } },
          { spec: { is_revoked: 1 } },
          { spec: { created_at: -1 } },
        ]
      },
      {
        name: 'usersignatures',
        model: UserSignature,
        indexes: [
          { spec: { user_id: 1 } },
          { spec: { is_default: 1 } },
          { spec: { created_at: -1 } },
        ]
      },
      {
        name: 'documents',
        model: Document,
        indexes: [
          { spec: { owner_id: 1 } },
          { spec: { status: 1 } },
          { spec: { file_hash_sha256: 1 }, options: { unique: true } },
          { spec: { created_at: -1 } },
          { spec: { owner_id: 1, status: 1 } }, // Compound index for common queries
        ]
      },
      {
        name: 'documentsignatures',
        model: DocumentSignature,
        indexes: [
          { spec: { document_id: 1 } },
          { spec: { signer_id: 1 } },
          { spec: { signature_placement_id: 1 } },
          { spec: { signed_at: -1 } },
          { spec: { document_id: 1, signer_id: 1 } }, // Compound index
        ]
      },
      {
        name: 'signatureauditlogs',
        model: SignatureAuditLog,
        indexes: [
          { spec: { timestamp: -1 } },
          { spec: { user_id: 1 } },
          { spec: { document_id: 1 } },
          { spec: { action: 1 } },
          { spec: { document_id: 1, timestamp: -1 } }, // Compound index
          { 
            spec: { timestamp: 1 }, 
            options: { expireAfterSeconds: 7776000 } // 90 days TTL
          },
        ]
      },
    ];

    // Create indexes for each collection
    console.log('📚 Creating indexes for collections...\n');
    
    for (const migration of migrations) {
      const collectionName = migration.model.collection.name;
      console.log(`  • ${collectionName}`);

      for (const { spec, options = {} } of migration.indexes) {
        try {
          const indexName = migration.model.collection.createIndex(spec, options);
          const indexSpec = JSON.stringify(spec);
          console.log(`    ✓ Index created: ${indexSpec}`);
        } catch (error) {
          console.error(`    ✗ Error creating index: ${error.message}`);
        }
      }
      console.log('');
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('Database Collections Summary:');
    migrations.forEach(m => {
      const indexCount = m.indexes.length;
      console.log(`  • ${m.model.collection.name}: ${indexCount} indexes created`);
    });
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  createSchemaAndIndexes();
}

module.exports = createSchemaAndIndexes;
