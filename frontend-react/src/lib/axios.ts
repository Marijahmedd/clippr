import axios from 'axios';
import { useVideoStore } from '@/stores/videoStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Request interceptor to automatically add auth token
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized without forcing navigation to avoid loops
    if (error.response?.status === 401) {
      const { isAuthenticated, logout } = useVideoStore.getState();
      if (isAuthenticated) {
        logout();
      }
      // Do NOT hard redirect; let routes handle based on auth state
    }
    return Promise.reject(error);
  }
);

export default api;
