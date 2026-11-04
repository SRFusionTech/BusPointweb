'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ActionIcon, Anchor, Box, Button, Card, Divider, EmptyState, Group, Menu, SegmentedControl, SimpleGrid, Skeleton, Stack, Table,
  Text, TextInput, ThemeIcon, Tooltip, VisuallyHidden,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBuildingCommunity, IconCalendarPlus, IconCircleCheck, IconCircleOff, IconCopy, IconDots, IconKey, IconPlus,
  IconRefresh, IconSearch, IconSettings,
} from '@tabler/icons-react';
import { api, type SchoolSummary } from '@/lib/api';
import { notify, errorMessage } from '@/lib/notify';
import { PageHeader } from '@/components/console/PageHeader';
import { AddSchoolModal } from '@/components/super-admin/AddSchoolModal';
import { ResetPasswordModal } from '@/components/super-admin/ResetPasswordModal';
import { formatDate, SchoolAvatar, StatusBadge } from '@/components/super-admin/school-ui';

const DAY_MS = 86_400_000;
const settingsHref = (id: string) => `/super-admin/schools/${id}/settings`;

type StatusFilter = 'all' | 'active' | 'inactive';

// ─── KPI tile ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, loading }: {
  label: string; value: number; icon: typeof IconBuildingCommunity; color: string; loading: boolean;
}) {
  return (
    <Card padding="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text size="xs" c="dimmed" fw={500}>{label}</Text>
          {loading ? <Skeleton h={28} w={48} mt={6} /> : <Text fz={26} fw={600} mt={2}>{value}</Text>}
        </div>
        <ThemeIcon variant="light" color={color} size={36} radius="md"><Icon size={18} stroke={1.75} /></ThemeIcon>
      </Group>
    </Card>
  );
}

