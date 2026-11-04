'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'super_admin' | 'school_admin' | 'driver' | 'parent';

export interface AuthUser {
  email: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  /** Unix ms timestamp when the current access token expires — used for proactive refresh */
  accessTokenExpiresAt: number | null;
  setUser: (user: AuthUser | null) => void;
  setAccessTokenExpiresAt: (ts: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessTokenExpiresAt: null,
      setUser: (user) => set({ user }),
      setAccessTokenExpiresAt: (accessTokenExpiresAt) => set({ accessTokenExpiresAt }),
      logout: () => set({ user: null, accessTokenExpiresAt: null }),
    }),
    {
      name: 'buspoint-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
      }),
    },
  ),
);
