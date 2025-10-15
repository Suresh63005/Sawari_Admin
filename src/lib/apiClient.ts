import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { getToken } from '@/lib/getToken';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4445/api",
  // baseURL: process.env.NEXT_PUBLIC_API_URL || "https://sawari-api.innoitlabs.net/api",
  // baseURL: process.env.NEXT_PUBLIC_API_URL || "https://sawari-server.vercel.app/api",
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error('Response error:', { status, data }); // Debug log
    //   if (status === 401) {
    //     console.log('Unauthorized, clearing token and redirecting'); // Debug log
    //     localStorage.removeItem('token');
    //     if (window.location.pathname !== '/login') {
    //       window.location.href = '/login';
    //     }
    //   } else if (status === 500) {
    //     console.error('Server Error:', data);
    //   }
    } else {
      console.error('Network or unknown error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

