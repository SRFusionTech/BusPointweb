'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ActionIcon, Avatar, Button, Code, CopyButton, Drawer, EmptyState, Group, Menu, Modal, NumberInput,
  SegmentedControl, SimpleGrid, Stack, Text, TextInput, ThemeIcon, Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBus, IconCheck, IconCircleCheck, IconCopy, IconDots, IconEdit, IconPlus, IconRefresh, IconRoute,
  IconTrash, IconUserCheck, IconUserOff,
} from '@tabler/icons-react';
import { CreatableSelect } from '@/components/console/CreatableSelect';
import { api, type BusSummary, type DriverSummary, type RouteSummary } from '@/lib/api';
import { notify, errorMessage } from '@/lib/notify';
import { PageHeader } from '@/components/console/PageHeader';
import { DataTable, type Column } from '@/components/console/DataTable';
import { StatusPill, type PillTone } from '@/components/console/StatusPill';
import { StatCard } from '@/components/console/StatCard';
import { ConfirmDialog } from '@/components/console/ConfirmDialog';
import { DetailRows, DetailSection, PlateChip, formatDate } from '@/components/console/DetailSection';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SetupFilter = 'all' | 'ready' | 'pending';

function setupState(b: BusSummary): { tone: PillTone; label: string } {
  if (b.routeId && b.driver) return { tone: 'green', label: 'Ready' };
  if (!b.routeId && !b.driver) return { tone: 'gray', label: 'Needs setup' };
  return { tone: 'orange', label: b.routeId ? 'Needs driver' : 'Needs route' };
}

function AssignButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="subtle"
      size="compact-sm"
      leftSection={<IconPlus size={14} />}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      px={6}
    >
      {label}
    </Button>
  );
}

// ─── Add / Edit bus modal ─────────────────────────────────────────────────────

const busSchema = z.object({
  name: z.string().trim().min(1, 'Bus name is required'),
  plateNumber: z.string().trim().min(2, 'Plate number is required'),
  make: z.string().trim().optional(),
  model: z.string().trim().optional(),
  capacity: z.number().int().min(1).max(200).optional(),
});
type BusForm = z.infer<typeof busSchema>;

function BusModal({
  opened, onClose, onSaved, editing,
}: {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: BusSummary | null;
}) {
  const isEdit = !!editing;
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<BusForm>({ resolver: zodResolver(busSchema) });

  useEffect(() => {
    if (!opened) return;
    reset(editing
      ? {
          name: editing.name,
          plateNumber: editing.plateNumber,
          make: editing.make ?? '',
          model: editing.model ?? '',
          capacity: editing.capacity ?? undefined,
        }
      : { name: '', plateNumber: '', make: '', model: '', capacity: undefined });
  }, [opened, editing, reset]);

  async function onSubmit(values: BusForm) {
    const payload = {
      name: values.name,
      plateNumber: values.plateNumber,
      make: values.make || undefined,
      model: values.model || undefined,
      capacity: values.capacity,
    };
    try {
      if (editing) {
        await api.buses.update(editing.id, payload);
        notify.success('Bus updated.');
      } else {
        await api.buses.create(payload);
        notify.success('Bus added.');
      }
      onSaved();
      onClose();
    } catch (err) {
      notify.error(errorMessage(err, `Failed to ${isEdit ? 'update' : 'add'} bus`));
    }
  }

  const capacity = watch('capacity');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600} size="lg">{isEdit ? 'Edit bus' : 'Add bus'}</Text>}
      size="md"
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          <Group grow align="flex-start">
            <TextInput
              label="Bus name"
              placeholder="Bus 1"
              withAsterisk
              data-autofocus
              disabled={isSubmitting}
              error={errors.name?.message}
              {...register('name')}
            />
            <TextInput
              label="Plate number"
              placeholder="TS 09 AB 1234"
              withAsterisk
              disabled={isSubmitting}
              error={errors.plateNumber?.message}
              {...register('plateNumber')}
            />
          </Group>
          <Group grow align="flex-start">
            <TextInput label="Make" placeholder="Tata" disabled={isSubmitting} {...register('make')} />
            <TextInput label="Model" placeholder="Starbus" disabled={isSubmitting} {...register('model')} />
          </Group>
          <NumberInput
            label="Seating capacity"
            placeholder="40"
            min={1}
            max={200}
            disabled={isSubmitting}
            error={errors.capacity?.message}
            value={capacity ?? ''}
            onChange={(v) => setValue('capacity', typeof v === 'number' ? v : undefined)}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save changes' : 'Add bus'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// ─── Assign route modal ───────────────────────────────────────────────────────

