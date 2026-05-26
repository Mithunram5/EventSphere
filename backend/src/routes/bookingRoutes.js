const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getAttendeeTickets,
  getEventAttendees,
  checkInTicket,
  requestRefund,
  processRefund,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/order', protect, authorize('attendee', 'admin'), createOrder);
router.post('/verify', protect, authorize('attendee', 'admin'), verifyPayment);
router.get('/my-tickets', protect, getAttendeeTickets);
router.get('/event/:eventId/attendees', protect, authorize('organiser', 'admin'), getEventAttendees);
router.post('/check-in', protect, authorize('organiser', 'admin'), checkInTicket);
router.post('/ticket/:ticketId/refund-request', protect, authorize('attendee'), requestRefund);
router.put('/ticket/:ticketId/refund-process', protect, authorize('organiser', 'admin'), processRefund);

module.exports = router;
