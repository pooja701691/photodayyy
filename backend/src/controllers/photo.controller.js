const photoService = require('../services/photo.service');

class PhotoController {
  async uploadPhotos(req, res, next) {
    try {
      const { eventId } = req.params;
      const photographerId = req.user.id;
      const files = req.files;

      const photos = await photoService.uploadPhotos({ eventId, files, photographerId });
      res.status(201).json({
        success: true,
        message: 'Photos uploaded successfully.',
        data: photos,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEventPhotos(req, res, next) {
    try {
      const { eventId } = req.params;
      const photographerId = req.user.id;
      const photos = await photoService.getEventPhotos(eventId, photographerId);
      res.status(200).json({
        success: true,
        data: photos,
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePhoto(req, res, next) {
    try {
      const { photoId } = req.params;
      const photographerId = req.user.id;
      const result = await photoService.deletePhoto(photoId, photographerId);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePhotosBatch(req, res, next) {
    try {
      const { photoIds } = req.body;
      const photographerId = req.user.id;
      const result = await photoService.deletePhotosBatch(photoIds, photographerId);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PhotoController();