function AssignRouteModal({
  opened, onClose, onSaved, bus, routes,
}: {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
  bus: BusSummary | null;
  routes: RouteSummary[];
}) {
  const router = useRouter();
  // Parent remounts this modal (via key) each time it opens, so initial state is fresh
  const [routeId, setRouteId] = useState<string | null>(bus?.routeId ?? null);
  const [saving, setSaving] = useState(false);
  /** non-null while the "name your new route" step is shown */
  const [newName, setNewName] = useState<string | null>(null);

  async function handleSave() {
    if (!bus) return;
    setSaving(true);
    try {
      await api.buses.update(bus.id, { routeId });
      notify.success(routeId ? 'Route assigned.' : 'Route removed.');
      onSaved();
      onClose();
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to assign route'));
    } finally {
      setSaving(false);
    }
  }

  async function createAndAssign(name: string) {
    if (!bus) return;
    setSaving(true);
    try {
      const res = await api.routes.create({ name });
      await api.buses.update(bus.id, { routeId: res.data.id });
      notify.success(`“${name}” created and assigned to ${bus.name}. Now place its stops.`);
      onSaved();
      onClose();
      router.push(`/routes/${res.data.id}`);
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to create route'));
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600} size="lg">{newName === null ? 'Assign route' : 'New route'}</Text>}
      size="sm"
      closeOnClickOutside={!saving}
    >
      {newName === null ? (
        <Stack gap="md">
          <Text size="sm" c="dimmed">Choose the route <Text span fw={600} c="bright">{bus?.name}</Text> runs on, or create one.</Text>
          <CreatableSelect
            label="Route"
            entity="route"
            placeholder={routes.length ? 'Search or create a route' : 'No routes yet — type a name to create one'}
            data={routes.map((r) => ({ value: r.id, label: r.name, description: `${r.stopCount ?? 0} stops` }))}
            value={routeId}
            onChange={setRouteId}
            onCreate={(name) => (name ? createAndAssign(name) : setNewName(''))}
            clearable
            disabled={saving}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={routeId === (bus?.routeId ?? null)}>Save</Button>
          </Group>
        </Stack>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (newName.trim()) createAndAssign(newName.trim()); }}>
          <Stack gap="md">
            <TextInput
              label="Route name"
              placeholder="Ameerpet – Morning"
              description={`It will be assigned to ${bus?.name}. You'll place its stops on the map next.`}
              value={newName}
              onChange={(e) => setNewName(e.currentTarget.value)}
              data-autofocus
              disabled={saving}
            />
            <Group justify="space-between">
              <Button variant="subtle" color="gray" onClick={() => setNewName(null)} disabled={saving}>Back</Button>
              <Button type="submit" loading={saving} disabled={!newName.trim()}>Create &amp; add stops</Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}

// ─── Assign driver modal ──────────────────────────────────────────────────────

