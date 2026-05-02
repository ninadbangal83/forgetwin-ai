import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '@/constants/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('forgetwin_token');
      if (token) {
        const isAbsolute = config.url?.startsWith('http://') || config.url?.startsWith('https://');
        const isApiBaseUrl = config.url?.startsWith(API_BASE_URL);
        if (!isAbsolute || isApiBaseUrl) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] status ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[API Response Error]', error);
    return Promise.reject(error);
  }
);
