const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Define storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter for validating file types
const fileFilter = (req, file, cb) => {
  // Accept only PDF files for articles
  if (file.fieldname === 'pdf' || file.fieldname === 'pdfFile' || file.fieldname === 'document') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for articles'), false);
    }
  } 
  // Accept images for covers and other image uploads
  else if (file.fieldname === 'coverImage' || file.fieldname === 'image' || file.fieldname === 'cover') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
  // Accept common file field names
  else if (file.fieldname === 'file' || file.fieldname === 'upload') {
    // Determine allowed types based on file extension and mimetype
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'), false);
    }
  }
  // Reject other file types
  else {
    console.log('Unexpected file field:', file.fieldname);
    cb(new Error(`Unexpected file field: ${file.fieldname}. Allowed fields: pdf, pdfFile, document, coverImage, image, cover, file, upload`), false);
  }
};

// Configure multer with size limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1 // Allow only 1 file per request
  }
});

module.exports = upload; 