const Wishlist = require('../models/Wishlist');
const Event = require('../models/Event');

/**
 * @desc    Toggle wishlist status for an event (add if not wishlisted, remove if is)
 * @route   POST /api/wishlist/toggle
 * @access  Private (Attendee)
 */
const toggleWishlist = async (req, res, next) => {
  try {
    const { eventId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if already in wishlist
    const wishlistItem = await Wishlist.findOne({
      user: req.user._id,
      event: eventId
    });

    if (wishlistItem) {
      // Remove from wishlist
      await Wishlist.deleteOne({ _id: wishlistItem._id });
      return res.status(200).json({
        success: true,
        isWishlisted: false,
        message: 'Removed from wishlist successfully',
      });
    }

    // Add to wishlist
    const newWishlist = await Wishlist.create({
      user: req.user._id,
      event: eventId
    });

    res.status(201).json({
      success: true,
      isWishlisted: true,
      wishlist: newWishlist,
      message: 'Added to wishlist successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user wishlist events
 * @route   GET /api/wishlist
 * @access  Private (Attendee)
 */
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.find({ user: req.user._id })
      .populate({
        path: 'event',
        populate: {
          path: 'organiser',
          select: 'name profileImage'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleWishlist,
  getWishlist,
};
