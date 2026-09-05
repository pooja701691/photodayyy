const express = require('express');
const multer = require('multer');
const photoController = require('../controllers/photo.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Multer memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per image
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  },
});

router.use(authMiddleware);

// POST /events/:eventId/photos
router.post('/events/:eventId/photos', upload.array('photos', 15), photoController.uploadPhotos);

// GET /events/:eventId/photos
router.get('/events/:eventId/photos', photoController.getEventPhotos);

// DELETE /photos/:photoId
router.delete('/photos/:photoId', photoController.deletePhoto);

module.exports = router;
