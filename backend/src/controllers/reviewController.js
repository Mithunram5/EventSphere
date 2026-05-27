const Review = require('../models/Review');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');

/**
 * @desc    Create/Add a review
 * @route   POST /api/reviews
 * @access  Private (Attendee)
 */
const createReview = async (req, res, next) => {
  try {
    const { eventId, rating, comment } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Verify if attendee purchased a ticket for this event
    const ticketBought = await Ticket.findOne({
      user: req.user._id,
      event: eventId,
      status: { $in: ['active', 'checked_in'] }
    });

    // In production, we enforce ticket ownership before allowing reviews.
    if (!ticketBought) {
      return res.status(400).json({
        success: false,
        message: 'You can only review events you have purchased tickets for.',
      });
    }

    // Create review
    const review = await Review.create({
      event: eventId,
      user: req.user._id,
      rating: parseInt(rating),
      comment,
    });

    res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    // Catch unique index error (duplicate review)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this event.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get all reviews for an event
 * @route   GET /api/reviews/event/:eventId
 * @access  Public
 */
const getEventReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ event: req.params.eventId })
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getEventReviews,
};
