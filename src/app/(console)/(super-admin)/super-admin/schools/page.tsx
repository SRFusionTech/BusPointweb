'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionIcon, Box, Button, EmptyState, Group, Menu, SegmentedControl, SimpleGrid, Text, Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBuildingCommunity, IconCalendarPlus, IconCircleCheck, IconCircleOff, IconCopy, IconDots, IconKey,
  IconPlus, IconRefresh, IconSettings,
} from '@tabler/icons-react';
import { api, type SchoolSummary, type PlanSummary } from '@/lib/api';
import { notify, errorMessage } from '@/lib/notify';
import { PageHeader } from '@/components/console/PageHeader';
import { DataTable, type Column } from '@/components/console/DataTable';
import { StatusPill } from '@/components/console/StatusPill';
import { StatCard } from '@/components/console/StatCard';
import { AddSchoolModal } from '@/components/super-admin/AddSchoolModal';
import { ResetPasswordModal } from '@/components/super-admin/ResetPasswordModal';
import { formatDate, SchoolAvatar } from '@/components/super-admin/school-ui';

const DAY_MS = 86_400_000;
const settingsHref = (id: string) => `/super-admin/schools/${id}/settings`;

type StatusFilter = 'all' | 'active' | 'inactive';

export default function SchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<SchoolSummary[]>([]);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [resetTarget, setResetTarget] = useState<SchoolSummary | null>(null);
  const [addOpened, addModal] = useDisclosure(false);

  // "Added last 30 days" is relative to the last successful load
  const [loadedAt, setLoadedAt] = useState(0);

  const fetchSchools = useCallback((isCurrent: () => boolean = () => true) =>
    Promise.all([api.schools.list(), api.plans.list()])
      .then(([schoolsRes, plansRes]) => {
        if (!isCurrent()) return;
        setSchools(schoolsRes.data);
        setPlans(plansRes.data);
        setLoadedAt(Date.now());
      })
      .catch((err) => { if (isCurrent()) notify.error(errorMessage(err, 'Failed to load schools')); })
      .finally(() => { if (isCurrent()) setLoading(false); }),
  []);

  const loadSchools = useCallback(() => { setLoading(true); return fetchSchools(); }, [fetchSchools]);

  useEffect(() => {
    let current = true;
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

  function copyId(school: SchoolSummary) {
    navigator.clipboard.writeText(school.id)
      .then(() => notify.success('School ID copied to clipboard.'))
      .catch(() => notify.error('Could not copy to clipboard.'));
  }

  const columns: Column<SchoolSummary>[] = [
    {
      key: 'school',
      header: 'School',
      render: (s) => (
        <Group gap="sm" wrap="nowrap">
          <SchoolAvatar school={s} />
          <Box miw={0}>
            <Text fw={600} size="sm" truncate="end">{s.name}</Text>
            <Text size="xs" c="dimmed" truncate="end" maw={480} title={s.address}>{s.address}</Text>
          </Box>
        </Group>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 140,
      render: (s) => <StatusPill tone={s.isActive ? 'green' : 'gray'}>{s.isActive ? 'Active' : 'Inactive'}</StatusPill>,
    },
    {
      key: 'created',
      header: 'Created',
      width: 160,
      render: (s) => <Text size="sm" c="dimmed">{formatDate(s.createdAt)}</Text>,
    },
  ];

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

      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="md" mb="lg">
        <StatCard label="Total schools" value={stats.total} icon={<IconBuildingCommunity size={20} />} loading={loading} hint="On the platform" />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<IconCircleCheck size={20} />}
          color="teal"
          loading={loading}
          progress={stats.total ? (stats.active / stats.total) * 100 : 0}
          hint={stats.total ? `${Math.round((stats.active / stats.total) * 100)}% of schools` : 'No schools yet'}
        />
        <StatCard label="Inactive" value={stats.inactive} icon={<IconCircleOff size={20} />} color="gray" loading={loading} hint={stats.inactive ? 'Logins blocked' : 'None blocked'} />
        <StatCard label="Added last 30 days" value={stats.recent} icon={<IconCalendarPlus size={20} />} color="violet" loading={loading} hint="New onboardings" />
      </SimpleGrid>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(s) => s.id}
        loading={loading}
        totalCount={schools.length}
        noun={['school', 'schools']}
        minWidth={620}
        onRowClick={(s) => router.push(settingsHref(s.id))}
        search={{ value: query, onChange: setQuery, placeholder: 'Search by name or address' }}
        filters={
          <SegmentedControl
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            data={[
              { value: 'all', label: `All ${stats.total}` },
              { value: 'active', label: `Active ${stats.active}` },
              { value: 'inactive', label: `Inactive ${stats.inactive}` },
            ]}
          />
        }
        onClearFilters={() => { setQuery(''); setStatusFilter('all'); }}
        rowActions={(s) => (
          <Menu position="bottom-end" width={220}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" aria-label={`Actions for ${s.name}`}>
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconSettings size={16} />} onClick={() => router.push(settingsHref(s.id))}>Settings</Menu.Item>
              <Menu.Item leftSection={<IconKey size={16} />} onClick={() => setResetTarget(s)}>Reset admin password</Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconCopy size={16} />} onClick={() => copyId(s)}>Copy school ID</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
        renderMobileRow={(s) => (
          <Group gap="sm" wrap="nowrap">
            <SchoolAvatar school={s} />
            <Box miw={0} flex={1}>
              <Group gap="xs" justify="space-between" wrap="nowrap">
                <Text fw={600} size="sm" truncate="end">{s.name}</Text>
                <StatusPill tone={s.isActive ? 'green' : 'gray'}>{s.isActive ? 'Active' : 'Inactive'}</StatusPill>
              </Group>
              <Text size="xs" c="dimmed" truncate="end" mt={2}>{formatDate(s.createdAt)} · {s.address}</Text>
            </Box>
          </Group>
        )}
        emptyState={
          <EmptyState
            py={64}
            icon={<IconBuildingCommunity size={28} stroke={1.5} />}
            title="No schools yet"
            description="Add your first school to create its admin account and start onboarding buses and parents."
          >
            <Button mt="md" leftSection={<IconPlus size={16} />} onClick={addModal.open}>Add school</Button>
          </EmptyState>
        }
      />

      <AddSchoolModal opened={addOpened} onClose={addModal.close} onCreated={loadSchools} plans={plans} />
      <ResetPasswordModal school={resetTarget} onClose={() => setResetTarget(null)} />
    </>
  );
}
