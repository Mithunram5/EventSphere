const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getOrganiserEvents,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Configure Multer for local uploads fallback (creating directory if missing)
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are supported!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Routes
router.get('/', getEvents);
router.get('/myevents', protect, authorize('organiser', 'admin'), getOrganiserEvents);
router.get('/:id', getEventById);

router.post(
  '/', 
  protect, 
  authorize('organiser', 'admin'), 
  upload.single('bannerImage'), 
  createEvent
);

router.put(
  '/:id', 
  protect, 
  authorize('organiser', 'admin'), 
  upload.single('bannerImage'), 
  updateEvent
);

router.delete(
  '/:id', 
  protect, 
  authorize('organiser', 'admin'), 
  deleteEvent
);

module.exports = router;
