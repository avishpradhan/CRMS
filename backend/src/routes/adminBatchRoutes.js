const express = require('express');
const router = express.Router();
const {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  deactivateBatch,
  deleteBatch,
} = require('../controllers/adminBatchController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Guard all endpoints under this router with protect
router.use(protect);

// Batch management routes
router.post('/', authorize('admin'), createBatch);
router.get('/', authorize('admin', 'recruiter', 'student'), getAllBatches);
router.get('/:id', authorize('admin', 'recruiter', 'student'), getBatchById);
router.put('/:id', authorize('admin'), updateBatch);
router.patch('/:id/deactivate', authorize('admin'), deactivateBatch);
router.delete('/:id', authorize('admin'), deleteBatch);

module.exports = router;
