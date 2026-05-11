import axios from 'axios';

console.log('API Base URL:', import.meta.env.VITE_API_URL);

// Create axios instance with default configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
  },
});

let isRedirectingToSignin = false;

const isSigninRequest = (config = {}) => {
  return config.url?.includes('/auth/admin/signin');
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('name');

  if (
    typeof window !== 'undefined' &&
    window.location.pathname !== '/signin' &&
    !isRedirectingToSignin
  ) {
    isRedirectingToSignin = true;
    window.location.replace('/signin');
  }
};

const isUnauthorizedPayload = (data) => {
  const message = typeof data?.message === 'string' ? data.message.toLowerCase() : '';
  return data?.statusCode === 401 || message.includes('expired token');
};

// Request interceptor to add auth token if available and set Content-Type for FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If data is FormData, set Content-Type to multipart/form-data
    if (config.data instanceof FormData) {
      // Let the browser set the correct Content-Type with boundary
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    if (!isSigninRequest(response.config) && isUnauthorizedPayload(response.data)) {
      clearAuthAndRedirect();

      const authError = new Error(response.data?.message || 'Unauthorized');
      authError.response = response;
      return Promise.reject(authError);
    }

    return response;
  },
  (error) => {
    if (!isSigninRequest(error.config) && error.response?.status === 401) {
      clearAuthAndRedirect();
    }
    return Promise.reject(error);
  }
);

export default api;
