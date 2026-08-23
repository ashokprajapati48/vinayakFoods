import { io, Socket } from 'socket.io-client';
import { socketUrl } from './config';

let socket: Socket | null = null;

function storedRole(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return undefined;
    return (JSON.parse(raw) as { role?: string }).role;
  } catch {
    return undefined;
  }
}

/**
 * Single shared connection. Pages get it through `useOrderEvents`; the auth
 * context connects it as soon as a user is known.
 */
export function getSocket(role?: string): Socket {
  if (!socket) {
    const activeRole = role || storedRole();
    socket = io(socketUrl(), {
      query: activeRole ? { role: activeRole } : undefined,
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      // Keep retrying: a kitchen screen left open overnight must recover on its own.
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
      timeout: 8000,
    });

    if (typeof window !== 'undefined') {
      // Handy for debugging from the browser console.
      (window as unknown as { __socket?: Socket }).__socket = socket;
    }
  }
  return socket;
}

export function connectSocket(role?: string): Socket {
  const s = getSocket(role);
  const activeRole = role || storedRole();
  if (activeRole) {
    s.io.opts.query = { role: activeRole };
  }
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    if (typeof window !== 'undefined') {
      delete (window as unknown as { __socket?: Socket }).__socket;
    }
  }
}

export function isSocketConnected(): boolean {
  return Boolean(socket?.connected);
}
