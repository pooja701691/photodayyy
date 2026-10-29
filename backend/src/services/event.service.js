const prisma = require('../config/database');
const QRCode = require('qrcode');
const faceDetectionService = require('./faceDetection.service');
const qdrantService = require('./qdrant.service');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUUID(id) {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

class EventService {
  async createEvent({ name, date, location, description, photographerId }) {
    if (!name || !date || !location) {
      const error = new Error('Event name, date, and location are required.');
      error.statusCode = 400;
      throw error;
    }

    const event = await prisma.event.create({
      data: {
        name,
        date: new Date(date),
        location,
        description: description || null,
        photographerId,
      },
    });

    return event;
  }

  async getMyEvents(photographerId, filters = {}) {
    const { search, isPublic, sortBy = 'createdAt', order = 'desc' } = filters;

    const whereClause = {
      photographerId,
    };

    // Filter by public/private status if specified
    if (isPublic !== undefined && isPublic !== '') {
      whereClause.isPublic = isPublic === 'true' || isPublic === true;
    }

    // Search by event name or location
    if (search && typeof search === 'string' && search.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { location: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Safe sorting fields
    const allowedSortFields = ['createdAt', 'date', 'name'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validOrder = String(order).toLowerCase() === 'asc' ? 'asc' : 'desc';

    return prisma.event.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { photos: true },
        },
      },
      orderBy: { [validSortBy]: validOrder },
    });
  }

  async getEventDetails(eventId, photographerId) {
    if (!isValidUUID(eventId)) {
      const error = new Error('Invalid or malformed event ID.');
      error.statusCode = 400;
      throw error;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { photos: true },
        },
      },
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

    return event;
  }

  async togglePublic(eventId, photographerId, isPublic) {
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

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        isPublic: Boolean(isPublic),
      },
    });

    return updatedEvent;
  }

  async generateEventQr(eventId, photographerId, frontendBaseUrl = 'http://localhost:5173') {
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

    const publicUrl = `${frontendBaseUrl.replace(/\/$/, '')}/event/${eventId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
    });

    return {
      eventId,
      publicUrl,
      qrCodeDataUrl,
      isPublic: event.isPublic,
    };
  }

  async getPublicEventDetails(eventId) {
    if (!isValidUUID(eventId)) {
      const error = new Error('Invalid or malformed event ID.');
      error.statusCode = 400;
      throw error;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        date: true,
        location: true,
        description: true,
        isPublic: true,
        createdAt: true,
        photographer: {
          select: {
            id: true,
            name: true,
          },
        },
        photos: {
          take: 1,
          select: {
            imageUrl: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!event) {
      const error = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!event.isPublic) {
      const error = new Error('This event is currently unavailable.');
      error.statusCode = 403;
      throw error;
    }

    const coverImage = event.photos && event.photos.length > 0 ? event.photos[0].imageUrl : null;

    return {
      id: event.id,
      name: event.name,
      date: event.date,
      location: event.location,
      description: event.description,
      isPublic: event.isPublic,
      coverImage: coverImage,
      coverImageUrl: coverImage,
      createdAt: event.createdAt,
      photographer: event.photographer,
    };
  }

  async getPublicEventPhotos(eventId) {
    if (!isValidUUID(eventId)) {
      const error = new Error('Invalid or malformed event ID.');
      error.statusCode = 400;
      throw error;
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, isPublic: true },
    });

    if (!event) {
      const error = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!event.isPublic) {
      const error = new Error('This event is currently unavailable.');
      error.statusCode = 403;
      throw error;
    }

    return prisma.photo.findMany({
      where: { eventId },
      select: {
        id: true,
        imageUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Matches an uploaded guest selfie against all indexed photos in an event using Qdrant vector search.
   *
   * @param {string} eventId - UUID of the event
   * @param {Buffer} selfieBuffer - Raw image buffer of guest selfie
   * @returns {Promise<{ success: boolean, count: number, photos: Array, message?: string }>}
   */
  async matchEventPhotosWithSelfie(eventId, selfieBuffer) {
    if (!isValidUUID(eventId)) {
      const error = new Error('Invalid or malformed event ID.');
      error.statusCode = 400;
      throw error;
    }

    if (!selfieBuffer || !Buffer.isBuffer(selfieBuffer)) {
      const error = new Error('Selfie image is required. Please upload a clear selfie.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Check event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, isPublic: true },
    });

    if (!event) {
      const error = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Check event is public
    if (!event.isPublic) {
      const error = new Error('This event is currently unavailable.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Detect face and generate 128-d embedding from selfie
    const detections = await faceDetectionService.detectAndEmbedFaces(selfieBuffer);
    if (!detections || detections.length === 0) {
      const error = new Error('No face detected. Please upload a clear selfie.');
      error.statusCode = 400;
      throw error;
    }

    // Pick primary face (largest face area)
    const sortedDetections = [...detections].sort((a, b) => {
      const areaA = (a.box?.width || 0) * (a.box?.height || 0);
      const areaB = (b.box?.width || 0) * (b.box?.height || 0);
      return areaB - areaA;
    });
    const primaryFace = sortedDetections[0];
    const selfieEmbedding = primaryFace.embedding;

    // 4. Search Qdrant vector database restricted strictly to this event
    const searchResults = await qdrantService.searchFacesByEmbedding(selfieEmbedding, eventId, {
      limit: 100,
      scoreThreshold: 0.60,
    });

    if (!searchResults || searchResults.length === 0) {
      return {
        success: true,
        count: 0,
        photos: [],
        message: 'No matching photos found in this event.',
      };
    }

    // 5. Map unique photo IDs and retain highest match score per photo
    const photoScoreMap = new Map();
    for (const match of searchResults) {
      const photoId = match.payload?.photoId;
      if (!photoId) continue;
      const existing = photoScoreMap.get(photoId);
      if (!existing || match.score > existing.score) {
        photoScoreMap.set(photoId, {
          score: parseFloat(match.score.toFixed(4)),
        });
      }
    }

    const photoIds = Array.from(photoScoreMap.keys());
    if (photoIds.length === 0) {
      return {
        success: true,
        count: 0,
        photos: [],
        message: 'No matching photos found in this event.',
      };
    }

    // 6. Query photo records from DB to ensure they still exist and belong to this event
    const photos = await prisma.photo.findMany({
      where: {
        id: { in: photoIds },
        eventId: eventId,
      },
      select: {
        id: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    // 7. Enrich with match score and sort descending by similarity
    const matchedPhotos = photos
      .map((photo) => ({
        id: photo.id,
        imageUrl: photo.imageUrl,
        matchScore: photoScoreMap.get(photo.id)?.score || 0,
        createdAt: photo.createdAt,
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    return {
      success: true,
      count: matchedPhotos.length,
      photos: matchedPhotos,
    };
  }
}

module.exports = new EventService();
