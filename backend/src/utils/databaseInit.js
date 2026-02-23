const mongoose = require('mongoose');
const UserCertificate = require('../models/UserCertificate');

/**
 * Database Initialization Script
 * Sets up collections and indexes for document signing feature
 */

async function initializeDatabaseSchema() {
  try {
    console.log('🔧 Initializing database schema for document signing...');

    // Ensure the collections exist
    await ensureCollectionsExist();

    // Create indexes
    await createIndexes();

    console.log('✅ Database schema initialization completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  }
}

/**
 * Ensure collections exist in MongoDB
 */
async function ensureCollectionsExist() {
  const db = mongoose.connection.db;

  const collections = [
    'users_certificates',
    'user_signatures',
    'documents',
    'document_signatures',
    'signature_audit_log'
  ];

  for (const collection of collections) {
    try {
      const exists = await db.listCollections({ name: collection }).toArray();
      if (exists.length === 0) {
        await db.createCollection(collection);
        console.log(`✓ Created collection: ${collection}`);
      } else {
        console.log(`✓ Collection already exists: ${collection}`);
      }
    } catch (error) {
      console.log(`⚠ Could not create collection ${collection}: ${error.message}`);
    }
  }
}

/**
 * Create all necessary indexes
 */
async function createIndexes() {
  const db = mongoose.connection.db;

  const indexes = {
    users_certificates: [
      { key: { user_id: 1 }, name: 'user_id_idx' },
      { key: { certificate_id: 1 }, unique: true, name: 'certificate_id_unique' },
      { key: { serial_number: 1 }, unique: true, name: 'serial_number_unique' },
      { key: { fingerprint_sha256: 1 }, unique: true, name: 'fingerprint_unique' },
      { key: { status: 1 }, name: 'status_idx' },
      { key: { not_after: 1 }, name: 'expiry_idx' },
      { key: { created_at: -1 }, name: 'created_at_idx' },
      { key: { user_id: 1, status: 1 }, name: 'user_status_idx' }
    ],
    user_signatures: [
      { key: { user_id: 1 }, name: 'user_id_idx' },
      { key: { user_id: 1, is_default: 1 }, name: 'user_default_idx' },
      { key: { created_at: -1 }, name: 'created_at_idx' }
    ],
    documents: [
      { key: { owner_id: 1 }, name: 'owner_id_idx' },
      { key: { status: 1 }, name: 'status_idx' },
      { key: { owner_id: 1, status: 1 }, name: 'owner_status_idx' },
      { key: { created_at: -1 }, name: 'created_at_idx' }
    ],
    document_signatures: [
      { key: { document_id: 1 }, name: 'document_id_idx' },
      { key: { signer_id: 1 }, name: 'signer_id_idx' },
      { key: { document_id: 1, signer_id: 1 }, name: 'document_signer_idx' },
      { key: { timestamp: -1 }, name: 'timestamp_idx' },
      { key: { certificate_id: 1 }, name: 'certificate_id_idx' }
    ],
    signature_audit_log: [
      { key: { signer_id: 1 }, name: 'signer_id_idx' },
      { key: { document_id: 1 }, name: 'document_id_idx' },
      { key: { timestamp: -1 }, name: 'timestamp_idx' },
      { key: { action: 1 }, name: 'action_idx' },
      { key: { timestamp: -1, action: 1 }, name: 'timestamp_action_idx' }
    ]
  };

  for (const [collection, indexList] of Object.entries(indexes)) {
    try {
      const col = db.collection(collection);
      for (const indexSpec of indexList) {
        const key = indexSpec.key;
        const options = { ...indexSpec };
        delete options.key;

        await col.createIndex(key, options);
        console.log(`✓ Created index on ${collection}: ${JSON.stringify(key)}`);
      }
    } catch (error) {
      console.log(
        `⚠ Error creating indexes for ${collection}: ${error.message}`
      );
    }
  }
}

/**
 * Drop all signing-related collections (for development/testing)
 * WARNING: This will delete all data!
 */
async function dropSigningCollections() {
  const db = mongoose.connection.db;
  const collections = [
    'users_certificates',
    'user_signatures',
    'documents',
    'document_signatures',
    'signature_audit_log'
  ];

  console.log(
    '⚠️  WARNING: About to drop all signing-related collections and data!'
  );

  for (const collection of collections) {
    try {
      await db.dropCollection(collection);
      console.log(`✓ Dropped collection: ${collection}`);
    } catch (error) {
      console.log(`⚠ Could not drop collection ${collection}: ${error.message}`);
    }
  }
}

module.exports = {
  initializeDatabaseSchema,
  ensureCollectionsExist,
  createIndexes,
  dropSigningCollections
};
