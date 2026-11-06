'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert, Anchor, Badge, Button, Grid, Group, Paper, ScrollArea, SimpleGrid, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { IconAlertTriangle, IconBus, IconRefresh, IconRoute, IconWifi, IconWifiOff } from '@tabler/icons-react';
import { PageHeader } from '@/components/console/PageHeader';
import { StatCard } from '@/components/console/StatCard';
import { DetailRows, PlateChip } from '@/components/console/DetailSection';
import { PresencePill } from '@/components/console/trips/PresencePill';
import { TripStopsTable } from '@/components/console/trips/TripStopsTable';
import { TripsMap, type MapBus } from '@/components/console/trips/TripsMap';
import { errorMessage, notify } from '@/lib/notify';
import { connectLive } from '@/lib/liveSocket';
import {
  agePresence, CHECK_IN_LABEL, DIRECTION_LABEL, fmtAgo, fmtDistance, fmtDuration, fmtTime, tripsApi,
  type Fleet, type FleetBus, type TripSnapshot,
} from '@/lib/tripsApi';

/** Polling is the safety net; live push (socket) delivers changes instantly. */
const POLL_MS = 5_000;
const POLL_WITH_SOCKET_MS = 30_000;

/** Live fleet: every bus, its freshness (live/away/offline), alerts, and the full running trip. */
export default function LiveBusesPage() {
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [skewMs, setSkewMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [reloadKey, setReloadKey] = useState(0);
  const [realtime, setRealtime] = useState(false);

  /** Merge one pushed / acknowledged trip snapshot into the fleet list. */
  const mergeTrip = useCallback((snap: TripSnapshot) => {
    setFleet((f) =>
      f && {
        ...f,
        buses: f.buses.map((b) => (b.bus.id === snap.bus?.id ? { ...b, trip: snap.status === 'in_progress' ? snap : null } : b)),
      },
    );
  }, []);

  useEffect(() => connectLive({ onTrip: mergeTrip, onConnection: setRealtime }), [mergeTrip]);

  useEffect(() => {
    let alive = true;
    const fetchFleet = async () => {
      try {
        const res = await tripsApi.fleet();
        if (!alive) return;
        setFleet(res.data);
        setSkewMs(Date.parse(res.data.serverTime) - Date.now());
        setError(null);
      } catch (e) {
        if (alive) setError(errorMessage(e, 'Could not load live buses.'));
      }
    };
    void fetchFleet();
    const poll = setInterval(() => void fetchFleet(), realtime ? POLL_WITH_SOCKET_MS : POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [reloadKey, realtime]);

  // Presence aged on the client (a silent bus sends nothing).
  const buses = useMemo(
    () =>
      (fleet?.buses ?? [])
        .map((b) => ({
          ...b,
          presence: agePresence(b.trip?.live?.lastPingAt ?? null, !!b.trip, fleet?.settings ?? null, skewMs, now),
        }))
        // Offline / alerting buses first, then running, then idle.
        .sort((a, b) => rank(a) - rank(b) || a.bus.name.localeCompare(b.bus.name)),
    [fleet, skewMs, now],
  );

  const selected = buses.find((b) => b.bus.id === selectedId) ?? null;
  const mapBuses: MapBus[] = buses
    .filter((b) => b.trip?.live)
    .map((b) => ({ id: b.bus.id, label: b.bus.name, lat: b.trip!.live!.lat, lng: b.trip!.live!.lng, presence: b.presence, heading: b.trip!.live!.heading }));

  const s = fleet?.summary;

  return (
    <>
      <PageHeader
        title="Live buses"
        description={realtime ? 'Where every bus is right now — live updates connected.' : 'Where every bus is right now — refreshing every 5 seconds (live updates offline).'}
        actions={<Button variant="default" leftSection={<IconRefresh size={16} />} onClick={() => setReloadKey((k) => k + 1)}>Refresh</Button>}
      />

      {error && <Alert color="red" mb="md" title="Could not load live data">{error}</Alert>}

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} mb="lg">
        <StatCard label="Buses" value={s?.totalBuses ?? '—'} icon={<IconBus size={18} />} loading={!fleet} />
        <StatCard label="On trip" value={s?.onTrip ?? '—'} icon={<IconRoute size={18} />} color="blue" loading={!fleet} />
        <StatCard label="Live" value={buses.filter((b) => b.presence === 'live').length} icon={<IconWifi size={18} />} color="teal" loading={!fleet} />
        <StatCard label="Away" value={buses.filter((b) => b.presence === 'away').length} icon={<IconWifi size={18} />} color="orange" loading={!fleet} />
        <StatCard label="Offline" value={buses.filter((b) => b.presence === 'offline').length} icon={<IconWifiOff size={18} />} color="red" loading={!fleet} />
        <StatCard
          label="Alerts"
          value={buses.filter((b) => b.trip && (b.trip.alerts.sos || b.trip.alerts.gpsLost || b.trip.alerts.stationary)).length}
          hint={buses.some((b) => b.trip?.alerts.sos && !b.trip.alerts.sos.acknowledgedAt) ? 'SOS needs attention' : undefined}
          icon={<IconAlertTriangle size={18} />}
          color="red"
          loading={!fleet}
        />
      </SimpleGrid>

      <Grid gap="md">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper withBorder radius="md">
            <ScrollArea h={460}>
              <Stack gap={0}>
                {buses.length === 0 && fleet && <Text p="md" c="dimmed">No buses yet.</Text>}
                {buses.map((b) => (
                  <BusRow key={b.bus.id} item={b} skewMs={skewMs} now={now} selected={b.bus.id === selectedId} onClick={() => setSelectedId(b.bus.id === selectedId ? null : b.bus.id)} />
                ))}
              </Stack>
            </ScrollArea>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper withBorder radius="md" p={0}>
            <TripsMap buses={mapBuses} selectedBusId={selectedId} onSelectBus={setSelectedId} stops={selected?.trip?.stops ?? []} road={selected?.trip?.road} />
          </Paper>
        </Grid.Col>
      </Grid>

      {selected && <SelectedBus item={selected} skewMs={skewMs} now={now} onUpdated={mergeTrip} />}
    </>
  );
}

function rank(b: FleetBus & { presence: string }) {
  if (b.trip?.alerts.sos && !b.trip.alerts.sos.acknowledgedAt) return -1;
  if (b.trip && (b.trip.alerts.gpsLost || b.trip.alerts.stationary || b.presence === 'offline')) return 0;
  if (b.trip) return 1;
  return 2;
}

function BusRow({ item, skewMs, now, selected, onClick }: { item: FleetBus; skewMs: number; now: number; selected: boolean; onClick: () => void }) {
  const t = item.trip;
  const next = t?.stops.find((s) => s.id === t.nextStopId);
  return (
    <UnstyledButton
      onClick={onClick}
      p="sm"
      style={{
        borderBottom: '1px solid var(--mantine-color-default-border)',
        background: selected ? 'var(--mantine-color-blue-light)' : undefined,
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Stack gap={2} style={{ minWidth: 0 }}>
          <Group gap={6}>
            <Text fw={700} size="sm">{item.bus.name}</Text>
            <PlateChip plate={item.bus.plateNumber} />
          </Group>
          <Text size="xs" c="dimmed">
            {item.driver ? `${item.driver.fullName ?? 'Driver'}${item.driver.phone ? ` · ${item.driver.phone}` : ''}` : 'No driver'} ·{' '}
            {item.route?.name ?? 'No route'}
          </Text>
          {t ? (
            <Text size="xs">
              {DIRECTION_LABEL[t.direction]} · {t.progress.reached}/{t.progress.total} stops
              {t.progress.skipped ? ` · ${t.progress.skipped} skipped` : ''}
              {next ? ` · next ${next.name} ${fmtTime(next.etaAt)} (${fmtDistance(next.distanceM)})` : ''}
            </Text>
          ) : null}
          {t?.alerts.sos && (
            <Badge color="red" variant={t.alerts.sos.acknowledgedAt ? 'light' : 'filled'} size="sm">
              SOS {fmtTime(t.alerts.sos.at)}{t.alerts.sos.acknowledgedAt ? ' · seen' : ''}
            </Badge>
          )}
          {t?.alerts.gpsLost && <Badge color="red" variant="light" size="sm">GPS lost since {fmtTime(t.alerts.gpsLost.since)}</Badge>}
          {t?.alerts.stationary && (
            <Badge color="orange" variant="light" size="sm">
              Not moving {t.alerts.stationary.minutes} min{t.alerts.stationary.reason ? ` · ${CHECK_IN_LABEL[t.alerts.stationary.reason] ?? t.alerts.stationary.reason}` : ''}
            </Badge>
          )}
          {t?.alerts.checkIn && !t.alerts.checkIn.response && !t.alerts.stationary && (
            <Badge color="yellow" variant="light" size="sm">Stopped — asked driver {fmtTime(t.alerts.checkIn.requestedAt)}</Badge>
          )}
        </Stack>
        <PresencePill presence={item.presence} ago={t ? fmtAgo(t.live?.lastPingAt, skewMs, now) : undefined} />
      </Group>
    </UnstyledButton>
  );
}

function SelectedBus({ item, skewMs, now, onUpdated }: { item: FleetBus; skewMs: number; now: number; onUpdated: (t: TripSnapshot) => void }) {
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
