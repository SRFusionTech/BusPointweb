export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'buspoint-theme';

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return null;
}

export function setStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}
