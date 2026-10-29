import axios from 'axios';

// Use /api by default, proxied by Vite dev server to backend or configured by env
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: Attach JWT token automatically if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('photodey_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle common HTTP responses & expired tokens (401)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (e.g. token expired, invalid token)
    if (error.response && error.response.status === 401) {
      // Don't redirect if already on login or register or public routes
      const isAuthPath =
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/register') ||
        window.location.pathname.startsWith('/public') ||
        window.location.pathname.startsWith('/event');

      if (!isAuthPath && !originalRequest._retry) {
        localStorage.removeItem('photodey_token');
        localStorage.removeItem('photodey_user');
        window.location.href = '/login?expired=true';
      }
    }

    // Standardize error message from backend
    const customError = new Error(
      error.response?.data?.message || error.message || 'An unexpected error occurred.'
    );
    customError.status = error.response?.status;
    customError.data = error.response?.data;

    return Promise.reject(customError);
  }
);

export default apiClient;
