const express = require('express');
const router = express.Router();
const {
  getPlatformStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Lock all routes in this file to Admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
