'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert, Anchor, Badge, Box, Button, Card, Group, Progress, SimpleGrid, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBroadcast,
  IconBus,
  IconCheck,
  IconCircleDashed,
  IconMapPin,
  IconRoute,
  IconSos,
  IconUserCheck,
  IconUsersGroup,
} from '@tabler/icons-react';
import { StatCard } from '@/components/console/StatCard';
import { StatusPill, type PillTone } from '@/components/console/StatusPill';
import { api } from '@/lib/api';
import { tripsApi, type Fleet, type Presence, type TripSummary } from '@/lib/tripsApi';
import { useAuthStore } from '@/stores/auth.store';

const PRESENCE: Record<Presence, { label: string; tone: PillTone }> = {
  live: { label: 'Live', tone: 'green' },
  away: { label: 'Delayed updates', tone: 'orange' },
  offline: { label: 'Offline', tone: 'red' },
  not_on_trip: { label: 'Not on a trip', tone: 'gray' },
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

type Setup = { routes: number; buses: number; busesWithRoute: number; busesWithDriver: number; drivers: number; parents: number };

export function SchoolDashboard() {
  const user = useAuthStore((s) => s.user);
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [trips, setTrips] = useState<TripSummary[] | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFleet = useCallback(
    () =>
      tripsApi
        .fleet()
        .then((r) => {
          setFleet(r.data);
          setError(null);
        })
        .catch((e: Error) => setError(e.message)),
    [],
  );

  useEffect(() => {
    void loadFleet();
    const id = setInterval(loadFleet, 20_000);
    const from = new Date(Date.now() - 6 * 86_400_000);
    from.setHours(0, 0, 0, 0);
    tripsApi
      .list({ from: from.toISOString(), limit: 100 })
      .then((r) => setTrips(r.data))
      .catch(() => setTrips([]));
    Promise.all([api.routes.list(), api.buses.list(), api.drivers.list(), api.parents.list()])
      .then(([routes, buses, drivers, parents]) =>
        setSetup({
          routes: routes.data.length,
          buses: buses.data.length,
          busesWithRoute: buses.data.filter((b) => b.routeId).length,
          busesWithDriver: buses.data.filter((b) => b.driver).length,
          drivers: drivers.data.length,
          parents: parents.data.length,
        }),
      )
      .catch(() => undefined);
    return () => clearInterval(id);
  }, [loadFleet]);

  const chart = useMemo(() => {
    if (!trips) return null;
    const days: { day: string; key: string; Pickup: number; Drop: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      days.push({ key: d.toDateString(), day: d.toLocaleDateString(undefined, { weekday: 'short' }), Pickup: 0, Drop: 0 });
    }
    for (const t of trips) {
      const row = days.find((d) => d.key === new Date(t.startedAt).toDateString());
      if (row) row[t.direction === 'pickup' ? 'Pickup' : 'Drop']++;
    }
    const totals = trips.reduce((a, t) => ({ total: a.total + t.stops.total, reached: a.reached + t.stops.reached }), { total: 0, reached: 0 });
    return { days, reachedPct: totals.total ? Math.round((totals.reached / totals.total) * 100) : null, count: trips.length };
  }, [trips]);

  const s = fleet?.summary;
  const issues = s ? s.away + s.offline : 0;
  const steps = setup
    ? [
        { done: setup.routes > 0, label: 'Create your routes', hint: `${setup.routes} route${setup.routes === 1 ? '' : 's'}`, href: '/routes', icon: IconRoute },
        { done: setup.buses > 0 && setup.busesWithRoute === setup.buses, label: 'Assign a route to every bus', hint: `${setup.busesWithRoute}/${setup.buses} buses`, href: '/buses', icon: IconBus },
        { done: setup.buses > 0 && setup.busesWithDriver === setup.buses, label: 'Assign a driver to every bus', hint: `${setup.busesWithDriver}/${setup.buses} buses`, href: '/buses', icon: IconUserCheck },
        { done: setup.parents > 0, label: 'Invite families', hint: `${setup.parents} parent${setup.parents === 1 ? '' : 's'}`, href: '/parents', icon: IconUsersGroup },
      ]
    : null;
  const stepsDone = steps?.filter((x) => x.done).length ?? 0;

  return (
    <Stack gap="xl">
      <Box>
        <Text size="sm" c="dimmed">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Title order={1} className="font-display" fz="h1" lh={1.15}>
          {greeting()}
          {user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
        </Title>
        {user?.school?.name && (
          <Text c="dimmed" mt={4}>
            Here’s {user.school.name} right now.
          </Text>
        )}
      </Box>

      {!!s?.sos && (
        <Alert color="danger" variant="filled" icon={<IconSos size={22} />} title={`SOS raised on ${s.sos} bus${s.sos > 1 ? 'es' : ''}`}>
          <Group justify="space-between" gap="sm">
            <Text size="sm">A driver needs help. Open the live map to see where and acknowledge.</Text>
            <Button component={Link} href="/live" variant="white" color="danger" size="xs">
              Open live map
            </Button>
          </Group>
        </Alert>
      )}
      {error && (
        <Alert color="warning" variant="light" icon={<IconAlertTriangle size={18} />}>
          Live status couldn’t refresh: {error}
        </Alert>
      )}

      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        <StatCard label="On a trip now" value={s ? s.onTrip : '—'} hint={s ? `of ${s.totalBuses} buses` : undefined} icon={<IconBus size={20} />} color="teal" loading={!fleet} />
        <StatCard label="Sharing live" value={s ? s.live : '—'} hint="Updating every few seconds" icon={<IconBroadcast size={20} />} color="success" loading={!fleet} />
        <StatCard label="Need attention" value={s ? issues : '—'} hint={issues ? 'Delayed or offline' : 'All clear'} icon={<IconAlertTriangle size={20} />} color={issues ? 'warning' : 'navy'} loading={!fleet} />
        <StatCard label="Open alerts" value={s ? s.alerts : '—'} hint={s?.alerts ? 'Stopped or lost GPS' : 'Nothing to review'} icon={<IconSos size={20} />} color={s?.alerts ? 'danger' : 'navy'} loading={!fleet} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Card>
          <Group justify="space-between" mb="md">
            <Title order={2} fz="lg">
              Buses right now
            </Title>
            <Anchor component={Link} href="/live" size="sm" fw={600}>
              Live map <IconArrowRight size={14} style={{ verticalAlign: -2 }} />
            </Anchor>
          </Group>
          <Stack gap={0}>
            {!fleet &&
              Array.from({ length: 4 }).map((_, i) => (
                <Group key={i} py="sm" justify="space-between">
                  <Skeleton h={14} w="45%" />
                  <Skeleton h={20} w={90} radius="xl" />
                </Group>
              ))}
            {fleet?.buses.length === 0 && (
              <Text c="dimmed" size="sm" py="lg" ta="center">
                No buses yet — add your first bus to start tracking.
              </Text>
            )}
            {fleet?.buses.slice(0, 7).map((b) => {
              const p = PRESENCE[b.presence];
              return (
                <Group key={b.bus.id} py="sm" justify="space-between" wrap="nowrap" style={{ borderTop: '1px solid var(--bp-border-subtle)' }}>
                  <Group gap="sm" wrap="nowrap" miw={0}>
                    <ThemeIcon variant="light" color={b.trip ? 'teal' : 'gray'} size={36} radius="md">
                      <IconBus size={18} />
                    </ThemeIcon>
                    <Box miw={0}>
                      <Text fw={600} size="sm" truncate="end">
                        {b.bus.name}{' '}
                        <Text span c="dimmed" fw={400} className="tnum">
                          · {b.bus.plateNumber}
                        </Text>
                      </Text>
                      <Text size="xs" c="dimmed" truncate="end">
                        {b.trip ? b.trip.routeName : (b.route?.name ?? 'No route assigned')}
                        {b.driver?.fullName ? ` · ${b.driver.fullName}` : ''}
                      </Text>
                    </Box>
                  </Group>
                  <StatusPill tone={p.tone}>{p.label}</StatusPill>
                </Group>
              );
            })}
          </Stack>
        </Card>

        <Card>
          <Group justify="space-between" mb="xs" align="flex-start">
            <Box>
              <Title order={2} fz="lg">
                Last 7 days
              </Title>
              <Text size="sm" c="dimmed">
                {chart ? `${chart.count} trips` : 'Loading…'}
                {chart?.reachedPct != null ? ` · ${chart.reachedPct}% of stops reached` : ''}
              </Text>
            </Box>
            <Anchor component={Link} href="/trips" size="sm" fw={600}>
              Trip history <IconArrowRight size={14} style={{ verticalAlign: -2 }} />
            </Anchor>
          </Group>
          {chart ? (
            <BarChart
              h={240}
              data={chart.days}
              dataKey="day"
              type="stacked"
              series={[
                { name: 'Pickup', color: 'teal.6' },
                { name: 'Drop', color: 'navy.5' },
              ]}
              withLegend
              legendProps={{ verticalAlign: 'bottom' }}
              gridAxis="y"
              tickLine="none"
              barProps={{ radius: 4 }}
              valueFormatter={(v) => `${v} trip${v === 1 ? '' : 's'}`}
            />
          ) : (
            <Skeleton h={240} radius="md" />
          )}
        </Card>
      </SimpleGrid>

      {steps && stepsDone < steps.length && (
        <Card>
          <Group justify="space-between" mb="sm">
            <Box>
              <Title order={2} fz="lg">
                Finish setting up
              </Title>
              <Text size="sm" c="dimmed">
                {stepsDone} of {steps.length} done — families see the bus once every bus has a route and a driver.
              </Text>
            </Box>
            <Badge color="teal" variant="light" size="lg" className="tnum">
              {Math.round((stepsDone / steps.length) * 100)}%
            </Badge>
          </Group>
          <Progress value={(stepsDone / steps.length) * 100} size={6} radius="xl" mb="md" />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {steps.map((x) => (
              <Card key={x.label} component={Link} href={x.href} padding="md" withBorder shadow="none" style={{ textDecoration: 'none' }}>
                <Group wrap="nowrap" gap="sm">
                  <ThemeIcon variant={x.done ? 'filled' : 'light'} color={x.done ? 'success' : 'gray'} radius="xl" size={30}>
                    {x.done ? <IconCheck size={16} /> : <IconCircleDashed size={16} />}
                  </ThemeIcon>
                  <Box miw={0} flex={1}>
                    <Text fw={600} size="sm" td={x.done ? 'line-through' : undefined} c={x.done ? 'dimmed' : undefined}>
                      {x.label}
                    </Text>
                    <Text size="xs" c="dimmed" className="tnum">
                      {x.hint}
                    </Text>
                  </Box>
                  <x.icon size={18} style={{ color: 'var(--bp-text-muted)' }} />
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Card>
      )}

      <Group gap="sm">
        <Button component={Link} href="/live" leftSection={<IconMapPin size={16} />}>
          Open live map
        </Button>
        <Button component={Link} href="/routes" variant="default" leftSection={<IconRoute size={16} />}>
          Manage routes
        </Button>
      </Group>
    </Stack>
  );
}
