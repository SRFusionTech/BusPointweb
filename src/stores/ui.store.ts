'use client';

import { create } from 'zustand';

interface UiState {
  /** Full-screen blocking loader message (null = hidden), e.g. during sign-in/out. */
  pageLoader: string | null;
  showPageLoader: (message?: string) => void;
  hidePageLoader: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  pageLoader: null,
  showPageLoader: (message = 'Loading…') => set({ pageLoader: message }),
  hidePageLoader: () => set({ pageLoader: null }),
}));
