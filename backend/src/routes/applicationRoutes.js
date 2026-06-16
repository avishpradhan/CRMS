const express = require('express');
const router = express.Router();
const {
  applyToDrive,
  getMyApplications,
  getApplicationById,
  getRecruiterApplications,
  shortlistApplication,
  rejectApplication,
  updateApplicationStatus,
  bulkAdvanceApplications,
  bulkRejectApplications,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// General Private Routes
router.use(protect);

// Student Only Routes
router.post('/apply/:driveId', authorize('student'), applyToDrive);
router.get('/my-applications', authorize('student'), getMyApplications);

// Recruiter Only Routes
router.post('/bulk-advance', authorize('recruiter'), bulkAdvanceApplications);
router.post('/bulk-reject', authorize('recruiter'), bulkRejectApplications);
router.patch('/:id/shortlist', authorize('recruiter'), shortlistApplication);
router.patch('/:id/reject', authorize('recruiter'), rejectApplication);

// Legacy/Compatibility Routes (ensure existing frontend still works)
router.post('/', authorize('student'), applyToDrive);
router.get('/my', authorize('student'), getMyApplications);
router.get('/recruiter', authorize('recruiter'), getRecruiterApplications);
router.patch('/:id/status', authorize('recruiter'), updateApplicationStatus);

// Parameterized route placed at the end to avoid matching conflicts
router.get('/:applicationId', authorize('student'), getApplicationById);

module.exports = router;

