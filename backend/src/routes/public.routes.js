const express = require('express');
const multer = require('multer');
const eventController = require('../controllers/event.controller');

const router = express.Router();

// Memory storage for guest selfie upload
const storage = multer.memoryStorage();
const uploadSelfie = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for selfie
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const err = new Error('Invalid file type. Only images are allowed.');
      err.statusCode = 400;
      cb(err, false);
    }
  },
});

// GET /api/public/events/:eventId - Public event details
router.get('/events/:eventId', eventController.getPublicEventDetails);

// GET /api/public/events/:eventId/photos - Public event photos
router.get('/events/:eventId/photos', eventController.getPublicEventPhotos);

// POST /api/public/events/:eventId/match - Match guest selfie with event photos
router.post('/events/:eventId/match', uploadSelfie.single('selfie'), eventController.matchEventPhotosWithSelfie);

module.exports = router;
