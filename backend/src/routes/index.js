const express = require('express');
const authRoutes = require('./auth.routes');
const eventRoutes = require('./event.routes');
const photoRoutes = require('./photo.routes');
const publicRoutes = require('./public.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/public', publicRoutes);
router.use('/', photoRoutes); // Mounts /events/:eventId/photos and /photos/:photoId under root

module.exports = router;
