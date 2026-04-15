const multer = require('multer');
const path = require('path');

// Configure memory storage for document uploads
const documentStorage = multer.memoryStorage();

// Configure memory storage for signature uploads
const signatureStorage = multer.memoryStorage();

// File filter for documents (PDF only)
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf').split(',').map(type => type.trim());
  const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`Only ${allowedTypes.join(', ')} files are allowed for documents`), false);
  }
};

// File filter for signatures (images)
const signatureFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG and JPEG images are allowed for signatures'), false);
  }
};

// Multer instances
const documentUpload = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 // 50MB default
  }
});

const signatureUpload = multer({
  storage: signatureStorage,
  fileFilter: signatureFileFilter,
  limits: {
    fileSize: 5242880 // 5MB limit for signatures
  }
});

module.exports = {
  documentUpload,
  signatureUpload
};
