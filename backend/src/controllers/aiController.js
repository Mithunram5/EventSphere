const { generateAIDescription, recommendEvents, optimizeSchedule } = require('../utils/geminiHelper');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Wishlist = require('../models/Wishlist');

/**
 * @desc    Generate a polished description using AI (Gemini)
 * @route   POST /api/ai/generate-description
 * @access  Private (Organiser/Admin)
 */
const getAIDescription = async (req, res, next) => {
  try {
    const { bulletPoints } = req.body;

    if (!bulletPoints || !Array.isArray(bulletPoints) || bulletPoints.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of bullet points',
      });
    }

    const description = await generateAIDescription(bulletPoints);

    res.status(200).json({
      success: true,
      description,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recommended events for a user
 * @route   GET /api/ai/recommendations
 * @access  Private (Attendee)
 */
const getAIRecommendations = async (req, res, next) => {
  try {
    // 1. Fetch user's wishlisted event categories
    const wishlisted = await Wishlist.find({ user: req.user._id }).populate('event');
    const viewedCategories = wishlisted.map(w => w.event ? w.event.category : '').filter(Boolean);

    // 2. Fetch user's registered event categories
    const registered = await Ticket.find({ user: req.user._id }).populate('event');
    const registeredCategories = registered.map(t => t.event ? t.event.category : '').filter(Boolean);

    // 3. Fetch all upcoming events (to recommend from)
    const allEvents = await Event.find({ dateTime: { $gte: new Date() } });

    if (allEvents.length === 0) {
      return res.status(200).json({
        success: true,
        recommendations: []
      });
    }

    // 4. Generate recommendations using helper
    const recommendedIds = await recommendEvents(
      [...new Set(viewedCategories)],
      [...new Set(registeredCategories)],
      allEvents
    );

    // 5. Query full event details for recommended events
    const recommendations = await Event.find({ _id: { $in: recommendedIds } })
      .populate('organiser', 'name profileImage');

    res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Build/Optimize session order for an event schedule
 * @route   POST /api/ai/optimize-schedule
 * @access  Private (Organiser/Attendee)
 */
const getAIOptimizedSchedule = async (req, res, next) => {
  try {
    const { sessions } = req.body;

    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a non-empty array of sessions to organize',
      });
    }

    const optimized = await optimizeSchedule(sessions);

    res.status(200).json({
      success: true,
      schedule: optimized,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ask AI Assistant about a specific event
 * @route   POST /api/ai/ask-assistant
 * @access  Public
 */
const askEventAssistant = async (req, res, next) => {
  try {
    const { eventId, question } = req.body;

    if (!eventId || !question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both eventId and question',
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const { chatWithEventAI } = require('../utils/geminiHelper');
    const answer = await chatWithEventAI(event, question);

    res.status(200).json({
      success: true,
      answer,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAIDescription,
  getAIRecommendations,
  getAIOptimizedSchedule,
  askEventAssistant,
};
