const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  createStage,
  getStages,
  updateStage,
  deleteStage,
  importResults,
} = require('../controllers/recruitmentStageController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const drivesUpload = require('../middleware/drivesUploadMiddleware');

// Configure multer memory storage for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Basic CSV file type check
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // Limit size to 2MB
  },
});

// Drive-specific stage routes
router.post('/drives/:driveId/stages', protect, authorize('recruiter'), drivesUpload.array('attachments', 10), createStage);
router.get('/drives/:driveId/stages', protect, getStages);

// Individual stage routes
router.put('/stages/:stageId', protect, authorize('recruiter'), drivesUpload.array('attachments', 10), updateStage);
router.delete('/stages/:stageId', protect, authorize('recruiter'), deleteStage);

// CSV result import route (file field name: "file")
router.post('/stages/:stageId/import-results', protect, authorize('recruiter'), upload.single('file'), importResults);

module.exports = router;
