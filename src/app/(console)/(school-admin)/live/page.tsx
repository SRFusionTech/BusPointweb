'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Box, Button, Grid, Group, Paper, ScrollArea, SimpleGrid, Stack, Text, TextInput, Title, UnstyledButton } from '@mantine/core';
import { IconAlertTriangle, IconBus, IconRefresh, IconRoute, IconSearch, IconWifi, IconWifiOff } from '@tabler/icons-react';
import { PageHeader } from '@/components/console/PageHeader';
import { StatCard } from '@/components/console/StatCard';
import { PlateChip } from '@/components/console/DetailSection';
import { PresencePill } from '@/components/console/trips/PresencePill';
import { TripsMap, type MapBus } from '@/components/console/trips/TripsMap';
import { BusTripDetails } from '@/components/console/trips/BusTripDetails';
import { errorMessage } from '@/lib/notify';
import { connectLive } from '@/lib/liveSocket';
import { api, type RouteDetail, type RouteSummary } from '@/lib/api';
import { computeRoadRoute, type LatLng } from '@/lib/roadRoute';
import {
  agePresence, DIRECTION_LABEL, fmtAgo, fmtDistance, fmtTime, tripsApi,
  type Fleet, type FleetBus, type Presence, type TripSnapshot, type TripStop,
} from '@/lib/tripsApi';

/** Polling is the safety net; live push (socket) delivers changes instantly. */
const POLL_MS = 5_000;
const POLL_WITH_SOCKET_MS = 30_000;

type LiveBus = FleetBus & { presence: Presence };

interface RouteItem {
  route: RouteSummary;
  /** Bus assigned to this route (pickup or return), preferring one that is running a trip on it. */
  bus: LiveBus | null;
  /** The bus's running trip — only if it is on THIS route. */
  trip: TripSnapshot | null;
}

/**
 * Live tracking by route: list of routes on the left, the selected route's bus on a live map on the right
 * (moving marker, road line, offline banner), with the full trip details below.
 */
export default function LiveTrackingPage() {
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [routes, setRoutes] = useState<RouteSummary[] | null>(null);
  const [skewMs, setSkewMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
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
    api.routes
      .list()
      .then((res) => alive && setRoutes(res.data))
      .catch((e) => alive && setError(errorMessage(e, 'Could not load routes.')));
    return () => {
      alive = false;
    };
  }, [reloadKey]);

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

  // Presence aged on the client (a silent bus sends nothing, so "live" must decay here).
  const buses: LiveBus[] = useMemo(
    () =>
      (fleet?.buses ?? []).map((b) => ({
        ...b,
        presence: agePresence(b.trip?.live?.lastPingAt ?? null, !!b.trip, fleet?.settings ?? null, skewMs, now),
      })),
    [fleet, skewMs, now],
  );

  const items: RouteItem[] = useMemo(() => {
    const list = (routes ?? []).map((route) => {
      const onRoute = buses.filter((b) => b.trip?.routeId === route.id);
      const assigned = buses.filter((b) => b.route?.id === route.id || b.returnRoute?.id === route.id);
      const bus = onRoute[0] ?? assigned[0] ?? null;
      return { route, bus, trip: bus?.trip?.routeId === route.id ? bus.trip : null };
    });
    return list.sort((a, b) => rank(a) - rank(b) || a.route.name.localeCompare(b.route.name));
  }, [routes, buses]);

  const q = query.trim().toLowerCase();
  const visible = q
    ? items.filter((i) => [i.route.name, i.bus?.bus.name, i.bus?.bus.plateNumber, i.bus?.driver?.fullName].some((v) => v?.toLowerCase().includes(q)))
    : items;

  // Default selection: first route (running trips sort first).
  const selected = items.find((i) => i.route.id === selectedRouteId) ?? items[0] ?? null;
  const s = fleet?.summary;

  return (
    <>
      <PageHeader
        title="Live tracking"
        description={realtime ? 'Pick a route to follow its bus live.' : 'Pick a route to follow its bus — refreshing every 5 seconds (live push offline).'}
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
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder radius="md">
            <Box p="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
              <TextInput
                placeholder="Search route, bus, driver"
                leftSection={<IconSearch size={16} />}
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
              />
            </Box>
            <ScrollArea h={520}>
              <Stack gap={0}>
                {routes && items.length === 0 && <Text p="md" c="dimmed">No routes yet. Create one under Routes.</Text>}
                {routes && items.length > 0 && visible.length === 0 && <Text p="md" c="dimmed">No match.</Text>}
                {!routes && <Text p="md" c="dimmed">Loading routes…</Text>}
                {visible.map((item) => (
                  <RouteRow
                    key={item.route.id}
                    item={item}
                    skewMs={skewMs}
                    now={now}
                    selected={item.route.id === selected?.route.id}
                    onClick={() => setSelectedRouteId(item.route.id)}
                  />
                ))}
              </Stack>
            </ScrollArea>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          {selected ? <RouteLive item={selected} skewMs={skewMs} now={now} /> : <Paper withBorder radius="md" h={580} />}
        </Grid.Col>
      </Grid>

      {selected?.bus && <BusTripDetails item={selected.bus} skewMs={skewMs} now={now} onUpdated={mergeTrip} />}
    </>
  );
}

