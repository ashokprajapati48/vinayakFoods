import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(role?: string): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      query: role ? { role } : undefined,
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return socket;
}

export function connectSocket(role: string): Socket {
  const s = getSocket(role);
  if (!s.connected) {
    s.io.opts.query = { role };
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
