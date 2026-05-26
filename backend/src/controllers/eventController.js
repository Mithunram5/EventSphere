const Event = require('../models/Event');
const { uploadImage } = require('../config/cloudinary');

/**
 * @desc    Get all events (filtered)
 * @route   GET /api/events
 * @access  Public
 */
const getEvents = async (req, res, next) => {
  try {
    const { search, category, city, pricing, startDate, endDate } = req.query;
    let query = {};

    // Text search query (title or description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // City filter
    if (city && city !== 'All') {
      query.city = { $regex: city, $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
      query.dateTime = {};
      if (startDate) {
        query.dateTime.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.dateTime.$lte = end;
      }
    }

    // Pricing filter: Free vs Paid
    // Free: At least one ticket type exists and ALL ticket types have price = 0
    // Paid: At least one ticket type has price > 0
    if (pricing) {
      if (pricing === 'free') {
        query['ticketTypes.price'] = { $not: { $gt: 0 } };
      } else if (pricing === 'paid') {
        query['ticketTypes.price'] = { $gt: 0 };
      }
    }

    const events = await Event.find(query)
      .populate('organiser', 'name profileImage')
      .sort({ dateTime: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organiser', 'name profileImage bio');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new event
 * @route   POST /api/events
 * @access  Private (Organiser/Admin)
 */
const createEvent = async (req, res, next) => {
  try {
    const { title, description, category, venue, city, dateTime, ticketTypes, bulletPoints, schedule } = req.body;

    let parsedTicketTypes = [];
    if (ticketTypes) {
      parsedTicketTypes = typeof ticketTypes === 'string' ? JSON.parse(ticketTypes) : ticketTypes;
    }

    let parsedBulletPoints = [];
    if (bulletPoints) {
      parsedBulletPoints = typeof bulletPoints === 'string' ? JSON.parse(bulletPoints) : bulletPoints;
    }

    let parsedSchedule = [];
    if (schedule) {
      parsedSchedule = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
    }

    // Process image file
    let bannerImageUrl = '';
    if (req.file) {
      bannerImageUrl = await uploadImage(req.file);
    } else {
      bannerImageUrl = req.body.bannerImage || '';
    }

    const event = new Event({
      title,
      description,
      bulletPoints: parsedBulletPoints,
      category,
      venue,
      city,
      dateTime,
      ticketTypes: parsedTicketTypes,
      organiser: req.user._id,
      bannerImage: bannerImageUrl,
      schedule: parsedSchedule,
    });

    await event.save();

    res.status(201).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update event
 * @route   PUT /api/events/:id
 * @access  Private (Organiser/Admin)
 */
const updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Verify ownership or admin role
    if (event.organiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'User is not authorized to edit this event',
      });
    }

    const { title, description, category, venue, city, dateTime, ticketTypes, bulletPoints, schedule } = req.body;

    if (title) event.title = title;
    if (description) event.description = description;
    if (category) event.category = category;
    if (venue) event.venue = venue;
    if (city) event.city = city;
    if (dateTime) event.dateTime = dateTime;

    if (ticketTypes) {
      event.ticketTypes = typeof ticketTypes === 'string' ? JSON.parse(ticketTypes) : ticketTypes;
    }

    if (bulletPoints) {
      event.bulletPoints = typeof bulletPoints === 'string' ? JSON.parse(bulletPoints) : bulletPoints;
    }

    if (schedule) {
      event.schedule = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
    }

    // Handle new banner image upload
    if (req.file) {
      event.bannerImage = await uploadImage(req.file);
    } else if (req.body.bannerImage) {
      event.bannerImage = req.body.bannerImage;
    }

    await event.save();

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete event
 * @route   DELETE /api/events/:id
 * @access  Private (Organiser/Admin)
 */
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Verify ownership or admin role
    if (event.organiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'User is not authorized to delete this event',
      });
    }

    await Event.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Event removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get organiser-specific events
 * @route   GET /api/events/organiser/myevents
 * @access  Private (Organiser/Admin)
 */
const getOrganiserEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ organiser: req.user._id }).sort({ dateTime: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getOrganiserEvents,
};
