const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure drives uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/drives');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage engine configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique name to prevent collisions
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `attachment-${timestamp}-${random}${extension}`);
  },
});

// File validation filter - accept PDF, Word Documents, and Images
const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, Word Documents (.doc, .docx), and Images (PNG, JPG, JPEG, WEBP) are allowed!'), false);
  }
};

// Configure multer
const drivesUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum file size
  },
  fileFilter: fileFilter,
});

module.exports = drivesUpload;