/** SOS / problems first, then running trips, then idle routes. */
function rank(i: RouteItem) {
  const t = i.trip;
  if (t?.alerts.sos && !t.alerts.sos.acknowledgedAt) return -1;
  if (t && (t.alerts.gpsLost || t.alerts.stationary || i.bus?.presence === 'offline')) return 0;
  if (t) return 1;
  if (i.bus) return 2;
  return 3;
}

function RouteRow({ item, skewMs, now, selected, onClick }: { item: RouteItem; skewMs: number; now: number; selected: boolean; onClick: () => void }) {
  const { route, bus, trip: t } = item;
  const next = t?.stops.find((s) => s.id === t.nextStopId);
  const elsewhere = !t && bus?.trip ? bus.trip.routeName : null;
  return (
    <UnstyledButton
      onClick={onClick}
      p="sm"
      style={{
        borderBottom: '1px solid var(--mantine-color-default-border)',
        borderLeft: `3px solid ${selected ? 'var(--mantine-color-blue-6)' : 'transparent'}`,
        background: selected ? 'var(--mantine-color-blue-light)' : undefined,
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Stack gap={2} style={{ minWidth: 0 }}>
          <Text fw={700} size="sm" truncate>{route.name}</Text>
          <Group gap={6}>
            {bus ? (
              <>
                <Text size="xs" c="dimmed">{bus.bus.name}</Text>
                <PlateChip plate={bus.bus.plateNumber} />
              </>
            ) : (
              <Text size="xs" c="dimmed">No bus assigned</Text>
            )}
            {route.stopCount != null && <Text size="xs" c="dimmed">· {route.stopCount} stops</Text>}
          </Group>
          {t && (
            <Text size="xs">
              {DIRECTION_LABEL[t.direction]} · {t.progress.reached}/{t.progress.total} stops
              {next ? ` · next ${next.name} ${fmtTime(next.etaAt)}` : ''}
            </Text>
          )}
          {elsewhere && <Text size="xs" c="dimmed">Bus is running “{elsewhere}”</Text>}
          {t?.alerts.sos && <Badge color="red" variant={t.alerts.sos.acknowledgedAt ? 'light' : 'filled'} size="sm">SOS {fmtTime(t.alerts.sos.at)}</Badge>}
          {t?.alerts.gpsLost && <Badge color="red" variant="light" size="sm">GPS lost since {fmtTime(t.alerts.gpsLost.since)}</Badge>}
          {t?.alerts.stationary && <Badge color="orange" variant="light" size="sm">Not moving {t.alerts.stationary.minutes} min</Badge>}
        </Stack>
        <PresencePill presence={t && bus ? bus.presence : 'not_on_trip'} ago={t ? fmtAgo(t.live?.lastPingAt, skewMs, now) : undefined} />
      </Group>
    </UnstyledButton>
  );
}

/** Route stops as map stops (no trip running → all pending). */
function plannedStops(detail: RouteDetail): TripStop[] {
  return [...detail.stops]
    .sort((a, b) => a.stopOrder - b.stopOrder)
    .map((s, seq) => ({
      id: s.id, routeStopId: s.id, seq, name: s.name, address: s.address, kind: s.kind, lat: s.lat, lng: s.lng,
      status: 'pending', arrivedAt: null, etaAt: null, distanceM: null, studentsCount: 0, students: [],
    }));
}

/** Planned route (stops + road path) for a route that is not running — fetched once per route. */
function usePlannedRoute(routeId: string, enabled: boolean) {
  const [state, setState] = useState<{ routeId: string; stops: TripStop[]; path: LatLng[] } | null>(null);
  useEffect(() => {
    if (!enabled || state?.routeId === routeId) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const detail = (await api.routes.get(routeId)).data;
        const stops = plannedStops(detail);
        let path: LatLng[] = [];
        if (stops.length > 1) {
          path = await computeRoadRoute(stops.map((s) => ({ lat: s.lat, lng: s.lng })), controller.signal)
            .then((r) => r.path)
            .catch(() => []);
        }
        if (!controller.signal.aborted) setState({ routeId, stops, path });
      } catch {
        if (!controller.signal.aborted) setState({ routeId, stops: [], path: [] });
      }
    })();
    return () => controller.abort();
  }, [routeId, enabled, state?.routeId]);
  return state?.routeId === routeId ? state : null;
}

