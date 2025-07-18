import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { getToken } from '@/lib/getToken';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4445/api",
  
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Use InternalAxiosRequestConfig here
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor stays the same
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        console.warn('Unauthorized - redirect or logout');
      } else if (status === 500) {
        console.error('Server Error:', data);
      }
    } else {
      console.error('Network or unknown error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
