import type { ReactNode } from 'react';

export type PillTone = 'green' | 'orange' | 'red' | 'blue' | 'gray' | 'teal';

/** Tone → semantic token group (tokens.generated.css). */
const TONE: Record<PillTone, string> = {
  green: 'success',
  orange: 'warning',
  red: 'danger',
  blue: 'info',
  gray: 'neutral',
  teal: 'success',
};

/** Soft status pill — tinted background, leading dot, never uppercased or truncated. */
export function StatusPill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  const g = TONE[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px 2px 8px',
        borderRadius: 'var(--mantine-radius-xl)',
        fontSize: 'var(--mantine-font-size-xs)',
        fontWeight: 600,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
        background: `var(--bp-status-${g}-bg)`,
        color: `var(--bp-status-${g}-text)`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: `var(--bp-status-${g}-solid)`, flexShrink: 0 }} />
      {children}
    </span>
  );
}
