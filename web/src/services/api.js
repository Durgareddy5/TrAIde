import axios from 'axios';
import useAuthStore from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor - Attach Token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Handle Errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const { response } = error;

    if (response) {
      // 401 - Unauthorized
      if (response.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }

      // Return structured error
      return Promise.reject({
        status: response.status,
        message: response.data?.message || 'Something went wrong',
        errors: response.data?.errors || null,
        code: response.data?.error_code || null,
      });
    }

    // Network error
    return Promise.reject({
      status: 0,
      message: 'Network error. Please check your connection.',
      errors: null,
      code: 'NETWORK_ERROR',
    });
  }
);

export default api;