'use client';

import { Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === 'light' ? 'dark' : 'light';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-[color-mix(in_srgb,currentColor_12%,transparent)]"
    >
      {theme === 'light' ? <Moon size={20} weight="regular" /> : <Sun size={20} weight="regular" />}
    </button>
  );
}