function RouteLive({ item, skewMs, now }: { item: RouteItem; skewMs: number; now: number }) {
  const { route, bus, trip: t } = item;
  const planned = usePlannedRoute(route.id, !t);
  const next = t?.stops.find((s) => s.id === t.nextStopId);
  const presence = t && bus ? bus.presence : 'not_on_trip';
  const ago = fmtAgo(t?.live?.lastPingAt, skewMs, now);

  const mapBuses: MapBus[] =
    bus && t?.live ? [{ id: bus.bus.id, label: bus.bus.name, lat: t.live.lat, lng: t.live.lng, presence, heading: t.live.heading }] : [];

  return (
    <Paper withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
      <Group justify="space-between" p="sm" wrap="wrap" gap="xs" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Stack gap={2} style={{ minWidth: 0 }}>
          <Group gap="xs">
            <Title order={4}>{route.name}</Title>
            <PresencePill presence={presence} ago={t ? ago : undefined} />
          </Group>
          <Text size="sm" c="dimmed">
            {bus ? `${bus.bus.name} (${bus.bus.plateNumber})` : 'No bus assigned'}
            {bus?.driver ? ` · ${bus.driver.fullName ?? 'Driver'}${bus.driver.phone ? ` · ${bus.driver.phone}` : ''}` : ''}
          </Text>
        </Stack>
        {t && (
          <Group gap="lg">
            <Metric label="Trip" value={DIRECTION_LABEL[t.direction]} />
            <Metric label="Stops" value={`${t.progress.reached}/${t.progress.total}`} />
            <Metric label="Next stop" value={next ? `${next.name} · ${fmtTime(next.etaAt)}` : '—'} />
            <Metric label="Distance" value={next ? fmtDistance(next.distanceM) : '—'} />
            <Metric label="Speed" value={t.live?.speedKmh != null ? `${Math.round(t.live.speedKmh)} km/h` : '—'} />
          </Group>
        )}
      </Group>

      <TripsMap
        buses={mapBuses}
        selectedBusId={bus?.bus.id ?? null}
        stops={t ? t.stops : planned?.stops ?? []}
        road={t?.road}
        plannedPath={t ? undefined : planned?.path}
        height={520}
      >
        <StatusBanner presence={presence} onTrip={!!t} hasLocation={!!t?.live} ago={ago} busName={bus?.bus.name ?? null} />
      </TripsMap>
    </Paper>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={0}>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm" fw={600}>{value}</Text>
    </Stack>
  );
}

/** Banner over the map: offline / delayed / not running. Nothing when live. */
function StatusBanner({ presence, onTrip, hasLocation, ago, busName }: { presence: Presence; onTrip: boolean; hasLocation: boolean; ago: string; busName: string | null }) {
  let banner: { color: string; title: string; text: string } | null = null;
  if (!onTrip) {
    banner = {
      color: 'gray',
      title: 'Not running now',
      text: busName ? `Showing the planned route. ${busName} appears here when the driver starts a trip.` : 'Showing the planned route. Assign a bus to track it.',
    };
  } else if (!hasLocation) {
    banner = { color: 'orange', title: 'Waiting for location', text: 'The trip has started but no GPS point has arrived yet.' };
  } else if (presence === 'offline') {
    banner = { color: 'red', title: 'Bus is offline', text: `Last location ${ago}. The marker shows where the bus was last seen.` };
  } else if (presence === 'away') {
    banner = { color: 'orange', title: 'Location delayed', text: `Last update ${ago} — weak network or GPS on the driver phone.` };
  }
  if (!banner) return null;
  return (
    <Box pos="absolute" top={12} left={12} right={12} style={{ zIndex: 5, pointerEvents: 'none' }}>
      <Alert
        color={banner.color}
        variant="filled"
        radius="md"
        title={banner.title}
        icon={banner.color === 'red' ? <IconWifiOff size={18} /> : undefined}
        style={{ maxWidth: 460, opacity: 0.95 }}
      >
        {banner.text}
      </Alert>
    </Box>
  );
}
