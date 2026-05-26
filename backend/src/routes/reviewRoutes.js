const express = require('express');
const router = express.Router();
const { createReview, getEventReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('attendee', 'admin'), createReview);
router.get('/event/:eventId', getEventReviews);

module.exports = router;
