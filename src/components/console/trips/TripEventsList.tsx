import { Group, Stack, Text } from '@mantine/core';
import { CHECK_IN_LABEL, END_REASON_LABEL, fmtTime, type EndReason, type TripEvent } from '@/lib/tripsApi';

const COLOR: Record<TripEvent['type'], string | undefined> = {
  started: undefined,
  stop_reached: 'teal',
  stop_skipped: 'orange',
  gps_lost: 'red',
  gps_restored: 'teal',
  stationary: 'orange',
  check_in_requested: 'orange',
  check_in: undefined,
  sos: 'red',
  alert_ack: 'teal',
  ended: undefined,
};

function describe(e: TripEvent): string {
  const p = e.payload as Record<string, string | number | null>;
  switch (e.type) {
    case 'started':
      return `Trip started (${p.direction}) at ${Number(p.lat).toFixed(5)}, ${Number(p.lng).toFixed(5)}`;
    case 'stop_reached':
      return `Reached ${p.name ?? 'stop'}`;
    case 'stop_skipped':
      return `Skipped ${p.name ?? 'stop'}${p.reason ? ` (${END_REASON_LABEL[p.reason as EndReason] ?? p.reason})` : ''}`;
    case 'gps_lost':
      return `GPS lost — last point ${fmtTime(p.lastPingAt as string)}`;
    case 'gps_restored':
      return 'GPS restored';
    case 'stationary':
      return `School alerted: not moving${p.minutes != null ? ` for ${p.minutes} min` : ''}${p.since ? ` (since ${fmtTime(p.since as string)})` : ''}${
        p.reason ? ` — ${CHECK_IN_LABEL[p.reason as string] ?? (p.reason === 'too_long' ? 'stopped too long' : p.reason)}` : ''
      }`;
    case 'check_in_requested':
      return `Driver asked “everything OK?” (not moving ${p.minutes} min)`;
    case 'check_in':
      return `Driver replied: ${CHECK_IN_LABEL[p.response as string] ?? p.response}`;
    case 'sos':
      return `SOS${p.note ? ` — ${p.note}` : ''}${p.lat != null ? ` at ${Number(p.lat).toFixed(5)}, ${Number(p.lng).toFixed(5)}` : ''}`;
    case 'alert_ack':
      return `Acknowledged ${p.type === 'sos' ? 'SOS' : 'alerts'}`;
    case 'ended':
      return `Trip ended — ${END_REASON_LABEL[p.reason as EndReason] ?? p.reason}`;
  }
}

/** Full audit timeline of a trip. */
export function TripEventsList({ events }: { events: TripEvent[] }) {
  if (!events.length) return <Text size="sm" c="dimmed">No events.</Text>;
  return (
    <Stack gap={4}>
      {events.map((e, i) => (
        <Group key={i} gap="sm" wrap="nowrap" align="flex-start">
          <Text size="sm" c="dimmed" w={80} style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {fmtTime(e.at)}
          </Text>
          <Text size="sm" c={COLOR[e.type]}>{describe(e)}</Text>
        </Group>
      ))}
    </Stack>
  );
}
