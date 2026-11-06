import { StatusPill, type PillTone } from '@/components/console/StatusPill';
import type { Presence } from '@/lib/tripsApi';

const PRESENCE: Record<Presence, { tone: PillTone; label: string }> = {
  live: { tone: 'green', label: 'Live' },
  away: { tone: 'orange', label: 'Away' },
  offline: { tone: 'red', label: 'Offline' },
  not_on_trip: { tone: 'gray', label: 'Not on trip' },
};

/** Teams-style freshness of the bus location. `ago` = "12s ago" etc. */
export function PresencePill({ presence, ago }: { presence: Presence; ago?: string }) {
  const p = PRESENCE[presence];
  return (
    <StatusPill tone={p.tone}>
      {p.label}
      {ago && presence !== 'not_on_trip' ? ` · ${ago}` : ''}
    </StatusPill>
  );
}
