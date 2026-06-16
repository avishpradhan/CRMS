const express = require('express');
const router = express.Router();
const { getAdminApplications, getAdminDriveApplications } = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Admin Only routes
router.use(protect);
router.use(authorize('admin'));

// GET /api/admin/applications
router.get('/applications', getAdminApplications);

// GET /api/admin/drives/:driveId/applications
router.get('/drives/:driveId/applications', getAdminDriveApplications);

module.exports = router;
