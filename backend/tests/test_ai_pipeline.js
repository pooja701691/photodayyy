const sharp = require('sharp');
const prisma = require('../src/config/database');
const { getRedisClient } = require('../src/config/redis');
const { qdrantClient, COLLECTION_NAME, initQdrantCollection } = require('../src/config/qdrant');
const { faceProcessingQueue, addFaceProcessingJob } = require('../src/queues/faceProcessing.queue');
const faceDetectionService = require('../src/services/faceDetection.service');
const qdrantService = require('../src/services/qdrant.service');
const { processFaceJob } = require('../src/workers/faceEmbedding.worker');

let testPassed = 0;
let testFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    testPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    testFailed++;
  }
}

async function runTests() {
  console.log('========================================================');
  console.log('Starting Photoday AI Pipeline Automated Verification');
  console.log('========================================================\n');

  // Test 1: Redis Connection
  console.log('TEST 1: Redis Connection & Health');
  const redis = getRedisClient();
  const pingRes = await redis.ping();
  assert(pingRes === 'PONG', `Redis ping returned PONG (host: ${redis.options.host})`);

  // Test 2: Qdrant Connection & Collection Config
  console.log('\nTEST 2: Qdrant Collection Initialization & Schema');
  await initQdrantCollection();
  const colInfo = await qdrantClient.getCollection(COLLECTION_NAME);
  assert(colInfo.status === 'green', `Collection '${COLLECTION_NAME}' status is green`);
  assert(colInfo.config.params.vectors.size === 128, 'Vector dimension is exactly 128');
  assert(colInfo.config.params.vectors.distance === 'Cosine', 'Vector distance metric is Cosine');

  // Test 3: Face Detection Service with 0 Faces
  console.log('\nTEST 3: Face Detection Service on Blank Image (0 Faces)');
  const blankBuffer = await sharp({
    create: { width: 150, height: 150, channels: 3, background: { r: 180, g: 180, b: 180 } }
  }).jpeg().toBuffer();
  const blankDetections = await faceDetectionService.detectAndEmbedFaces(blankBuffer);
  assert(Array.isArray(blankDetections) && blankDetections.length === 0, 'Detected 0 faces on blank image');

  // Test 4: Face Detection Service with Real Portrait Image
  console.log('\nTEST 4: Face Detection & 128-d Embedding Extraction');
  // Fetch a reliable sample portrait face
  const sampleFaceUrl = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400';
  const faceImgResp = await fetch(sampleFaceUrl);
  const faceBuffer = Buffer.from(await faceImgResp.arrayBuffer());
  const faceDetections = await faceDetectionService.detectAndEmbedFaces(faceBuffer);
  assert(faceDetections.length >= 1, `Detected ${faceDetections.length} face(s) in sample portrait`);
  if (faceDetections.length > 0) {
    const firstFace = faceDetections[0];
    assert(firstFace.embedding.length === 128, 'Embedding vector length is exactly 128 floats');
    assert(firstFace.score > 0.5, `Confidence score is high: ${firstFace.score}`);
    assert(firstFace.box && firstFace.box.width > 0, `Valid bounding box: ${JSON.stringify(firstFace.box)}`);
  }

  // Setup Test User and Event in Database
  console.log('\nSETUP: Creating Test User and Event in Database');
  let testUser = await prisma.user.findFirst({ where: { email: 'ai-tester@photoday.local' } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        name: 'AI Tester',
        email: 'ai-tester@photoday.local',
        password: 'hashed_password_test',
        role: 'PHOTOGRAPHER',
      },
    });
  }

  let testEvent = await prisma.event.findFirst({ where: { photographerId: testUser.id } });
  if (!testEvent) {
    testEvent = await prisma.event.create({
      data: {
        name: 'AI Test Event',
        date: new Date(),
        location: 'Studio A',
        photographerId: testUser.id,
      },
    });
  }

  // Test 5: Worker Processing 0 Faces Photo
  console.log('\nTEST 5: Worker Processing for Photo with 0 Faces');
  const noFacePhoto = await prisma.photo.create({
    data: {
      eventId: testEvent.id,
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400', // landscape without faces
      cloudinaryPublicId: 'test_no_face_id',
      aiStatus: 'PENDING',
    },
  });

  await processFaceJob({
    id: `test-job-noface-${Date.now()}`,
    data: {
      photoId: noFacePhoto.id,
      eventId: testEvent.id,
      photographerId: testUser.id,
      imageUrl: noFacePhoto.imageUrl,
    },
  });

  const updatedNoFacePhoto = await prisma.photo.findUnique({ where: { id: noFacePhoto.id } });
  assert(updatedNoFacePhoto.aiStatus === 'NO_FACE', `Photo marked as NO_FACE (got: ${updatedNoFacePhoto.aiStatus})`);
  assert(updatedNoFacePhoto.facesCount === 0, 'facesCount is 0 in DB');
  const noFaceQdrantCount = await qdrantService.countEmbeddings(noFacePhoto.id);
  assert(noFaceQdrantCount === 0, 'Zero embeddings stored in Qdrant for 0-face photo');

  // Test 6: Worker Processing Photo with Face (End-to-End)
  console.log('\nTEST 6: Worker Processing for Photo with Faces (End-to-End)');
  const facePhoto = await prisma.photo.create({
    data: {
      eventId: testEvent.id,
      imageUrl: sampleFaceUrl,
      cloudinaryPublicId: 'test_face_id',
      aiStatus: 'PENDING',
    },
  });

  await processFaceJob({
    id: `test-job-face-${Date.now()}`,
    data: {
      photoId: facePhoto.id,
      eventId: testEvent.id,
      photographerId: testUser.id,
      imageUrl: facePhoto.imageUrl,
    },
  });

  const updatedFacePhoto = await prisma.photo.findUnique({
    where: { id: facePhoto.id },
    include: { faceEmbeddings: true },
  });

  assert(updatedFacePhoto.aiStatus === 'COMPLETED', `Photo marked as COMPLETED (got: ${updatedFacePhoto.aiStatus})`);
  assert(updatedFacePhoto.facesCount >= 1, `facesCount in DB is >= 1 (got: ${updatedFacePhoto.facesCount})`);
  assert(updatedFacePhoto.faceEmbeddings.length === updatedFacePhoto.facesCount, 'FaceEmbedding rows in DB match facesCount');

  const qdrantPointsCount = await qdrantService.countEmbeddings(facePhoto.id);
  assert(qdrantPointsCount === updatedFacePhoto.facesCount, `Qdrant contains exactly ${qdrantPointsCount} vectors for this photo`);

  // Verify vector metadata in Qdrant
  const scrollRes = await qdrantClient.scroll(COLLECTION_NAME, {
    filter: { must: [{ key: 'photoId', match: { value: facePhoto.id } }] },
    limit: 1,
    with_payload: true,
    with_vector: true,
  });
  assert(scrollRes.points.length === 1, 'Retrieved vector point from Qdrant');
  if (scrollRes.points.length > 0) {
    const pt = scrollRes.points[0];
    assert(pt.vector.length === 128, 'Qdrant vector length is 128');
    assert(pt.payload.eventId === testEvent.id, `Payload eventId matches (${pt.payload.eventId})`);
    assert(pt.payload.photographerId === testUser.id, `Payload photographerId matches (${pt.payload.photographerId})`);
    assert(pt.payload.box && pt.payload.box.width > 0, `Payload contains bounding box: ${JSON.stringify(pt.payload.box)}`);
  }

  // Test 7: Idempotency Test (Duplicate/Retried Job)
  console.log('\nTEST 7: Idempotency Verification (Re-processing Same Photo)');
  await processFaceJob({
    id: `test-job-retry-${Date.now()}`,
    data: {
      photoId: facePhoto.id,
      eventId: testEvent.id,
      photographerId: testUser.id,
      imageUrl: facePhoto.imageUrl,
    },
  });

  const retryQdrantCount = await qdrantService.countEmbeddings(facePhoto.id);
  assert(retryQdrantCount === updatedFacePhoto.facesCount, `No duplicate points created in Qdrant (still ${retryQdrantCount})`);
  const retryDbCount = await prisma.faceEmbedding.count({ where: { photoId: facePhoto.id } });
  assert(retryDbCount === updatedFacePhoto.facesCount, `No duplicate rows in FaceEmbedding table (still ${retryDbCount})`);

  // Test 8: Queue Enqueueing (Fast & Non-blocking)
  console.log('\nTEST 8: BullMQ Job Enqueueing Speed & Deduplication');
  const t0 = Date.now();
  const enqueuedJob = await addFaceProcessingJob({
    photoId: facePhoto.id,
    eventId: testEvent.id,
    photographerId: testUser.id,
    imageUrl: facePhoto.imageUrl,
  });
  const duration = Date.now() - t0;
  assert(duration < 200, `Job enqueued in ${duration}ms (well under 200ms non-blocking requirement)`);
  assert(enqueuedJob.id === `face-${facePhoto.id}`, `Deterministic job ID created: ${enqueuedJob.id}`);

  // Test 9: Deletion Cleanup
  console.log('\nTEST 9: Qdrant Embeddings Cleanup on Photo Delete');
  await qdrantService.deletePhotoEmbeddings(facePhoto.id);
  const countAfterDelete = await qdrantService.countEmbeddings(facePhoto.id);
  assert(countAfterDelete === 0, 'Embeddings removed from Qdrant on delete');

  // Clean up test DB data
  await prisma.photo.deleteMany({ where: { id: { in: [noFacePhoto.id, facePhoto.id] } } });
  await prisma.event.deleteMany({ where: { id: testEvent.id } });
  await prisma.user.deleteMany({ where: { id: testUser.id } });

  console.log('\n========================================================');
  console.log(`SUMMARY: ${testPassed} Passed, ${testFailed} Failed`);
  console.log('========================================================');

  await faceProcessingQueue.close();
  await redis.disconnect();
  await prisma.$disconnect();

  if (testFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(async (err) => {
  console.error('\nUNHANDLED TEST RUNNER ERROR:', err);
  await prisma.$disconnect();
  process.exit(1);
});