function AssignDriverModal({
  opened, onClose, onSaved, bus, drivers,
}: {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
  bus: BusSummary | null;
  drivers: DriverSummary[];
}) {
  const [driverId, setDriverId] = useState<string | null>(bus?.driver?.id ?? null);
  const [saving, setSaving] = useState(false);
  /** non-null while the inline "new driver" form is shown */
  const [draft, setDraft] = useState<{ fullName: string; phone: string } | null>(null);
  const [created, setCreated] = useState<{ name: string; password: string } | null>(null);

  const phoneValid = /^[6-9]\d{9}$/.test(draft?.phone.trim() ?? '');
  const draftValid = !!draft && draft.fullName.trim().length >= 2 && phoneValid;

  async function createAndAssign() {
    if (!bus || !draft) return;
    setSaving(true);
    try {
      const res = await api.drivers.create({ fullName: draft.fullName.trim(), phone: draft.phone.trim() });
      await api.buses.assignDriver(bus.id, res.data.id);
      setCreated({ name: res.data.fullName ?? draft.fullName, password: res.data.tempPassword });
      onSaved();
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to create driver'));
    } finally {
      setSaving(false);
    }
  }

  async function run(action: () => Promise<unknown>, message: string) {
    setSaving(true);
    try {
      await action();
      notify.success(message);
      onSaved();
      onClose();
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to update driver'));
    } finally {
      setSaving(false);
    }
  }

  const options = drivers
    .filter((d) => d.isActive)
    .map((d) => {
      const elsewhere = d.bus && d.bus.id !== bus?.id;
      return {
        value: d.id,
        label: `${d.fullName ?? d.phone ?? 'Driver'}${elsewhere ? ` · on ${d.bus!.name}` : ''}`,
        disabled: !!elsewhere,
      };
    });

  const title = created ? 'Driver added' : draft ? 'New driver' : 'Assign driver';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600} size="lg">{title}</Text>}
      size="sm"
      closeOnClickOutside={!saving && !created}
    >
      {created ? (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            <Text span fw={600} c="bright">{created.name}</Text> now drives {bus?.name}. Share this temporary
            password — it won’t be shown again. They sign in with their phone number.
          </Text>
          <Group
            gap="xs"
            wrap="nowrap"
            p="sm"
            style={{ border: '1px dashed var(--mantine-color-default-border)', borderRadius: 'var(--mantine-radius-md)' }}
          >
            <Code fz="lg" fw={700} bg="transparent" style={{ flex: 1, letterSpacing: 2 }}>{created.password}</Code>
            <CopyButton value={created.password} timeout={2000}>
              {({ copied, copy }) => (
                <Button
                  size="xs"
                  variant={copied ? 'light' : 'filled'}
                  color={copied ? 'teal' : undefined}
                  leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  onClick={copy}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              )}
            </CopyButton>
          </Group>
          <Group justify="flex-end"><Button onClick={onClose}>Done</Button></Group>
        </Stack>
      ) : draft ? (
        <form onSubmit={(e) => { e.preventDefault(); if (draftValid) createAndAssign(); }}>
          <Stack gap="md">
            <TextInput
              label="Full name"
              placeholder="Ravi Kumar"
              withAsterisk
              data-autofocus
              value={draft.fullName}
              onChange={(e) => { const fullName = e.currentTarget.value; setDraft((d) => d && { ...d, fullName }); }}
              disabled={saving}
            />
            <TextInput
              label="Phone number"
              placeholder="9876543210"
              description="Used to sign in to the mobile app."
              withAsterisk
              value={draft.phone}
              onChange={(e) => { const phone = e.currentTarget.value; setDraft((d) => d && { ...d, phone }); }}
              error={draft.phone && !phoneValid ? 'Digits only, 7–15 long' : undefined}
              disabled={saving}
            />
            <Group justify="space-between">
              <Button variant="subtle" color="gray" onClick={() => setDraft(null)} disabled={saving}>Back</Button>
              <Button type="submit" loading={saving} disabled={!draftValid}>Create &amp; assign</Button>
            </Group>
          </Stack>
        </form>
      ) : (
      <Stack gap="md">
        <Text size="sm" c="dimmed">Choose who drives <Text span fw={600} c="bright">{bus?.name}</Text>, or add a new driver. Drivers already on another bus are disabled.</Text>
        <CreatableSelect
          label="Driver"
          entity="driver"
          placeholder={options.length ? 'Search or add a driver' : 'No drivers yet — type a name to add one'}
          data={options}
          value={driverId}
          onChange={setDriverId}
          onCreate={(name) => setDraft({ fullName: name, phone: '' })}
          disabled={saving}
        />
        <Group justify="space-between">
          {bus?.driver ? (
            <Button variant="subtle" color="red" disabled={saving} onClick={() => run(() => api.buses.unassignDriver(bus.id), 'Driver unassigned.')}>
              Unassign
            </Button>
          ) : <span />}
          <Group gap="sm">
            <Button variant="default" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button
              loading={saving}
              disabled={!driverId || driverId === bus?.driver?.id}
              onClick={() => bus && driverId && run(() => api.buses.assignDriver(bus.id, driverId), 'Driver assigned.')}
            >
              Assign
            </Button>
          </Group>
        </Group>
      </Stack>
      )}
    </Modal>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

