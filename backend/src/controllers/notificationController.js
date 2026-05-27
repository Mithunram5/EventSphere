const Notification = require('../models/Notification');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Broadcast a notification to all attendees of an event
 * @route   POST /api/notifications/event/:eventId/broadcast
 * @access  Private (Organiser/Admin)
 */
const broadcastToEventAttendees = async (req, res, next) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Ownership gate: organiser of event OR admin
    if (event.organiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to message attendees for this event' });
    }

    // Unique attendee user IDs who hold tickets for this event
    const attendeeUserIds = await Ticket.distinct('user', { event: event._id });
    if (!attendeeUserIds || attendeeUserIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        message: 'No attendees found for this event yet.',
      });
    }

    const docs = attendeeUserIds.map((userId) => ({
      user: userId,
      title: title.trim(),
      message: message.trim(),
    }));

    await Notification.insertMany(docs, { ordered: false });

    res.status(201).json({
      success: true,
      count: attendeeUserIds.length,
      message: 'Announcement sent to attendees',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  broadcastToEventAttendees,
};
