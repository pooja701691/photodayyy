const { Worker } = require('bullmq');
const prisma = require('../config/database');
const { redisConfig } = require('../config/redis');
const { QUEUE_NAME } = require('../queues/faceProcessing.queue');
const faceDetectionService = require('../services/faceDetection.service');
const qdrantService = require('../services/qdrant.service');

/**
 * Downloads an image from a URL into a Buffer.
 */
async function downloadImageBuffer(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Job processing function for BullMQ.
 */
async function processFaceJob(job) {
  const { photoId, eventId, photographerId, imageUrl } = job.data;
  console.log(`[Worker] Starting face processing job ${job.id} for photo ${photoId}`);

  // 1. Mark photo status as PROCESSING in database
  await prisma.photo.update({
    where: { id: photoId },
    data: {
      aiStatus: 'PROCESSING',
      aiError: null,
    },
  });

  // 2. Download image buffer
  const imageBuffer = await downloadImageBuffer(imageUrl);

  // 3. Detect faces and calculate 128-d embeddings
  const faces = await faceDetectionService.detectAndEmbedFaces(imageBuffer);
  console.log(`[Worker] Photo ${photoId}: detected ${faces.length} face(s)`);

  // 4. Handle 0 faces case
  if (faces.length === 0) {
    await prisma.photo.update({
      where: { id: photoId },
      data: {
        aiStatus: 'NO_FACE',
        facesCount: 0,
        processedAt: new Date(),
        aiError: null,
      },
    });

    return { photoId, status: 'NO_FACE', facesCount: 0 };
  }

  // 5. Handle ≥ 1 faces: upsert embeddings to Qdrant
  const points = await qdrantService.upsertFaceEmbeddings(faces, {
    photoId,
    eventId,
    photographerId,
    imageUrl,
  });

  // 6. Clean up prior DB face records for idempotency and insert new ones
  await prisma.faceEmbedding.deleteMany({
    where: { photoId },
  });

  await prisma.faceEmbedding.createMany({
    data: faces.map((face) => ({
      photoId,
      qdrantPointId: qdrantService.generatePointId(photoId, face.faceIndex),
      faceIndex: face.faceIndex,
      boxX: face.box.x,
      boxY: face.box.y,
      boxWidth: face.box.width,
      boxHeight: face.box.height,
      confidence: face.score,
    })),
  });

  // 7. Update photo status to COMPLETED
  await prisma.photo.update({
    where: { id: photoId },
    data: {
      aiStatus: 'COMPLETED',
      facesCount: faces.length,
      processedAt: new Date(),
      aiError: null,
    },
  });

  console.log(`[Worker] Photo ${photoId}: successfully processed with ${faces.length} face(s)`);
  return { photoId, status: 'COMPLETED', facesCount: faces.length };
}

// Instantiate BullMQ Worker
const worker = new Worker(QUEUE_NAME, processFaceJob, {
  connection: redisConfig,
  concurrency: 2,
});

worker.on('completed', (job, result) => {
  console.log(`[Worker] Job ${job.id} completed. Result:`, result);
});

worker.on('failed', async (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed on attempt ${job?.attemptsMade}:`, err.message);

  if (job?.data?.photoId && job.attemptsMade >= (job.opts?.attempts || 3)) {
    console.error(`[Worker] Job ${job.id} exhausted all retry attempts. Marking Photo as FAILED.`);
    try {
      await prisma.photo.update({
        where: { id: job.data.photoId },
        data: {
          aiStatus: 'FAILED',
          aiError: err.message,
          processedAt: new Date(),
        },
      });
    } catch (dbErr) {
      console.error('[Worker] Failed to update photo status to FAILED in DB:', dbErr.message);
    }
  }
});

worker.on('error', (err) => {
  console.error('[Worker] Worker internal error:', err.message);
});

console.log(`[Worker] AI Face Embedding Worker is running and listening on queue '${QUEUE_NAME}'...`);

// Graceful shutdown
async function gracefulShutdown() {
  console.log('[Worker] Shutting down worker gracefully...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = {
  worker,
  processFaceJob,
};
