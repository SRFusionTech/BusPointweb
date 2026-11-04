import type { ReactNode } from 'react';

export type PillTone = 'green' | 'orange' | 'red' | 'blue' | 'gray';

const TONE_COLOR: Record<PillTone, string> = {
  green: 'teal',
  orange: 'orange',
  red: 'red',
  blue: 'blue',
  gray: 'gray',
};

/** Soft status pill — tinted background, leading dot, never uppercased or truncated. */
export function StatusPill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  const color = TONE_COLOR[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 8px 2px 7px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '18px',
        whiteSpace: 'nowrap',
        background: `var(--mantine-color-${color}-light)`,
        color: `var(--mantine-color-${color}-light-color)`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
      {children}
    </span>
  );
}
