const express = require('express');
const router = express.Router();
const { toggleWishlist, getWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/toggle', protect, authorize('attendee', 'admin'), toggleWishlist);
router.get('/', protect, authorize('attendee', 'admin'), getWishlist);

module.exports = router;
