const express = require('express');
const router = express.Router();
const {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
  uploadResume,
} = require('../controllers/studentProfileController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Guard all routes with authentication and restrict to student role
router.use(protect);
router.use(authorize('student'));

// CRUD endpoints for student profile
router.post('/', createProfile);
router.get('/', getProfile);
router.put('/', updateProfile);
router.delete('/', deleteProfile);

// File upload endpoint for resumes
router.post('/upload-resume', upload.single('resume'), uploadResume);

module.exports = router;
