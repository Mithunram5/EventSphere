const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');

/**
 * @desc    Get dashboard analytics / platform statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
const getPlatformStats = async (req, res, next) => {
  try {
    // 1. User count & distribution
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const organiserCount = await User.countDocuments({ role: 'organiser' });
    const attendeeCount = await User.countDocuments({ role: 'attendee' });

    // 2. Event count & categories
    const totalEvents = await Event.countDocuments();
    const categoriesAggregation = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // 3. Bookings & total revenue
    const totalBookings = await Booking.countDocuments({ status: 'paid' });
    const revenueAggregation = await Booking.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

    // 4. Ticket metrics: Check-in statistics
    const totalTickets = await Ticket.countDocuments();
    const checkedInTickets = await Ticket.countDocuments({ checkedIn: true });
    const checkInRate = totalTickets > 0 ? ((checkedInTickets / totalTickets) * 100).toFixed(2) : 0;

    // 5. Monthly Booking trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          bookingsCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          admin: adminCount,
          organiser: organiserCount,
          attendee: attendeeCount,
        },
        events: {
          total: totalEvents,
          categories: categoriesAggregation,
        },
        bookings: {
          total: totalBookings,
          revenue: totalRevenue,
        },
        tickets: {
          total: totalTickets,
          checkedIn: checkedInTickets,
          checkInRate: parseFloat(checkInRate),
        },
        trends: bookingTrends.map(t => ({
          month: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
          revenue: t.revenue,
          bookings: t.bookingsCount
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users list
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role or profile details
 * @route   PUT /api/admin/users/:id/role
 * @access  Private (Admin)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['attendee', 'organiser', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent changing own role if logged in admin
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting own profile
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own admin account' });
    }

    await User.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'User deleted from platform successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  /**
   * @desc    List all events for moderation
   * @route   GET /api/admin/events
   * @access  Private (Admin)
   */
  getAllEventsAdmin: async (req, res, next) => {
    try {
      const { search, category, city } = req.query;
      const query = {};

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { venue: { $regex: search, $options: 'i' } },
        ];
      }
      if (category && category !== 'All') query.category = category;
      if (city && city !== 'All') query.city = { $regex: city, $options: 'i' };

      const events = await Event.find(query)
        .populate('organiser', 'name email')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, count: events.length, events });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @desc    Delete an event with dependent cleanup
   * @route   DELETE /api/admin/events/:id
   * @access  Private (Admin)
   */
  deleteEventAdmin: async (req, res, next) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      // Cleanup dependent documents
      await Promise.all([
        Ticket.deleteMany({ event: event._id }),
        Booking.deleteMany({ event: event._id }),
        Wishlist.deleteMany({ event: event._id }),
        Review.deleteMany({ event: event._id }),
      ]);

      await Event.deleteOne({ _id: event._id });

      res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
