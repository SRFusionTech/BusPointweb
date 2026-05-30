'use client';

import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
const reconnectHandlers: Array<() => void> = [];

function getBackendBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';
  return raw.replace(/\/api\/?$/, '');
}

export async function connectTracking(): Promise<Socket> {
  if (socket?.connected) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const token = typeof window === 'undefined' ? null : localStorage.getItem('school_admin_token');

  socket = io(`${getBackendBaseUrl()}/tracking`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: Infinity,
  });

  socket.on('reconnect', () => {
    for (const cb of reconnectHandlers) {
      try {
        cb();
      } catch {
        // ignore reconnect handler failures
      }
    }
  });

  return socket;
}

export function addReconnectHandler(cb: () => void): () => void {
  reconnectHandlers.push(cb);
  return () => {
    const idx = reconnectHandlers.indexOf(cb);
    if (idx !== -1) reconnectHandlers.splice(idx, 1);
  };
}

export function disconnectTracking(): void {
  socket?.disconnect();
  socket = null;
  reconnectHandlers.length = 0;
}