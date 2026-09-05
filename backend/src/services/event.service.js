const prisma = require('../config/database');
const QRCode = require('qrcode');

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

  async getMyEvents(photographerId) {
    return prisma.event.findMany({
      where: { photographerId },
      include: {
        _count: {
          select: { photos: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEventDetails(eventId, photographerId) {
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

    const publicUrl = `${frontendBaseUrl.replace(/\/$/, '')}/public/events/${eventId}`;
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
      },
    });

    if (!event) {
      const error = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }

    if (!event.isPublic) {
      const error = new Error('This event is private. Public access is disabled.');
      error.statusCode = 403;
      throw error;
    }

    return event;
  }

  async getPublicEventPhotos(eventId) {
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
      const error = new Error('This event is private. Public access is disabled.');
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
}

module.exports = new EventService();