function BusDrawer({
  bus, route, onClose, onEdit, onAssignRoute, onAssignDriver, onRemove,
}: {
  bus: BusSummary | null;
  route: RouteSummary | undefined;
  onClose: () => void;
  onEdit: () => void;
  onAssignRoute: () => void;
  onAssignDriver: () => void;
  onRemove: () => void;
}) {
  const state = bus ? setupState(bus) : null;
  return (
    <Drawer opened={!!bus} onClose={onClose} position="right" size="md" title={<Text fw={600}>Bus details</Text>}>
      {bus && state && (
        <Stack gap="lg">
          <Group gap="md" wrap="nowrap">
            <ThemeIcon variant="light" color="brand" size={48} radius="md">
              <IconBus size={24} stroke={1.75} />
            </ThemeIcon>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text fw={600} size="lg" truncate="end">{bus.name}</Text>
              <Group gap="xs" mt={4}>
                <PlateChip plate={bus.plateNumber} />
                <StatusPill tone={state.tone}>{state.label}</StatusPill>
              </Group>
            </div>
          </Group>

          <DetailSection title="Vehicle">
            <DetailRows rows={[
              { label: 'Make', value: bus.make || '—' },
              { label: 'Model', value: bus.model || '—' },
              { label: 'Capacity', value: bus.capacity ? `${bus.capacity} seats` : '—' },
              { label: 'Added', value: formatDate(bus.createdAt) },
            ]} />
          </DetailSection>

          <DetailSection
            title="Route"
            action={<Button variant="subtle" size="compact-xs" onClick={onAssignRoute}>{route ? 'Change' : 'Assign'}</Button>}
          >
            {route ? (
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon variant="light" color="blue" size={32} radius="md"><IconRoute size={16} /></ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>{route.name}</Text>
                  <Text size="xs" c="dimmed">{route.stopCount ?? 0} stops</Text>
                </div>
              </Group>
            ) : (
              <Text size="sm" c="dimmed">No route assigned yet.</Text>
            )}
          </DetailSection>

          <DetailSection
            title="Driver"
            action={<Button variant="subtle" size="compact-xs" onClick={onAssignDriver}>{bus.driver ? 'Change' : 'Assign'}</Button>}
          >
            {bus.driver ? (
              <Group gap="sm" wrap="nowrap">
                <Avatar name={bus.driver.fullName ?? ''} color="initials" size={32} radius="xl" />
                <div>
                  <Text size="sm" fw={500}>{bus.driver.fullName ?? '—'}</Text>
                  <Text size="xs" c="dimmed" ff="monospace">{bus.driver.phone ?? '—'}</Text>
                </div>
              </Group>
            ) : (
              <Text size="sm" c="dimmed">No driver assigned yet.</Text>
            )}
          </DetailSection>

          <Group justify="space-between" mt="sm">
            <Button variant="subtle" color="red" leftSection={<IconTrash size={16} />} onClick={onRemove}>Remove bus</Button>
            <Button variant="default" leftSection={<IconEdit size={16} />} onClick={onEdit}>Edit details</Button>
          </Group>
        </Stack>
      )}
    </Drawer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BusesPage() {
  const [buses, setBuses] = useState<BusSummary[]>([]);
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SetupFilter>('all');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [target, setTarget] = useState<BusSummary | null>(null);
  const [editing, setEditing] = useState<BusSummary | null>(null);

  const [formOpen, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [routeOpen, { open: openRoute, close: closeRoute }] = useDisclosure(false);
  const [driverOpen, { open: openDriver, close: closeDriver }] = useDisclosure(false);
  const [confirmOpen, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  const fetchAll = useCallback((isCurrent: () => boolean = () => true) =>
    Promise.all([api.buses.list(), api.routes.list(), api.drivers.list()])
      .then(([b, r, d]) => {
        if (!isCurrent()) return;
        setBuses(b.data);
        setRoutes(r.data);
        setDrivers(d.data);
      })
      .catch((err) => { if (isCurrent()) notify.error(errorMessage(err, 'Failed to load buses')); })
      .finally(() => { if (isCurrent()) setLoading(false); }),
  []);

  const reload = useCallback(() => { setLoading(true); fetchAll(); }, [fetchAll]);

  useEffect(() => {
    let current = true;
    fetchAll(() => current);
    return () => { current = false; };
  }, [fetchAll]);

  const routeById = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes]);
  const selected = buses.find((b) => b.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return buses.filter((b) => {
      const ready = !!(b.routeId && b.driver);
      if (filter === 'ready' && !ready) return false;
      if (filter === 'pending' && ready) return false;
      if (!q) return true;
      return [b.name, b.plateNumber, b.driver?.fullName, b.routeId ? routeById.get(b.routeId)?.name : null]
        .some((v) => v?.toLowerCase().includes(q));
    });
  }, [buses, search, filter, routeById]);

  const total = buses.length;
  const ready = buses.filter((b) => b.routeId && b.driver).length;
  const noRoute = buses.filter((b) => !b.routeId).length;
  const noDriver = buses.filter((b) => !b.driver).length;

  function startCreate() { setEditing(null); openForm(); }
  function startEdit(b: BusSummary) { setEditing(b); openForm(); }
  function startAssignRoute(b: BusSummary) { setTarget(b); openRoute(); }
  function startAssignDriver(b: BusSummary) { setTarget(b); openDriver(); }
  function startRemove(b: BusSummary) { setTarget(b); openConfirm(); }

  async function handleRemove() {
    if (!target) return;
    try {
      await api.buses.remove(target.id);
      notify.success('Bus removed.');
      if (selectedId === target.id) setSelectedId(null);
      reload();
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to remove bus'));
    }
  }

  const columns: Column<BusSummary>[] = [
    {
      key: 'bus',
      header: 'Bus',
      render: (b) => (
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon variant="light" color="brand" size={36} radius="md" style={{ flexShrink: 0 }}>
            <IconBus size={18} stroke={1.75} />
          </ThemeIcon>
          <div style={{ minWidth: 0 }}>
            <Text fw={600} size="sm" truncate="end">{b.name}</Text>
            <Text size="xs" c="dimmed" truncate="end">
              {[b.make, b.model].filter(Boolean).join(' · ') || 'No vehicle details'}
              {b.capacity ? ` · ${b.capacity} seats` : ''}
            </Text>
          </div>
        </Group>
      ),
    },
    { key: 'plate', header: 'Plate', width: 150, render: (b) => <PlateChip plate={b.plateNumber} /> },
    {
      key: 'route',
      header: 'Route',
      width: 200,
      render: (b) => {
        const r = b.routeId ? routeById.get(b.routeId) : undefined;
        return r ? (
          <div style={{ minWidth: 0 }}>
            <Text size="sm" fw={500} truncate="end">{r.name}</Text>
            <Text size="xs" c="dimmed">{r.stopCount ?? 0} stops</Text>
          </div>
        ) : <AssignButton label="Assign route" onClick={() => startAssignRoute(b)} />;
      },
    },
    {
      key: 'driver',
      header: 'Driver',
      width: 220,
      render: (b) => b.driver ? (
        <Group gap="sm" wrap="nowrap">
          <Avatar name={b.driver.fullName ?? ''} color="initials" size={30} radius="xl" />
          <div style={{ minWidth: 0 }}>
            <Text size="sm" fw={500} truncate="end">{b.driver.fullName ?? '—'}</Text>
            <Text size="xs" c="dimmed" ff="monospace">{b.driver.phone ?? ''}</Text>
          </div>
        </Group>
      ) : <AssignButton label="Assign driver" onClick={() => startAssignDriver(b)} />,
    },
    {
      key: 'status',
      header: 'Status',
      width: 140,
      render: (b) => { const s = setupState(b); return <StatusPill tone={s.tone}>{s.label}</StatusPill>; },
    },
  ];

  return (
    <>
      <PageHeader
        title="Buses"
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Buses' }]}
        description="Your school's fleet. A bus is ready to run once it has a route and a driver."
        actions={
          <>
            <Tooltip label="Refresh">
              <ActionIcon variant="default" size="lg" onClick={reload} loading={loading} aria-label="Refresh">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
            <Button leftSection={<IconPlus size={16} />} onClick={startCreate}>Add bus</Button>
          </>
        }
      />

      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="md" mb="lg">
        <StatCard label="Total buses" value={total} icon={<IconBus size={20} />} loading={loading} hint="Active in your fleet" />
        <StatCard
          label="Ready to run"
          value={ready}
          icon={<IconCircleCheck size={20} />}
          color="teal"
          loading={loading}
          progress={total ? (ready / total) * 100 : 0}
          hint={total ? `${Math.round((ready / total) * 100)}% of fleet` : 'No buses yet'}
        />
        <StatCard label="Missing a route" value={noRoute} icon={<IconRoute size={20} />} color="orange" loading={loading} hint={noRoute ? 'Assign from the table' : 'All buses routed'} />
        <StatCard label="Missing a driver" value={noDriver} icon={<IconUserOff size={20} />} color="red" loading={loading} hint={noDriver ? 'Assign from the table' : 'All buses staffed'} />
      </SimpleGrid>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(b) => b.id}
        loading={loading}
        totalCount={total}
        noun={['bus', 'buses']}
        minWidth={900}
        onRowClick={(b) => setSelectedId(b.id)}
        search={{ value: search, onChange: setSearch, placeholder: 'Search bus, plate, route or driver' }}
        filters={
          <SegmentedControl
            value={filter}
            onChange={(v) => setFilter(v as SetupFilter)}
            data={[
              { value: 'all', label: `All ${total}` },
              { value: 'ready', label: `Ready ${ready}` },
              { value: 'pending', label: `Needs setup ${total - ready}` },
            ]}
          />
        }
        onClearFilters={() => { setSearch(''); setFilter('all'); }}
        rowActions={(b) => (
          <Menu position="bottom-end" width={190}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" aria-label={`Actions for ${b.name}`}>
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => startEdit(b)}>Edit details</Menu.Item>
              <Menu.Item leftSection={<IconRoute size={16} />} onClick={() => startAssignRoute(b)}>Assign route</Menu.Item>
              <Menu.Item leftSection={<IconUserCheck size={16} />} onClick={() => startAssignDriver(b)}>Assign driver</Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={() => startRemove(b)}>Remove bus</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
        renderMobileRow={(b) => {
          const s = setupState(b);
          return (
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon variant="light" color="brand" size={36} radius="md"><IconBus size={18} /></ThemeIcon>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Group gap="xs" justify="space-between" wrap="nowrap">
                  <Text fw={600} size="sm" truncate="end">{b.name}</Text>
                  <StatusPill tone={s.tone}>{s.label}</StatusPill>
                </Group>
                <Text size="xs" c="dimmed" truncate="end" mt={2}>
                  {b.plateNumber} · {b.driver?.fullName ?? 'No driver'}
                </Text>
              </div>
            </Group>
          );
        }}
        emptyState={
          <EmptyState
            py={64}
            icon={<IconBus size={28} stroke={1.5} />}
            title="No buses yet"
            description="Add your first bus, then give it a route and a driver so it's ready to run."
          >
            <Button mt="md" leftSection={<IconPlus size={16} />} onClick={startCreate}>Add bus</Button>
          </EmptyState>
        }
      />

      <BusDrawer
        bus={selected}
        route={selected?.routeId ? routeById.get(selected.routeId) : undefined}
        onClose={() => setSelectedId(null)}
        onEdit={() => selected && startEdit(selected)}
        onAssignRoute={() => selected && startAssignRoute(selected)}
        onAssignDriver={() => selected && startAssignDriver(selected)}
        onRemove={() => selected && startRemove(selected)}
      />

      <BusModal opened={formOpen} onClose={closeForm} onSaved={reload} editing={editing} />
      <AssignRouteModal key={`route-${target?.id}-${routeOpen}`} opened={routeOpen} onClose={closeRoute} onSaved={reload} bus={target} routes={routes} />
      <AssignDriverModal key={`driver-${target?.id}-${driverOpen}`} opened={driverOpen} onClose={closeDriver} onSaved={reload} bus={target} drivers={drivers} />
      <ConfirmDialog
        opened={confirmOpen}
        onClose={closeConfirm}
        onConfirm={handleRemove}
        title="Remove bus?"
        message={<>“{target?.name}” will be removed from your fleet and its driver will be unassigned.</>}
        confirmLabel="Remove bus"
        danger
      />
    </>
  );
}
