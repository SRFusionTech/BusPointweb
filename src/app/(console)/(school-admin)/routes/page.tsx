'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ActionIcon, Button, EmptyState, Group, Menu, Modal, SegmentedControl, SimpleGrid,
  Stack, Text, TextInput, ThemeIcon, Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAlertTriangle, IconBus, IconDots, IconEdit, IconMapPin, IconPlus, IconRefresh,
  IconRoute, IconTrash,
} from '@tabler/icons-react';
import { api, type RouteSummary } from '@/lib/api';
import { notify, errorMessage } from '@/lib/notify';
import { PageHeader } from '@/components/console/PageHeader';
import { DataTable, type Column } from '@/components/console/DataTable';
import { StatusPill, type PillTone } from '@/components/console/StatusPill';
import { StatCard } from '@/components/console/StatCard';
import { ConfirmDialog } from '@/components/console/ConfirmDialog';
import { formatDate } from '@/components/console/DetailSection';

type RouteFilter = 'all' | 'in-use' | 'needs-stops';

function routeState(r: RouteSummary): { tone: PillTone; label: string } {
  if (!r.stopCount) return { tone: 'orange', label: 'No stops' };
  if (!r.busCount) return { tone: 'gray', label: 'Not in use' };
  return { tone: 'green', label: 'In use' };
}

// ─── Create / Rename modal ────────────────────────────────────────────────────

const routeSchema = z.object({ name: z.string().trim().min(1, 'Route name is required') });
type RouteForm = z.infer<typeof routeSchema>;

