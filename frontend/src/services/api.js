import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  // Don't add bearer token to signing or token-based endpoints
  // These use JWT tokens in the URL or are public endpoints
  const isTokenBasedEndpoint = config.url?.includes('/sign/') || config.url?.includes('/preview/');
  
  if (!isTokenBasedEndpoint) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on token-based endpoints (signing, preview with token)
    // These use JWT tokens in the URL, not bearer tokens
    const isTokenBasedEndpoint = error.config?.url?.includes('/sign/') || error.config?.url?.includes('/preview/');
    
    // Only redirect on 401 if user has a token (token expired) and NOT a token-based endpoint
    // Don't redirect during signin/signup attempts
    if (error.response?.status === 401 && localStorage.getItem('token') && !isTokenBasedEndpoint) {
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const signUp = (userData) => api.post('/auth/signup', userData);
export const signIn = (credentials) => api.post('/auth/signin', credentials);
export const getCurrentUser = () => api.get('/auth/me');

// Token management
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
  delete api.defaults.headers.common.Authorization;
};

export const getAuthToken = () => localStorage.getItem('token');

export const isAuthenticated = () => !!getAuthToken();

export default api;
