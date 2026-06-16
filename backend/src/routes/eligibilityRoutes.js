const express = require('express');
const {
  getEligibleDrives,
  checkDriveEligibility,
  getDriveEligibilityStats,
  floodDrive,
} = require('../controllers/eligibilityController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// ─── Student Eligibility Routes ───
// Mounted at /api/student in app.js
const studentRouter = express.Router();
studentRouter.get('/eligible-drives', protect, authorize('student'), getEligibleDrives);
studentRouter.get('/drive/:id/eligibility', protect, authorize('student'), checkDriveEligibility);

// ─── Admin Eligibility Routes ───
// Mounted at /api/admin/drives in app.js
const adminRouter = express.Router();
adminRouter.get('/:id/eligibility-stats', protect, authorize('admin'), getDriveEligibilityStats);
adminRouter.post('/:id/flood', protect, authorize('admin'), floodDrive);

module.exports = { studentRouter, adminRouter };
