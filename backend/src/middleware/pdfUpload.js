const multer = require('multer');
const path = require('path');

// Configure memory storage for PDF uploads (stored in GridFS, not disk)
const storage = multer.memoryStorage();

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

// Create multer instance with memory storage
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
  handlePDFUploadError
};