// ─── Row actions — add future actions here ───────────────────────────────────
function RowActions({ school, onReset }: { school: SchoolSummary; onReset: () => void }) {
  const router = useRouter();

  function copyId() {
    navigator.clipboard.writeText(school.id)
      .then(() => notify.success('School ID copied to clipboard.'))
      .catch(() => notify.error('Could not copy to clipboard.'));
  }

  return (
    <Menu position="bottom-end" width={220}>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" aria-label={`Actions for ${school.name}`}>
          <IconDots size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconSettings size={16} />} onClick={() => router.push(settingsHref(school.id))}>Settings</Menu.Item>
        <Menu.Item leftSection={<IconKey size={16} />} onClick={onReset}>Reset admin password</Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<IconCopy size={16} />} onClick={copyId}>Copy school ID</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [resetTarget, setResetTarget] = useState<SchoolSummary | null>(null);
  const [addOpened, addModal] = useDisclosure(false);

  // Time of the last successful load — the "last 30 days" stat is relative to it
  const [loadedAt, setLoadedAt] = useState(0);

  /** Fetches the list; `isCurrent` lets the initial load ignore a late response after unmount. */
  const fetchSchools = useCallback((isCurrent: () => boolean = () => true) =>
    api.schools.list()
      .then((res) => {
        if (!isCurrent()) return;
        setSchools(res.data);
        setLoadedAt(Date.now());
      })
      .catch((err) => { if (isCurrent()) notify.error(errorMessage(err, 'Failed to load schools')); })
      .finally(() => { if (isCurrent()) setLoading(false); }),
  []);

  /** Manual refresh (button, after creating a school). */
  const loadSchools = useCallback(() => {
    setLoading(true);
    return fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    let current = true; // `loading` already starts true
    fetchSchools(() => current);
    return () => { current = false; };
  }, [fetchSchools]);

  const stats = useMemo(() => {
    const active = schools.filter((s) => s.isActive).length;
    const cutoff = loadedAt - 30 * DAY_MS;
    return {
      total: schools.length,
      active,
      inactive: schools.length - active,
      recent: schools.filter((s) => new Date(s.createdAt).getTime() >= cutoff).length,
    };
  }, [schools, loadedAt]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return schools.filter((s) => {
      if (statusFilter === 'active' && !s.isActive) return false;
      if (statusFilter === 'inactive' && s.isActive) return false;
      return !q || s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
    });
  }, [schools, query, statusFilter]);

  const hasRows = !loading && filtered.length > 0;

  return (
    <>
      <PageHeader
        title="Schools"
        breadcrumbs={[{ label: 'Platform' }, { label: 'Schools' }]}
        description="Onboard schools, manage their admin accounts and monitor status."
        actions={
          <>
            <Tooltip label="Refresh">
              <ActionIcon variant="default" size="lg" onClick={loadSchools} loading={loading} aria-label="Refresh list">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
            <Button leftSection={<IconPlus size={16} />} onClick={addModal.open}>Add school</Button>
          </>
        }
      />

      <SimpleGrid cols={{ base: 2, lg: 4 }} mb="lg">
        <StatCard label="Total schools" value={stats.total} icon={IconBuildingCommunity} color="brand" loading={loading} />
        <StatCard label="Active" value={stats.active} icon={IconCircleCheck} color="teal" loading={loading} />
        <StatCard label="Inactive" value={stats.inactive} icon={IconCircleOff} color="gray" loading={loading} />
        <StatCard label="Added last 30 days" value={stats.recent} icon={IconCalendarPlus} color="violet" loading={loading} />
      </SimpleGrid>

      <Card padding="sm">
        {/* Toolbar */}
        <Card.Section withBorder inheritPadding py="sm">
          <Group justify="space-between" gap="sm">
            <TextInput
              placeholder="Search by name or address…"
              aria-label="Search schools"
              leftSection={<IconSearch size={16} />}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              w={{ base: '100%', sm: 320 }}
            />
            <SegmentedControl
              size="xs"
              w={{ base: '100%', sm: 'auto' }}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
              data={[
                { value: 'all', label: `All (${stats.total})` },
                { value: 'active', label: `Active (${stats.active})` },
                { value: 'inactive', label: `Inactive (${stats.inactive})` },
              ]}
            />
          </Group>
        </Card.Section>

        {loading ? (
          <Stack p="md" gap="md" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Group key={i} wrap="nowrap">
                <Skeleton h={36} w={36} radius="md" />
                <Stack gap={6} flex={1}>
                  <Skeleton h={12} w="35%" />
                  <Skeleton h={10} w="55%" />
                </Stack>
              </Group>
            ))}
          </Stack>
        ) : schools.length === 0 ? (
          <EmptyState
            py={56}
            icon={<IconBuildingCommunity size={28} stroke={1.5} />}
            title="No schools yet"
            description="Add your first school to create its admin account and start onboarding buses and parents."
          >
            <Button mt="md" leftSection={<IconPlus size={16} />} onClick={addModal.open}>Add school</Button>
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState
            py={48}
            icon={<IconSearch size={26} stroke={1.5} />}
            title="No matching schools"
            description="Try a different search term or status filter."
          >
            <Button mt="md" variant="default" onClick={() => { setQuery(''); setStatusFilter('all'); }}>Clear filters</Button>
          </EmptyState>
        ) : null}

        {/* Tablet / desktop: table */}
        {hasRows && (
          <Card.Section withBorder visibleFrom="sm">
            <Table.ScrollContainer minWidth={560}>
              <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>School</Table.Th>
                    <Table.Th w={140}>Status</Table.Th>
                    <Table.Th w={160}>Created</Table.Th>
                    <Table.Th w={56}><VisuallyHidden>Actions</VisuallyHidden></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtered.map((s) => (
                    <Table.Tr key={s.id}>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <SchoolAvatar school={s} />
                          <Box miw={0}>
                            <Anchor component={Link} href={settingsHref(s.id)} fw={500} size="sm" c="var(--mantine-color-text)" truncate="end" display="block">
                              {s.name}
                            </Anchor>
                            <Text size="xs" c="dimmed" truncate="end" maw={480} title={s.address}>{s.address}</Text>
                          </Box>
                        </Group>
                      </Table.Td>
                      <Table.Td><StatusBadge active={s.isActive} /></Table.Td>
                      <Table.Td><Text size="sm" c="dimmed">{formatDate(s.createdAt)}</Text></Table.Td>
                      <Table.Td ta="right"><RowActions school={s} onReset={() => setResetTarget(s)} /></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Card.Section>
        )}

        {/* Phone: stacked list */}
        {hasRows && (
          <Card.Section withBorder hiddenFrom="sm">
            {filtered.map((s, i) => (
              <Box key={s.id}>
                {i > 0 && <Divider />}
                <Group wrap="nowrap" gap="sm" p="sm">
                  <SchoolAvatar school={s} />
                  <Box miw={0} flex={1}>
                    <Anchor component={Link} href={settingsHref(s.id)} fw={500} size="sm" c="var(--mantine-color-text)" truncate="end" display="block">
                      {s.name}
                    </Anchor>
                    <Group gap="xs" mt={4}>
                      <StatusBadge active={s.isActive} />
                      <Text size="xs" c="dimmed">{formatDate(s.createdAt)}</Text>
                    </Group>
                  </Box>
                  <RowActions school={s} onReset={() => setResetTarget(s)} />
                </Group>
              </Box>
            ))}
          </Card.Section>
        )}

        {hasRows && (
          <Card.Section withBorder inheritPadding py="sm">
            <Text size="xs" c="dimmed">
              Showing {filtered.length} of {schools.length} school{schools.length !== 1 ? 's' : ''}
            </Text>
          </Card.Section>
        )}
      </Card>

      <AddSchoolModal opened={addOpened} onClose={addModal.close} onCreated={loadSchools} />
      <ResetPasswordModal school={resetTarget} onClose={() => setResetTarget(null)} />
    </>
  );
}
