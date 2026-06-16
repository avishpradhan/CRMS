const express = require('express');
const router = express.Router();
const {
  createDrive,
  getMyDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
  getAllDrives,
  uploadDriveAttachment,
} = require('../controllers/campusDriveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const drivesUpload = require('../middleware/drivesUploadMiddleware');

// Admin: Get all drives (must come before /:id to avoid conflict)
router.get('/', protect, authorize('admin'), getAllDrives);

// Recruiter: CRUD for own drives
router.post('/', protect, authorize('recruiter'), createDrive);
router.post('/upload-attachment', protect, authorize('recruiter'), drivesUpload.single('attachment'), uploadDriveAttachment);
router.get('/my', protect, authorize('recruiter'), getMyDrives);
router.get('/:id', protect, authorize('recruiter', 'admin'), getDriveById);
router.put('/:id', protect, authorize('recruiter', 'admin'), updateDrive);
router.delete('/:id', protect, authorize('recruiter', 'admin'), deleteDrive);

module.exports = router;
