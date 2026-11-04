'use client';

import { useUiStore } from '@/stores/ui.store';

export function PageLoader() {
  const message = useUiStore((s) => s.pageLoader);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-white/80 backdrop-blur-sm dark:bg-neutral-950/80"
    >
      {/* Spinner */}
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-4 border-[var(--color-primary-100)]" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--color-primary-600)]" />
      </div>

      {/* BusPoint wordmark */}
      <span className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
        BusPoint
      </span>

      {/* Message */}
      <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
    </div>
  );
}