function RouteModal({
  opened, onClose, editing, onSaved, onCreated,
}: {
  opened: boolean;
  onClose: () => void;
  editing: RouteSummary | null;
  onSaved: () => void;
  onCreated: (id: string) => void;
}) {
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<RouteForm>({ resolver: zodResolver(routeSchema) });

  useEffect(() => { if (opened) reset({ name: editing?.name ?? '' }); }, [opened, editing, reset]);

  async function onSubmit(values: RouteForm) {
    try {
      if (editing) {
        await api.routes.update(editing.id, values);
        notify.success('Route renamed.');
        onSaved();
        onClose();
      } else {
        const res = await api.routes.create(values);
        notify.success('Route created. Now add its stops.');
        onClose();
        onCreated(res.data.id);
      }
    } catch (err) {
      notify.error(errorMessage(err, `Failed to ${editing ? 'rename' : 'create'} route`));
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600} size="lg">{editing ? 'Rename route' : 'New route'}</Text>}
      size="sm"
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          <TextInput
            label="Route name"
            placeholder="Ameerpet – Morning"
            description={editing ? undefined : "You'll add stops on the map next."}
            withAsterisk
            data-autofocus
            disabled={isSubmitting}
            error={errors.name?.message}
            {...register('name')}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Rename' : 'Create & add stops'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoutesPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RouteFilter>('all');

  const [editing, setEditing] = useState<RouteSummary | null>(null);
  const [target, setTarget] = useState<RouteSummary | null>(null);
  const [formOpen, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [confirmOpen, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  const fetchRoutes = useCallback((isCurrent: () => boolean = () => true) =>
    api.routes.list()
      .then((res) => { if (isCurrent()) setRoutes(res.data); })
      .catch((err) => { if (isCurrent()) notify.error(errorMessage(err, 'Failed to load routes')); })
      .finally(() => { if (isCurrent()) setLoading(false); }),
  []);

  const reload = useCallback(() => { setLoading(true); fetchRoutes(); }, [fetchRoutes]);

  useEffect(() => {
    let current = true;
    fetchRoutes(() => current);
    return () => { current = false; };
  }, [fetchRoutes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return routes.filter((r) => {
      if (filter === 'in-use' && !r.busCount) return false;
      if (filter === 'needs-stops' && r.stopCount) return false;
      return !q || r.name.toLowerCase().includes(q);
    });
  }, [routes, search, filter]);

  const total = routes.length;
  const totalStops = routes.reduce((sum, r) => sum + (r.stopCount ?? 0), 0);
  const inUse = routes.filter((r) => r.busCount).length;
  const needStops = routes.filter((r) => !r.stopCount).length;

  const openRoute = (r: RouteSummary) => router.push(`/routes/${r.id}`);
  function startCreate() { setEditing(null); openForm(); }
  function startRename(r: RouteSummary) { setEditing(r); openForm(); }
  function startDelete(r: RouteSummary) { setTarget(r); openConfirm(); }

  async function handleDelete() {
    if (!target) return;
    try {
      await api.routes.remove(target.id);
      notify.success('Route deleted.');
      reload();
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to delete route'));
    }
  }

  const columns: Column<RouteSummary>[] = [
    {
      key: 'route',
      header: 'Route',
      render: (r) => (
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon variant="light" color="blue" size={36} radius="md" style={{ flexShrink: 0 }}>
            <IconRoute size={18} stroke={1.75} />
          </ThemeIcon>
          <div style={{ minWidth: 0 }}>
            <Text fw={600} size="sm" truncate="end">{r.name}</Text>
            <Text size="xs" c="dimmed">Created {formatDate(r.createdAt)}</Text>
          </div>
        </Group>
      ),
    },
    {
      key: 'stops',
      header: 'Stops',
      width: 140,
      render: (r) => (
        <Group gap={6} wrap="nowrap">
          <IconMapPin size={15} stroke={1.75} color="var(--mantine-color-dimmed)" />
          <Text size="sm" fw={500}>{r.stopCount ?? 0}</Text>
        </Group>
      ),
    },
    {
      key: 'buses',
      header: 'Buses',
      width: 140,
      render: (r) => (
        <Group gap={6} wrap="nowrap">
          <IconBus size={15} stroke={1.75} color="var(--mantine-color-dimmed)" />
          <Text size="sm" fw={500}>{r.busCount ?? 0}</Text>
        </Group>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 140,
      render: (r) => { const s = routeState(r); return <StatusPill tone={s.tone}>{s.label}</StatusPill>; },
    },
  ];

  return (
    <>
      <PageHeader
        title="Routes"
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Routes' }]}
        description="The paths your buses run. Open a route to place and order its stops on the map."
        actions={
          <>
            <Tooltip label="Refresh">
              <ActionIcon variant="default" size="lg" onClick={reload} loading={loading} aria-label="Refresh">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
            <Button leftSection={<IconPlus size={16} />} onClick={startCreate}>New route</Button>
          </>
        }
      />

      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="md" mb="lg">
        <StatCard label="Total routes" value={total} icon={<IconRoute size={20} />} color="blue" loading={loading} hint="Defined for your school" />
        <StatCard label="Total stops" value={totalStops} icon={<IconMapPin size={20} />} color="grape" loading={loading} hint={total ? `${(totalStops / total).toFixed(1)} per route on average` : '—'} />
        <StatCard
          label="In use"
          value={inUse}
          icon={<IconBus size={20} />}
          color="teal"
          loading={loading}
          progress={total ? (inUse / total) * 100 : 0}
          hint={total ? `${total - inUse} not assigned to a bus` : 'No routes yet'}
        />
        <StatCard label="Need stops" value={needStops} icon={<IconAlertTriangle size={20} />} color="orange" loading={loading} hint={needStops ? 'Open the route to add stops' : 'Every route has stops'} />
      </SimpleGrid>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        totalCount={total}
        noun={['route', 'routes']}
        minWidth={760}
        onRowClick={openRoute}
        search={{ value: search, onChange: setSearch, placeholder: 'Search routes' }}
        filters={
          <SegmentedControl
            value={filter}
            onChange={(v) => setFilter(v as RouteFilter)}
            data={[
              { value: 'all', label: `All ${total}` },
              { value: 'in-use', label: `In use ${inUse}` },
              { value: 'needs-stops', label: `Need stops ${needStops}` },
            ]}
          />
        }
        onClearFilters={() => { setSearch(''); setFilter('all'); }}
        rowActions={(r) => (
          <Menu position="bottom-end" width={180}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" aria-label={`Actions for ${r.name}`}>
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconMapPin size={16} />} onClick={() => openRoute(r)}>Edit stops</Menu.Item>
              <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => startRename(r)}>Rename</Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={() => startDelete(r)}>Delete</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
        renderMobileRow={(r) => {
          const s = routeState(r);
          return (
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon variant="light" color="blue" size={36} radius="md"><IconRoute size={18} /></ThemeIcon>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Group gap="xs" justify="space-between" wrap="nowrap">
                  <Text fw={600} size="sm" truncate="end">{r.name}</Text>
                  <StatusPill tone={s.tone}>{s.label}</StatusPill>
                </Group>
                <Text size="xs" c="dimmed" mt={2}>{r.stopCount ?? 0} stops · {r.busCount ?? 0} buses</Text>
              </div>
            </Group>
          );
        }}
        emptyState={
          <EmptyState
            py={64}
            icon={<IconRoute size={28} stroke={1.5} />}
            title="No routes yet"
            description="Create a route, then click on the map to place each stop in the order the bus visits them."
          >
            <Button mt="md" leftSection={<IconPlus size={16} />} onClick={startCreate}>New route</Button>
          </EmptyState>
        }
      />

      <RouteModal
        opened={formOpen}
        onClose={closeForm}
        editing={editing}
        onSaved={reload}
        onCreated={(id) => router.push(`/routes/${id}`)}
      />
      <ConfirmDialog
        opened={confirmOpen}
        onClose={closeConfirm}
        onConfirm={handleDelete}
        title="Delete route?"
        message={
          <>“{target?.name}” and its {target?.stopCount ?? 0} stops will be deleted.
            {target?.busCount ? ` ${target.busCount} bus${target.busCount > 1 ? 'es' : ''} using it will be left without a route.` : ''}
          </>
        }
        confirmLabel="Delete route"
        danger
      />
    </>
  );
}
