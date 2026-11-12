'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Anchor, Badge, Box, Card, Group, SimpleGrid, Skeleton, Stack, Text, Title } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { IconArrowRight, IconBuildingCommunity, IconCalendarEvent, IconInbox, IconTrophy } from '@tabler/icons-react';
import { StatCard } from '@/components/console/StatCard';
import { api, type DemoRequest, type DemoRequestStats, type SchoolSummary } from '@/lib/api';

const STAGES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'demo_scheduled', label: 'Scheduled' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
] as const;

export function SuperDashboard() {
  const [schools, setSchools] = useState<SchoolSummary[] | null>(null);
  const [stats, setStats] = useState<DemoRequestStats | null>(null);
  const [latest, setLatest] = useState<DemoRequest[] | null>(null);

  useEffect(() => {
    api.schools
      .list()
      .then((r) => setSchools(r.data))
      .catch(() => setSchools([]));
    api.demoRequests
      .stats()
      .then((r) => setStats(r.data))
      .catch(() => undefined);
    api.demoRequests
      .list({ limit: 5 })
      .then((r) => setLatest(r.data))
      .catch(() => setLatest([]));
  }, []);

  const active = schools?.filter((s) => s.isActive).length ?? 0;
  const recent = schools ? [...schools].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5) : null;
  const pipeline = stats ? STAGES.map((s) => ({ stage: s.label, Requests: stats.byStatus[s.key] ?? 0 })) : null;
  const winRate = stats && stats.byStatus.won + stats.byStatus.lost > 0 ? Math.round((stats.byStatus.won / (stats.byStatus.won + stats.byStatus.lost)) * 100) : null;

  return (
    <Stack gap="xl">
      <Box>
        <Text size="sm" c="dimmed">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Title order={1} className="font-display" fz="h1" lh={1.15}>
          Platform overview
        </Title>
      </Box>

      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        <StatCard label="Active schools" value={schools ? active : '—'} hint={schools ? `${schools.length} in total` : undefined} icon={<IconBuildingCommunity size={20} />} color="navy" loading={!schools} />
        <StatCard label="New demo requests" value={stats ? stats.byStatus.new : '—'} hint="Waiting for a reply" icon={<IconInbox size={20} />} color={stats?.byStatus.new ? 'teal' : 'navy'} loading={!stats} />
        <StatCard label="Demos scheduled" value={stats ? stats.byStatus.demo_scheduled : '—'} hint="In the calendar" icon={<IconCalendarEvent size={20} />} color="brass" loading={!stats} />
        <StatCard label="Win rate" value={winRate != null ? `${winRate}%` : '—'} hint={stats ? `${stats.byStatus.won} won · ${stats.byStatus.lost} lost` : undefined} icon={<IconTrophy size={20} />} color="success" loading={!stats} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Card>
          <Group justify="space-between" mb="md">
            <Title order={2} fz="lg">
              Latest demo requests
            </Title>
            <Anchor component={Link} href="/super-admin/demo-requests" size="sm" fw={600}>
              All requests <IconArrowRight size={14} style={{ verticalAlign: -2 }} />
            </Anchor>
          </Group>
          <Stack gap={0}>
            {!latest && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={44} my={4} />)}
            {latest?.length === 0 && (
              <Text c="dimmed" size="sm" py="lg" ta="center">
                No requests yet. They’ll appear here as soon as a school fills in the website form.
              </Text>
            )}
            {latest?.map((r) => (
              <Group key={r.id} py="sm" justify="space-between" wrap="nowrap" style={{ borderTop: '1px solid var(--bp-border-subtle)' }}>
                <Box miw={0}>
                  <Text fw={600} size="sm" truncate="end">
                    {r.schoolName}
                  </Text>
                  <Text size="xs" c="dimmed" truncate="end">
                    {r.contactName} · {r.city}, {r.country}
                  </Text>
                </Box>
                <Badge color={r.status === 'new' ? 'teal' : 'gray'} variant="light">
                  {STAGES.find((s) => s.key === r.status)?.label}
                </Badge>
              </Group>
            ))}
          </Stack>
        </Card>

        <Card>
          <Title order={2} fz="lg" mb="md">
            Pipeline
          </Title>
          {pipeline ? (
            <BarChart h={240} data={pipeline} dataKey="stage" series={[{ name: 'Requests', color: 'teal.6' }]} gridAxis="y" tickLine="none" barProps={{ radius: 4 }} />
          ) : (
            <Skeleton h={240} radius="md" />
          )}
        </Card>
      </SimpleGrid>

      <Card>
        <Group justify="space-between" mb="md">
          <Title order={2} fz="lg">
            Recently added schools
          </Title>
          <Anchor component={Link} href="/super-admin/schools" size="sm" fw={600}>
            All schools <IconArrowRight size={14} style={{ verticalAlign: -2 }} />
          </Anchor>
        </Group>
        {!recent && <Skeleton h={120} />}
        {recent?.length === 0 && (
          <Text c="dimmed" size="sm">
            No schools yet.
          </Text>
        )}
        <Stack gap={0}>
          {recent?.map((s) => (
            <Group key={s.id} py="sm" justify="space-between" style={{ borderTop: '1px solid var(--bp-border-subtle)' }}>
              <Anchor component={Link} href={`/super-admin/schools/${s.id}/settings`} fw={600} size="sm" c="var(--bp-text-primary)">
                {s.name}
              </Anchor>
              <Text size="xs" c="dimmed">
                {new Date(s.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </Group>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
