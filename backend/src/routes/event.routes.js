const express = require('express');
const eventController = require('../controllers/event.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', eventController.createEvent);
router.get('/', eventController.getMyEvents);
router.get('/:eventId', eventController.getEventDetails);
router.patch('/:eventId/public', eventController.togglePublic);
router.get('/:eventId/qr', eventController.getEventQr);

module.exports = router;
