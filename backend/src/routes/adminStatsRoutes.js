const express = require('express');
const router = express.Router();
const { getPlacementStats } = require('../controllers/adminStatsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Guard all statistics endpoints for authenticated admin users
router.use(protect);
router.use(authorize('admin'));

router.get('/', getPlacementStats);

module.exports = router;
