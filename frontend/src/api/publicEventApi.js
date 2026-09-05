import apiClient from './apiClient';

export const publicEventApi = {
  // GET /api/public/events/:eventId
  getPublicEvent: async (eventId) => {
    const response = await apiClient.get(`/public/events/${eventId}`);
    return response.data;
  },

  // GET /api/public/events/:eventId/photos
  getPublicEventPhotos: async (eventId) => {
    const response = await apiClient.get(`/public/events/${eventId}/photos`);
    return response.data;
  },
};

export default publicEventApi;
