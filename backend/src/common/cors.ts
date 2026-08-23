/**
 * Shared CORS origin resolution for the HTTP server and the Socket.IO gateway.
 *
 * CORS_ORIGIN accepts a comma-separated list ("http://localhost:3000,http://192.168.1.5:3000").
 * When it is not set we allow localhost plus private LAN addresses so kitchen tablets and
 * counter machines on the same Wi-Fi can reach the API without extra configuration.
 */

const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
const LAN_ORIGIN =
  /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

export type CorsOriginCallback = (
  err: Error | null,
  allow?: boolean | string,
) => void;

export function configuredOrigins(): string[] {
  return (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

export function isOriginAllowed(origin?: string): boolean {
  // Same-origin / non-browser callers (curl, health checks) send no Origin header.
  if (!origin) return true;

  const normalized = origin.replace(/\/$/, '');
  const allowList = configuredOrigins();

  if (allowList.includes('*')) return true;
  if (allowList.includes(normalized)) return true;

  // No explicit allow-list → permit local machine and private-network devices.
  if (allowList.length === 0) {
    return LOCAL_ORIGIN.test(normalized) || LAN_ORIGIN.test(normalized);
  }

  return false;
}

export function corsOrigin(origin: string | undefined, cb: CorsOriginCallback) {
  if (isOriginAllowed(origin)) {
    cb(null, true);
    return;
  }
  cb(new Error(`Origin ${origin ?? 'unknown'} is not allowed by CORS`));
}
