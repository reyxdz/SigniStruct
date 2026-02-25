const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoriesExist = () => {
  const dirs = [
    process.env.DOCUMENT_UPLOAD_DIR,
    process.env.SIGNATURE_UPLOAD_DIR,
    process.env.TEMP_UPLOAD_DIR
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created upload directory: ${dir}`);
    }
  });
};

ensureDirectoriesExist();

// Configure storage for document uploads
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.DOCUMENT_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${path.extname(file.originalname).substring(1)}`;
    cb(null, uniqueName);
  }
});

// Configure storage for signature uploads
const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.SIGNATURE_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${path.extname(file.originalname).substring(1)}`;
    cb(null, uniqueName);
  }
});

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
