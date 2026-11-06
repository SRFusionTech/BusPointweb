'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Alert, Anchor, Button, Grid, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { DetailRows, PlateChip } from '@/components/console/DetailSection';
import { PresencePill } from '@/components/console/trips/PresencePill';
import { TripStopsTable } from '@/components/console/trips/TripStopsTable';
import { errorMessage, notify } from '@/lib/notify';
import {
  CHECK_IN_LABEL, DIRECTION_LABEL, fmtAgo, fmtDistance, fmtDuration, fmtTime, tripsApi,
  type FleetBus, type TripSnapshot,
} from '@/lib/tripsApi';

/** One bus: alerts (with acknowledge), driver / route / trip details, and every stop of the running trip. */
export function BusTripDetails({ item, skewMs, now, onUpdated }: { item: FleetBus; skewMs: number; now: number; onUpdated: (t: TripSnapshot) => void }) {
  const t = item.trip;
  const [acking, setAcking] = useState<'sos' | 'alerts' | null>(null);

  async function ack(type: 'sos' | 'alerts') {
    if (!t) return;
    setAcking(type);
    try {
      const res = await tripsApi.ack(t.id, type);
      onUpdated(res.data);
      notify.success(type === 'sos' ? 'SOS acknowledged.' : 'Alerts acknowledged.');
    } catch (e) {
      notify.error(errorMessage(e, 'Could not acknowledge.'));
    } finally {
      setAcking(null);
    }
  }

  const alerts = t?.alerts;
  const needsAck =
    !!alerts && ((alerts.gpsLost && !alerts.gpsLost.acknowledgedAt) || (alerts.stationary && !alerts.stationary.acknowledgedAt));
  return (
    <Paper withBorder radius="md" p="md" mt="lg">
      <Group justify="space-between" mb="sm">
        <Group gap="sm">
          <Title order={4}>{item.bus.name}</Title>
          <PlateChip plate={item.bus.plateNumber} />
          <PresencePill presence={item.presence} ago={t ? fmtAgo(t.live?.lastPingAt, skewMs, now) : undefined} />
        </Group>
        {t && <Anchor component={Link} href={`/trips/${t.id}`} size="sm">Open trip record →</Anchor>}
      </Group>

      {alerts && (alerts.sos || alerts.gpsLost || alerts.stationary || alerts.checkIn) && (
        <Stack gap="xs" mb="md">
          {alerts.sos && (
            <Alert color="red" variant={alerts.sos.acknowledgedAt ? 'light' : 'filled'} title={`SOS at ${fmtTime(alerts.sos.at)}`}>
              <Group justify="space-between" wrap="wrap">
                <Text size="sm">
                  {alerts.sos.note ?? 'Driver pressed SOS.'} Driver: {item.driver?.fullName ?? '—'} {item.driver?.phone ? `· ${item.driver.phone}` : ''}
                  {alerts.sos.acknowledgedAt ? ` · Acknowledged ${fmtTime(alerts.sos.acknowledgedAt)}` : ''}
                </Text>
                {!alerts.sos.acknowledgedAt && (
                  <Button size="xs" color="dark" loading={acking === 'sos'} onClick={() => void ack('sos')}>Acknowledge SOS</Button>
                )}
              </Group>
            </Alert>
          )}
          {(alerts.gpsLost || alerts.stationary) && (
            <Alert color="orange" title="Alerts">
              <Group justify="space-between" wrap="wrap">
                <Stack gap={2}>
                  {alerts.gpsLost && <Text size="sm">GPS lost since {fmtTime(alerts.gpsLost.since)}{alerts.gpsLost.acknowledgedAt ? ' · seen' : ''}</Text>}
                  {alerts.stationary && (
                    <Text size="sm">
                      Not moving for {alerts.stationary.minutes} min (since {fmtTime(alerts.stationary.since)})
                      {alerts.stationary.reason ? ` — driver: ${CHECK_IN_LABEL[alerts.stationary.reason] ?? alerts.stationary.reason}` : ' — no reply from driver'}
                      {alerts.stationary.acknowledgedAt ? ' · seen' : ''}
                    </Text>
                  )}
                </Stack>
                {needsAck && <Button size="xs" variant="light" loading={acking === 'alerts'} onClick={() => void ack('alerts')}>Acknowledge</Button>}
              </Group>
            </Alert>
          )}
          {alerts.checkIn && (
            <Text size="sm" c="dimmed">
              Driver asked “everything OK?” at {fmtTime(alerts.checkIn.requestedAt)} —{' '}
              {alerts.checkIn.response ? `replied “${CHECK_IN_LABEL[alerts.checkIn.response] ?? alerts.checkIn.response}” at ${fmtTime(alerts.checkIn.respondedAt)}` : 'waiting for reply'}
            </Text>
          )}
        </Stack>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <DetailRows
            rows={[
              { label: 'Driver', value: item.driver ? `${item.driver.fullName ?? '—'} ${item.driver.phone ? `(${item.driver.phone})` : ''}` : 'Not assigned' },
              { label: 'Route', value: item.route?.name ?? 'Not set' },
              { label: 'Return route', value: item.returnRoute?.name ?? 'Same route (reversed)' },
              { label: 'Capacity', value: item.bus.capacity ?? '—' },
            ]}
          />
        </Grid.Col>
        {t ? (
          <Grid.Col span={{ base: 12, md: 8 }}>
            <DetailRows
              rows={[
                { label: 'Trip', value: `${DIRECTION_LABEL[t.direction]} · ${t.routeName}` },
                { label: 'Started', value: `${fmtTime(t.startedAt)} (${fmtDuration((now + skewMs - Date.parse(t.startedAt)) / 1000)} ago)` },
                { label: 'Progress', value: `${t.progress.reached} reached · ${t.progress.skipped} skipped · ${t.progress.pending} to go` },
                { label: 'Distance driven', value: fmtDistance(t.distanceM) },
                {
                  label: 'Last location',
                  value: t.live
                    ? `${t.live.lat.toFixed(5)}, ${t.live.lng.toFixed(5)} · ${fmtAgo(t.live.lastPingAt, skewMs, now)} · ±${t.live.accuracy != null ? Math.round(t.live.accuracy) : '?'} m`
                    : '—',
                },
                { label: 'Speed', value: t.live?.speedKmh != null ? `${t.live.speedKmh} km/h` : '—' },
              ]}
            />
          </Grid.Col>
        ) : (
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Text c="dimmed">Not on a trip right now.</Text>
          </Grid.Col>
        )}
      </Grid>

      {t && (
        <>
          <Title order={5} mt="lg" mb="xs">All stops</Title>
          <TripStopsTable trip={t} />
        </>
      )}
    </Paper>
  );
}
