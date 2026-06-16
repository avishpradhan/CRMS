const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  updateStudent,
  deleteStudent,
} = require('../controllers/adminStudentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Guard all routes for authenticated admins
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllStudents);
router.put('/:userId', updateStudent);
router.delete('/:userId', deleteStudent);

module.exports = router;
