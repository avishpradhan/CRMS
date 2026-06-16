const express = require('express');
const router = express.Router();
const {
  getAllRecruiters,
  approveRecruiter,
  rejectRecruiter,
  suspendRecruiter,
  reactivateRecruiter,
} = require('../controllers/recruiterProfileController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes guarded with authentication + admin role
router.use(protect);
router.use(authorize('admin'));

// Admin management endpoints for recruiter profiles
router.get('/', getAllRecruiters);
router.patch('/:id/approve', approveRecruiter);
router.patch('/:id/reject', rejectRecruiter);
router.patch('/:id/suspend', suspendRecruiter);
router.patch('/:id/reactivate', reactivateRecruiter);

module.exports = router;
