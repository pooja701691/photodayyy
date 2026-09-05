import apiClient from './apiClient';

export const eventApi = {
  // POST /api/events
  createEvent: async ({ name, date, location, description }) => {
    const response = await apiClient.post('/events', { name, date, location, description });
    return response.data;
  },

  // GET /api/events
  getMyEvents: async () => {
    const response = await apiClient.get('/events');
    return response.data;
  },

  // GET /api/events/:eventId
  getEventDetails: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}`);
    return response.data;
  },

  // PATCH /api/events/:eventId/public
  togglePublic: async (eventId, isPublic) => {
    const response = await apiClient.patch(`/events/${eventId}/public`, { isPublic });
    return response.data;
  },

  // GET /api/events/:eventId/qr
  getEventQr: async (eventId) => {
    const origin = window.location.origin;
    const response = await apiClient.get(`/events/${eventId}/qr?origin=${encodeURIComponent(origin)}`);
    return response.data;
  },
};

export default eventApi;
