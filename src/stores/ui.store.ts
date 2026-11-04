'use client';

import { create } from 'zustand';

interface UiState {
  /** Full-page loader: set a message or null to dismiss */
  pageLoader: string | null;
  showPageLoader: (message?: string) => void;
  hidePageLoader: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  pageLoader: null,
  showPageLoader: (message = 'Loading…') => set({ pageLoader: message }),
  hidePageLoader: () => set({ pageLoader: null }),
}));
