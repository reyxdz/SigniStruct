const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Document = require('../models/Document');

/**
 * Generate SHA-256 hash of a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} SHA-256 hash of the file
 * @throws {Error} If file cannot be read
 */
async function generateDocumentHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => {
      hash.update(data);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', (error) => {
      reject(new Error(`Error reading file for hashing: ${error.message}`));
    });
  });
}

/**
 * Upload a document to the system
 * @param {Object} file - File object from multer middleware
 * @param {string} userId - User ID of the document owner
 * @param {string} title - Document title
 * @param {string} description - Optional document description
 * @returns {Promise<Object>} Created document object with _id
 * @throws {Error} If document creation fails or hash already exists
 */
async function uploadDocument(file, userId, title, description = null) {
  try {
    // Validate inputs
    if (!file) {
      throw new Error('No file provided');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!title || title.trim().length === 0) {
      throw new Error('Document title is required');
    }

    // Generate SHA-256 hash of the uploaded file
    const fileHash = await generateDocumentHash(file.path);

    // Check if document with same hash already exists
    const existingDocument = await Document.findOne({ file_hash_sha256: fileHash });
    if (existingDocument) {
      // Clean up uploaded file if duplicate
      fs.unlinkSync(file.path);
      throw new Error('Document with identical content already exists');
    }

    // Get file size in bytes
    const fileSize = file.size || fs.statSync(file.path).size;

    // Extract file extension and determine MIME type
    const fileExt = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype || 'application/pdf';

    // Create document record in database
    const newDocument = new Document({
      owner_id: userId,
      title: title.trim(),
      description: description ? description.trim() : null,
      file_url: file.path,
      original_filename: file.originalname,
      file_hash_sha256: fileHash,
      file_size: fileSize,
      file_type: mimeType,
      num_pages: 1, // Default: will be updated if PDF page count is calculated separately
      status: 'draft',
      signers: [],
      created_at: new Date(),
      updated_at: new Date()
    });

    // Save to MongoDB
    const savedDocument = await newDocument.save();

    return {
      _id: savedDocument._id,
      title: savedDocument.title,
      description: savedDocument.description,
      file_hash_sha256: savedDocument.file_hash_sha256,
      status: savedDocument.status,
      created_at: savedDocument.created_at,
      message: 'Document uploaded successfully'
    };
  } catch (error) {
    // Clean up uploaded file if document creation fails
    if (file && file.path) {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    throw new Error(`Document upload failed: ${error.message}`);
  }
}

/**
 * Get document by ID
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Document object
 * @throws {Error} If document not found
 */
async function getDocumentById(documentId) {
  try {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }
    return document;
  } catch (error) {
    throw new Error(`Failed to retrieve document: ${error.message}`);
  }
}

/**
 * Get all documents for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options (limit, skip, status)
 * @returns {Promise<Array>} Array of documents
 * @throws {Error} If query fails
 */
async function getUserDocuments(userId, options = {}) {
  try {
    const { limit = 10, skip = 0, status = null } = options;

    let query = { owner_id: userId };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const documents = await Document.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 });

    return documents;
  } catch (error) {
    throw new Error(`Failed to retrieve user documents: ${error.message}`);
  }
}

/**
 * Delete a document
 * @param {string} documentId - Document ID
 * @param {string} userId - User ID (for authorization check)
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {Error} If document not found or user not authorized
 */
async function deleteDocument(documentId, userId) {
  try {
    const document = await Document.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    // Verify user owns the document
    if (document.owner_id.toString() !== userId) {
      throw new Error('User not authorized to delete this document');
    }

    // Only allow deletion of draft documents
    if (document.status !== 'draft') {
      throw new Error('Cannot delete documents that are not in draft status');
    }

    // Delete file from disk
    if (document.file_url && fs.existsSync(document.file_url)) {
      try {
        fs.unlinkSync(document.file_url);
      } catch (unlinkError) {
        console.error('Error deleting file from disk:', unlinkError);
      }
    }

    // Delete from database
    await Document.findByIdAndDelete(documentId);

    return {
      message: 'Document deleted successfully',
      documentId: documentId
    };
  } catch (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

/**
 * Update document status
 * @param {string} documentId - Document ID
 * @param {string} newStatus - New status value
 * @returns {Promise<Object>} Updated document
 * @throws {Error} If update fails
 */
async function updateDocumentStatus(documentId, newStatus) {
  try {
    const validStatuses = ['draft', 'pending_signature', 'partially_signed', 'fully_signed', 'archived'];

    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const document = await Document.findByIdAndUpdate(
      documentId,
      {
        status: newStatus,
        updated_at: new Date(),
        ...(newStatus === 'fully_signed' && { completed_at: new Date() })
      },
      { new: true }
    );

    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  } catch (error) {
    throw new Error(`Failed to update document status: ${error.message}`);
  }
}

/**
 * Add signer to document
 * @param {string} documentId - Document ID
 * @param {Object} signerInfo - Signer information {user_id, email}
 * @returns {Promise<Object>} Updated document
 * @throws {Error} If operation fails
 */
async function addSignerToDocument(documentId, signerInfo) {
  try {
    const { user_id, email } = signerInfo;

    if (!email) {
      throw new Error('Signer email is required');
    }

    const document = await Document.findByIdAndUpdate(
      documentId,
      {
        $push: {
          signers: {
            user_id: user_id || null,
            email: email,
            status: 'pending',
            signed_at: null,
            signature_id: null
          }
        },
        updated_at: new Date()
      },
      { new: true }
    );

    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  } catch (error) {
    throw new Error(`Failed to add signer: ${error.message}`);
  }
}

module.exports = {
  uploadDocument,
  generateDocumentHash,
  getDocumentById,
  getUserDocuments,
  deleteDocument,
  updateDocumentStatus,
  addSignerToDocument
};
