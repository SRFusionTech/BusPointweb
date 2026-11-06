'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'super_admin' | 'school_admin' | 'driver' | 'parent';

export interface AuthSchool {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface AuthUser {
  email: string | null;
  role: UserRole;
  fullName?: string | null;
  /** undefined = not loaded yet; null = user has no school (super admin) */
  school?: AuthSchool | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Unix ms timestamp when the access token expires */
  accessTokenExpiresAt: number;
}

interface AuthState {
  user: AuthUser | null;
  /** Sent as `Authorization: Bearer <accessToken>` on every API call */
  accessToken: string | null;
  /** Posted to /auth/refresh and /auth/logout */
  refreshToken: string | null;
  /** Unix ms timestamp when the current access token expires — used for proactive refresh */
  accessTokenExpiresAt: number | null;
  setUser: (user: AuthUser | null) => void;
  setTokens: (tokens: AuthTokens) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      setUser: (user) => set({ user }),
      setTokens: ({ accessToken, refreshToken, accessTokenExpiresAt }) =>
        set({ accessToken, refreshToken, accessTokenExpiresAt }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, accessTokenExpiresAt: null }),
    }),
    {
      name: 'buspoint-auth',
      // localStorage so the session survives reloads and is shared across tabs
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
      }),
    },
  ),
);

// Keep tabs in sync: when another tab rotates tokens (or logs out), adopt its state so this tab
// never posts an already-used refresh token.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'buspoint-auth') void useAuthStore.persist.rehydrate();
  });
}
