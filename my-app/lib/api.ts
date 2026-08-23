import axios from 'axios';
import { apiBaseUrl } from './config';

const api = axios.create({
  baseURL: apiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  // Auth cookies are HttpOnly. The browser sends them, but JavaScript cannot
  // read or copy them, limiting the impact of an XSS vulnerability.
  withCredentials: true,
  timeout: 20000,
});

/**
 * True when the request never reached the server at all (server down / no network).
 *
 * A timeout is deliberately NOT "offline": the server is there, just slow (a cold
 * Next.js compile, a big query). Treating it as offline used to drop the screen into
 * demo mode, which then 401s against the live API.
 */
export function isOffline(error: unknown): boolean {
  const e = error as { response?: unknown; code?: string };
  if (e?.response) return false;
  if (e?.code === 'ECONNABORTED' || e?.code === 'ETIMEDOUT') return false;
  return true;
}

export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const e = error as {
    response?: { status?: number; data?: { message?: string; errors?: string[] } };
    message?: string;
    code?: string;
  };
  const data = e?.response?.data;
  if (data?.errors?.length) return data.errors.join(', ');
  if (data?.message) return data.message;
  if (e?.code === 'ECONNABORTED' || e?.code === 'ETIMEDOUT') {
    return 'The server took too long to answer. Try again.';
  }
  if (isOffline(error)) return 'Cannot reach the server. Check that the API is running.';
  return e?.message || fallback;
}

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      // A demo token means this session was created while the API was unreachable.
      // A 401 proves the API is answering now, so the fake session is a dead end:
      // clear it and send the user back to a real sign-in instead of leaving the
      // screen showing "Unauthorized" forever.
      if (typeof window !== 'undefined') {
        if (localStorage.getItem('demoMode') === 'true') {
          localStorage.clear();
          window.location.href = '/?expired=demo';
          return Promise.reject(error);
        }
      }

      try {
        const response = await axios.post(
          `${apiBaseUrl()}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

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
