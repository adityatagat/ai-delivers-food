import axios from 'axios';

// Create axios instance with base URL for the backend API
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000',
});

// Add a request interceptor to include the auth token in all requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the request headers
    if (token) {
      // Ensure headers object exists
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const api = {
  get: <T>(url: string) => axiosInstance.get<T>(url),
  post: <T>(url: string, data: any) => axiosInstance.post<T>(url, data),
};

export { api }; 