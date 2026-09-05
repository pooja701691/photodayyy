const express = require('express');
const eventController = require('../controllers/event.controller');

const router = express.Router();

// GET /api/public/events/:eventId - Public event details
router.get('/events/:eventId', eventController.getPublicEventDetails);

// GET /api/public/events/:eventId/photos - Public event photos
router.get('/events/:eventId/photos', eventController.getPublicEventPhotos);

module.exports = router;
