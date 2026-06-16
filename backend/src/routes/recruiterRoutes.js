const express = require('express');
const router = express.Router();
const { getRecruiterDriveApplications } = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Recruiter Only routes
router.use(protect);
router.use(authorize('recruiter'));

// GET /api/recruiter/drives/:driveId/applications
router.get('/drives/:driveId/applications', getRecruiterDriveApplications);

module.exports = router;
