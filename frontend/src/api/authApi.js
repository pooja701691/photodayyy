import apiClient from './apiClient';

export const authApi = {
  // POST /api/auth/register
  register: async ({ name, email, password }) => {
    const response = await apiClient.post('/auth/register', { name, email, password });
    return response.data;
  },

  // POST /api/auth/login
  login: async ({ email, password }) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  // GET /api/auth/me
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

export default authApi;
