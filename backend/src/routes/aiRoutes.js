const express = require('express');
const router = express.Router();
const {
  getAIDescription,
  getAIRecommendations,
  getAIOptimizedSchedule,
  askEventAssistant,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/generate-description', protect, authorize('organiser', 'admin'), getAIDescription);
router.get('/recommendations', protect, authorize('attendee', 'admin'), getAIRecommendations);
router.post('/optimize-schedule', protect, getAIOptimizedSchedule);
router.post('/ask-assistant', askEventAssistant);

module.exports = router;
