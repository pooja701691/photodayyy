const { v5: uuidv5 } = require('uuid');
const { qdrantClient, COLLECTION_NAME, initQdrantCollection } = require('../config/qdrant');

// Fixed namespace UUID for generating deterministic UUIDv5 point IDs
const POINT_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

class QdrantService {
  constructor() {
    this.initialized = false;
  }

  async ensureReady() {
    if (!this.initialized) {
      await initQdrantCollection();
      this.initialized = true;
    }
  }

  /**
   * Generates a deterministic UUID for a photo face point.
   */
  generatePointId(photoId, faceIndex) {
    return uuidv5(`${photoId}_face_${faceIndex}`, POINT_NAMESPACE);
  }

  /**
   * Upserts face vector embeddings and metadata for a photo.
   * Cleans up existing points for the photoId first to guarantee idempotency.
   *
   * @param {Array<{ faceIndex: number, score: number, box: Object, embedding: number[] }>} faces
   * @param {Object} metadata
   * @param {string} metadata.photoId
   * @param {string} metadata.eventId
   * @param {string} metadata.photographerId
   * @param {string} metadata.imageUrl
   */
  async upsertFaceEmbeddings(faces, metadata) {
    await this.ensureReady();

    if (!faces || faces.length === 0) {
      return [];
    }

    const { photoId, eventId, photographerId, imageUrl } = metadata;

    // 1. Delete prior points for this photoId to avoid duplicates on retries
    try {
      await qdrantClient.delete(COLLECTION_NAME, {
        wait: true,
        filter: {
          must: [
            {
              key: 'photoId',
              match: { value: photoId },
            },
          ],
        },
      });
    } catch (delErr) {
      console.warn(`[Qdrant] Pre-upsert cleanup for photo ${photoId} noted:`, delErr.message);
    }

    // 2. Prepare points
    const points = faces.map((face) => {
      const pointId = this.generatePointId(photoId, face.faceIndex);
      return {
        id: pointId,
        vector: face.embedding,
        payload: {
          photoId,
          eventId,
          photographerId,
          cloudinaryUrl: imageUrl,
          faceIndex: face.faceIndex,
          confidence: face.score,
          box: face.box,
          createdAt: new Date().toISOString(),
        },
      };
    });

    // 3. Upsert to Qdrant
    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });

    console.log(`[Qdrant] Successfully upserted ${points.length} face vectors for photo ${photoId}`);
    return points;
  }

  /**
   * Deletes all face embeddings for a photo (e.g. when photo is deleted).
   */
  async deletePhotoEmbeddings(photoId) {
    await this.ensureReady();

    await qdrantClient.delete(COLLECTION_NAME, {
      wait: true,
      filter: {
        must: [
          {
            key: 'photoId',
            match: { value: photoId },
          },
        ],
      },
    });

    console.log(`[Qdrant] Deleted embeddings for photo ${photoId}`);
  }

  /**
   * Counts stored embeddings for a photo.
   */
  async countEmbeddings(photoId) {
    await this.ensureReady();

    const result = await qdrantClient.count(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'photoId',
            match: { value: photoId },
          },
        ],
      },
      exact: true,
    });

    return result.count;
  }
}

module.exports = new QdrantService();
