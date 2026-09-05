const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || undefined;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'photoday_faces';
const VECTOR_SIZE = 128; // Matches FaceRecognitionNet 128-dimensional embedding

const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
  checkCompatibility: false,
});

/**
 * Ensures the photoday_faces collection exists with 128-dim Cosine vectors
 * and payload indexes for fast filtered lookups.
 */
async function initQdrantCollection() {
  try {
    const { collections } = await qdrantClient.getCollections();
    const exists = collections.some((col) => col.name === COLLECTION_NAME);

    if (!exists) {
      console.log(`[Qdrant] Collection '${COLLECTION_NAME}' does not exist. Creating...`);
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      });
      console.log(`[Qdrant] Collection '${COLLECTION_NAME}' created successfully.`);

      // Create payload indexes for fast filtering
      const indexFields = ['photoId', 'eventId', 'photographerId'];
      for (const field of indexFields) {
        try {
          await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
            field_name: field,
            field_schema: 'keyword',
            wait: true,
          });
          console.log(`[Qdrant] Created payload index for field '${field}'.`);
        } catch (idxErr) {
          console.warn(`[Qdrant] Payload index for '${field}' skipped/failed:`, idxErr.message);
        }
      }
    } else {
      console.log(`[Qdrant] Collection '${COLLECTION_NAME}' is ready.`);
    }
  } catch (error) {
    console.error('[Qdrant] Error initializing collection:', error.message);
    throw error;
  }
}

module.exports = {
  qdrantClient,
  COLLECTION_NAME,
  VECTOR_SIZE,
  initQdrantCollection,
};
