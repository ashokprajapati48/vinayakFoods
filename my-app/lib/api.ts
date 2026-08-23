import axios from 'axios';
import { apiBaseUrl } from './config';

const api = axios.create({
  baseURL: apiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

/** True when the request never reached the server (server down / no network). */
export function isOffline(error: unknown): boolean {
  const e = error as { response?: unknown; code?: string };
  return !e?.response || e.code === 'ECONNABORTED' || e.code === 'ERR_NETWORK';
}

/** Best-effort human-readable message from an API error. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const e = error as {
    response?: { data?: { message?: string; errors?: string[] } };
    message?: string;
  };
  const data = e?.response?.data;
  if (data?.errors?.length) return data.errors.join(', ');
  if (data?.message) return data.message;
  if (isOffline(error)) return 'Cannot reach the server. Check that the API is running.';
  return e?.message || fallback;
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      // Demo tokens start with 'demo-'. In offline demo mode there is nothing to
      // refresh, so let the calling screen fall back to local data instead of
      // wiping the session and bouncing to the login page.
      if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken?.startsWith('demo-')) {
          return Promise.reject(error);
        }
      }

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          localStorage.clear();
          window.location.href = '/';
          return Promise.reject(error);
        }

        const response = await axios.post(`${apiBaseUrl()}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
