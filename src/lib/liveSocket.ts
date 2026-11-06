'use client';

import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import { tripsApi, type TripSnapshot } from '@/lib/tripsApi';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/**
 * Live push for the school console (Socket.IO namespace `/live`).
 * School admins receive 'trip:update' with the full snapshot of every trip in their school.
 */
export function connectLive(handlers: { onTrip: (t: TripSnapshot) => void; onConnection: (connected: boolean) => void }): () => void {
  let refreshing = false;
  const socket: Socket = io(`${BASE}/live`, {
    transports: ['websocket'],
    // Re-read on every (re)connect so a refreshed token is used.
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken ?? '' }),
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 15_000,
  });
  socket.on('connect', () => handlers.onConnection(true));
  socket.on('disconnect', () => handlers.onConnection(false));
  socket.on('trip:update', handlers.onTrip);
  socket.on('auth_error', () => {
    // Access token expired → any API call refreshes it, then reconnect.
    if (refreshing) return;
    refreshing = true;
    tripsApi
      .fleet()
      .catch(() => undefined)
      .finally(() => {
        refreshing = false;
        socket.connect();
      });
  });
  return () => {
    socket.removeAllListeners();
    socket.disconnect();
  };
}
