const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, broadcastToEventAttendees } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);
router.post('/event/:eventId/broadcast', protect, authorize('organiser', 'admin'), broadcastToEventAttendees);

module.exports = router;
