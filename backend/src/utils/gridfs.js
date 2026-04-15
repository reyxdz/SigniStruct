const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');

let bucket = null;

/**
 * Initialize GridFS bucket
 * Must be called after mongoose connection is established
 */
const initGridFS = () => {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB connection not established. Call initGridFS after connecting.');
  }
  bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
  console.log('✅ GridFS bucket initialized');
  return bucket;
};

/**
 * Get the GridFS bucket (lazy init)
 */
const getBucket = () => {
  if (!bucket) {
    initGridFS();
  }
  return bucket;
};

/**
 * Upload a file buffer to GridFS
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {Object} metadata - Additional metadata (mimetype, uploadedBy, etc.)
 * @returns {Promise<ObjectId>} GridFS file ID
 */
const uploadToGridFS = (buffer, filename, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const b = getBucket();
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    const uploadStream = b.openUploadStream(filename, {
      metadata: {
        ...metadata,
        uploadedAt: new Date()
      }
    });

    readableStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
      console.log(`✅ GridFS: Uploaded "${filename}" (${buffer.length} bytes) → ID: ${uploadStream.id}`);
      resolve(uploadStream.id);
    });

    uploadStream.on('error', (error) => {
      console.error(`❌ GridFS upload error for "${filename}":`, error);
      reject(error);
    });
  });
};

/**
 * Download a file from GridFS as a Buffer
 * @param {ObjectId|string} fileId - GridFS file ID
 * @returns {Promise<Buffer>} File buffer
 */
const downloadFromGridFS = (fileId) => {
  return new Promise((resolve, reject) => {
    const b = getBucket();
    const id = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
    const chunks = [];

    const downloadStream = b.openDownloadStream(id);

    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    downloadStream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });

    downloadStream.on('error', (error) => {
      console.error(`❌ GridFS download error for ID ${fileId}:`, error);
      reject(error);
    });
  });
};

/**
 * Delete a file from GridFS
 * @param {ObjectId|string} fileId - GridFS file ID
 * @returns {Promise<void>}
 */
const deleteFromGridFS = async (fileId) => {
  const b = getBucket();
  const id = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
  await b.delete(id);
  console.log(`🗑️ GridFS: Deleted file ID: ${fileId}`);
};

/**
 * Stream a file from GridFS to an HTTP response
 * @param {ObjectId|string} fileId - GridFS file ID
 * @param {Response} res - Express response object
 * @param {Object} options - { contentType, filename }
 */
const streamFromGridFS = (fileId, res, options = {}) => {
  const b = getBucket();
  const id = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;

  if (options.contentType) {
    res.setHeader('Content-Type', options.contentType);
  }
  if (options.filename) {
    res.setHeader('Content-Disposition', `inline; filename="${options.filename}"`);
  }

  const downloadStream = b.openDownloadStream(id);
  downloadStream.pipe(res);

  downloadStream.on('error', (error) => {
    console.error(`❌ GridFS stream error for ID ${fileId}:`, error);
    if (!res.headersSent) {
      res.status(404).json({ error: 'File not found' });
    }
  });
};

module.exports = {
  initGridFS,
  getBucket,
  uploadToGridFS,
  downloadFromGridFS,
  deleteFromGridFS,
  streamFromGridFS
};
