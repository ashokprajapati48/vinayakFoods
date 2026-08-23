/**
 * Where the API lives.
 *
 * Priority:
 *  1. NEXT_PUBLIC_API_URL (explicit configuration wins)
 *  2. Same host as the page on port 3001 — so a kitchen tablet opening
 *     http://192.168.1.5:3000 talks to http://192.168.1.5:3001 instead of its own
 *     localhost, which is nothing.
 *  3. http://localhost:3001 for local development / SSR.
 */
const DEFAULT_API_PORT = '3001';

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) {
    return stripTrailingSlash(configured).replace(/\/api$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const isLocal =
      hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
    if (!isLocal) {
      return `${protocol}//${hostname}:${DEFAULT_API_PORT}`;
    }
  }

  return `http://localhost:${DEFAULT_API_PORT}`;
}

export function apiBaseUrl(): string {
  return `${apiOrigin()}/api`;
}

export function socketUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (configured) return stripTrailingSlash(configured);
  return apiOrigin();
}
