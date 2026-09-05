const prisma = require('../config/database');
const { uploadFromBuffer, deleteFromCloudinary } = require('../config/cloudinary');
const { addFaceProcessingJob } = require('../queues/faceProcessing.queue');
const qdrantService = require('./qdrant.service');

class PhotoService {
  async uploadPhotos({ eventId, files, photographerId }) {
    if (!files || files.length === 0) {
      const error = new Error('No photos provided for upload.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Verify event exists and is owned by this photographer
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      const error = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }

    if (event.photographerId !== photographerId) {
      const error = new Error('Access denied. This event does not belong to you.');
      error.statusCode = 403;
      throw error;
    }

    // 2. Upload files to Cloudinary and save to DB
    const uploadedPhotos = [];

    for (const file of files) {
      try {
        // Upload via streaming buffer
        const cloudinaryResult = await uploadFromBuffer(file.buffer, `photoday/events/${eventId}`);
        
        // Save metadata to database
        const photo = await prisma.photo.create({
          data: {
            eventId,
            imageUrl: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id,
          },
        });
        
        // Enqueue face processing job asynchronously (does not block upload response)
        try {
          await addFaceProcessingJob({
            photoId: photo.id,
            eventId,
            photographerId,
            imageUrl: photo.imageUrl,
          });
        } catch (queueErr) {
          console.error(`Failed to enqueue face processing job for photo ${photo.id}:`, queueErr.message);
        }

        uploadedPhotos.push(photo);
      } catch (err) {
        console.error('Error uploading file to Cloudinary/DB:', err);
        const error = new Error(`Failed to upload photo: ${err.message}`);
        error.statusCode = 500;
        throw error;
      }
    }

    return uploadedPhotos;
  }

  async getEventPhotos(eventId, photographerId) {
    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      const error = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }

    if (event.photographerId !== photographerId) {
      const error = new Error('Access denied. This event does not belong to you.');
      error.statusCode = 403;
      throw error;
    }

    return prisma.photo.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deletePhoto(photoId, photographerId) {
    // 1. Find photo and check associated event
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        event: true,
      },
    });

    if (!photo) {
      const error = new Error('Photo not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Check ownership
    if (photo.event.photographerId !== photographerId) {
      const error = new Error('Access denied. You cannot delete this photo.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Delete from Cloudinary
    try {
      if (photo.cloudinaryPublicId) {
        await deleteFromCloudinary(photo.cloudinaryPublicId);
      }
    } catch (err) {
      console.warn(`Cloudinary deletion failed for public ID ${photo.cloudinaryPublicId}:`, err);
    }

    // 4. Delete face embeddings from Qdrant
    try {
      await qdrantService.deletePhotoEmbeddings(photoId);
    } catch (qdrantErr) {
      console.warn(`Qdrant deletion failed for photo ID ${photoId}:`, qdrantErr.message);
    }

    // 5. Delete from DB
    await prisma.photo.delete({
      where: { id: photoId },
    });

    return { message: 'Photo deleted successfully.' };
  }
}

module.exports = new PhotoService();
