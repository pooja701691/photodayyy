const eventService = require('../services/event.service');

class EventController {
  async createEvent(req, res, next) {
    try {
      const { name, date, location, description } = req.body;
      const photographerId = req.user.id;
      const event = await eventService.createEvent({ name, date, location, description, photographerId });
      res.status(201).json({
        success: true,
        message: 'Event created successfully.',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyEvents(req, res, next) {
    try {
      const photographerId = req.user.id;
      const events = await eventService.getMyEvents(photographerId);
      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEventDetails(req, res, next) {
    try {
      const { eventId } = req.params;
      const photographerId = req.user.id;
      const event = await eventService.getEventDetails(eventId, photographerId);
      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async togglePublic(req, res, next) {
    try {
      const { eventId } = req.params;
      const { isPublic } = req.body;
      const photographerId = req.user.id;
      const event = await eventService.togglePublic(eventId, photographerId, isPublic);
      res.status(200).json({
        success: true,
        message: `Event public access ${event.isPublic ? 'enabled' : 'disabled'}.`,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEventQr(req, res, next) {
    try {
      const { eventId } = req.params;
      const photographerId = req.user.id;
      const frontendBaseUrl = req.query.origin || `${req.protocol}://${req.get('host')}`;
      const qrData = await eventService.generateEventQr(eventId, photographerId, frontendBaseUrl);
      res.status(200).json({
        success: true,
        data: qrData,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublicEventDetails(req, res, next) {
    try {
      const { eventId } = req.params;
      const event = await eventService.getPublicEventDetails(eventId);
      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublicEventPhotos(req, res, next) {
    try {
      const { eventId } = req.params;
      const photos = await eventService.getPublicEventPhotos(eventId);
      res.status(200).json({
        success: true,
        data: photos,
      });
    } catch (error) {
      next(error);
    }
  }

  async matchEventPhotosWithSelfie(req, res, next) {
    try {
      const { eventId } = req.params;
      const selfieBuffer = req.file?.buffer;
      const result = await eventService.matchEventPhotosWithSelfie(eventId, selfieBuffer);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EventController();
