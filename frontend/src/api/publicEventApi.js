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

  // POST /api/public/events/:eventId/match
  matchPhotos: async (eventId, selfieFile) => {
    const formData = new FormData();
    formData.append('selfie', selfieFile);
    const response = await apiClient.post(`/public/events/${eventId}/match`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default publicEventApi;
