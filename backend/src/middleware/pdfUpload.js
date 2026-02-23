const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = process.env.DOCUMENT_UPLOAD_DIR || './uploads/documents';
const tempDir = process.env.TEMP_UPLOAD_DIR || './uploads/temp';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure storage for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store PDFs in the documents upload directory
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `${timestamp}-${random}.pdf`;
    cb(null, filename);
  }
});

// File filter - only accept PDF files
const fileFilter = (req, file, cb) => {
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf') {
    return cb(new Error('Only PDF files are allowed'), false);
  }

  // Check MIME type
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Invalid file type. Only PDF files are allowed'), false);
  }

  cb(null, true);
};

// Create multer instance with PDF-specific configuration
const uploadPDF = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') // 50MB default
  }
});

// Middleware to handle PDF upload errors
const handlePDFUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        details: `Maximum file size is ${process.env.MAX_FILE_SIZE || '50MB'}`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        details: 'Only one file is allowed per upload'
      });
    }
  }
  
  if (err) {
    return res.status(400).json({
      error: err.message || 'File upload error'
    });
  }

  next();
};

module.exports = {
  uploadPDF,
  handlePDFUploadError,
  uploadDir,
  tempDir
};
