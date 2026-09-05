import apiClient from './apiClient';

export const photoApi = {
  // POST /api/events/:eventId/photos
  uploadPhotos: async (eventId, formData, onUploadProgress) => {
    const response = await apiClient.post(`/events/${eventId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  // GET /api/events/:eventId/photos
  getEventPhotos: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}/photos`);
    return response.data;
  },

  // DELETE /api/photos/:photoId
  deletePhoto: async (photoId) => {
    const response = await apiClient.delete(`/photos/${photoId}`);
    return response.data;
  },
};

export default photoApi;
