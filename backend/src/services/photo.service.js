const prisma = require('../config/database');
const { uploadFromBuffer, deleteFromCloudinary } = require('../config/cloudinary');
const { addFaceProcessingJob } = require('../queues/faceProcessing.queue');
const qdrantService = require('./qdrant.service');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUUID(id) {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

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
    if (!isValidUUID(eventId)) {
      const error = new Error('Invalid or malformed event ID.');
      error.statusCode = 400;
      throw error;
    }

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
    if (!isValidUUID(photoId)) {
      const error = new Error('Invalid or malformed photo ID.');
      error.statusCode = 400;
      throw error;
    }

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

  /**
   * Deletes multiple photos belonging to the photographer in a batch.
   * Performs concurrent cleanup across Cloudinary, Qdrant vectors, and PostgreSQL.
   */
  async deletePhotosBatch(photoIds, photographerId) {
    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      const error = new Error('photoIds array is required.');
      error.statusCode = 400;
      throw error;
    }

    const validPhotoIds = photoIds.filter(isValidUUID);
    if (validPhotoIds.length === 0) {
      const error = new Error('No valid photo IDs provided.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Fetch photos and check photographer ownership
    const photos = await prisma.photo.findMany({
      where: {
        id: { in: validPhotoIds },
        event: { photographerId },
      },
      select: {
        id: true,
        cloudinaryPublicId: true,
      },
    });

    if (photos.length === 0) {
      const error = new Error('No matching photos found or unauthorized.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Concurrent cleanup for Cloudinary and Qdrant
    await Promise.allSettled(
      photos.map(async (photo) => {
        if (photo.cloudinaryPublicId) {
          try {
            await deleteFromCloudinary(photo.cloudinaryPublicId);
          } catch (err) {
            console.warn(`[Batch Delete] Cloudinary deletion failed for ${photo.id}:`, err.message);
          }
        }
        try {
          await qdrantService.deletePhotoEmbeddings(photo.id);
        } catch (err) {
          console.warn(`[Batch Delete] Qdrant deletion failed for ${photo.id}:`, err.message);
        }
      })
    );

    // 3. Batch delete from Postgres DB
    const deleteResult = await prisma.photo.deleteMany({
      where: {
        id: { in: photos.map((p) => p.id) },
      },
    });

    return {
      message: `Successfully deleted ${deleteResult.count} photo(s).`,
      deletedCount: deleteResult.count,
    };
  }
}

module.exports = new PhotoService();
