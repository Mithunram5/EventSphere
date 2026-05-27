import axios from 'axios';

// Get API base URL from environment or fallback to localhost
const rawBase = (import.meta.env.VITE_API_URL || '').trim();
const normalizedBase = rawBase.replace(/\/+$/, ''); // remove trailing slashes
// Allow either:
// - VITE_API_URL=https://<render-app>.onrender.com
// - VITE_API_URL=https://<render-app>.onrender.com/api
const API_URL = normalizedBase
  ? (normalizedBase.endsWith('/api') ? normalizedBase : `${normalizedBase}/api`)
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Refresh page to trigger route updates (or let context handle it)
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
