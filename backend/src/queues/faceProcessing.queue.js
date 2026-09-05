const { Queue } = require('bullmq');
const { redisConfig } = require('../config/redis');

const QUEUE_NAME = 'face-processing';

const faceProcessingQueue = new Queue(QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 500,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 1000,
    },
  },
});

/**
 * Enqueues a face processing job for an uploaded photo.
 * Uses a deterministic job ID (face-{photoId}) to avoid duplicate processing.
 *
 * @param {Object} payload
 * @param {string} payload.photoId - Database ID of the photo
 * @param {string} payload.eventId - Event ID
 * @param {string} payload.photographerId - Photographer/User ID
 * @param {string} payload.imageUrl - Cloudinary URL of the image
 */
async function addFaceProcessingJob({ photoId, eventId, photographerId, imageUrl }) {
  if (!photoId || !eventId || !photographerId || !imageUrl) {
    throw new Error('Missing required fields for face processing job');
  }

  const job = await faceProcessingQueue.add(
    'process-photo-faces',
    {
      photoId,
      eventId,
      photographerId,
      imageUrl,
    },
    {
      jobId: `face-${photoId}`,
    }
  );

  console.log(`[Queue] Enqueued face processing job ${job.id} for photo ${photoId}`);
  return job;
}

module.exports = {
  faceProcessingQueue,
  addFaceProcessingJob,
  QUEUE_NAME,
};
