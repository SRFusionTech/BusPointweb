'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ActionIcon, Alert, Avatar, Button, Code, CopyButton, Drawer, EmptyState, Group, Menu,
  Modal, SegmentedControl, SimpleGrid, Stack, Text, TextInput, ThemeIcon, Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBus, IconCheck, IconCopy, IconDots, IconEdit, IconInfoCircle, IconKey, IconPlayerPlay,
  IconPlus, IconRefresh, IconUserCheck, IconUserOff, IconUsers,
} from '@tabler/icons-react';
import { api, type DriverSummary } from '@/lib/api';
import { notify, errorMessage } from '@/lib/notify';
import { PageHeader } from '@/components/console/PageHeader';
import { DataTable, type Column } from '@/components/console/DataTable';
import { StatusPill } from '@/components/console/StatusPill';
import { StatCard } from '@/components/console/StatCard';
import { ConfirmDialog } from '@/components/console/ConfirmDialog';
import { DetailRows, DetailSection, PlateChip, formatDate } from '@/components/console/DetailSection';

type StatusFilter = 'all' | 'active' | 'inactive';

const displayName = (d: DriverSummary) => d.fullName ?? d.phone ?? 'Driver';

// ─── Add / Edit driver modal ──────────────────────────────────────────────────

const driverSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number (digits only)'),
});
type DriverForm = z.infer<typeof driverSchema>;

function DriverModal({
  opened, onClose, editing, onCreated, onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  editing: DriverSummary | null;
  onCreated: (name: string, password: string) => void;
  onSaved: () => void;
}) {
  const isEdit = !!editing;
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<DriverForm>({ resolver: zodResolver(driverSchema) });

  useEffect(() => {
    if (opened) reset({ fullName: editing?.fullName ?? '', phone: editing?.phone ?? '' });
  }, [opened, editing, reset]);

  async function onSubmit(values: DriverForm) {
    try {
      if (editing) {
        await api.drivers.update(editing.id, values);
        notify.success('Driver updated.');
        onSaved();
      } else {
        const res = await api.drivers.create(values);
        onCreated(res.data.fullName ?? values.fullName, res.data.tempPassword);
      }
      onClose();
    } catch (err) {
      notify.error(errorMessage(err, `Failed to ${isEdit ? 'update' : 'add'} driver`));
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600} size="lg">{isEdit ? 'Edit driver' : 'Add driver'}</Text>}
      size="sm"
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          <TextInput
            label="Full name"
            placeholder="Ravi Kumar"
            withAsterisk
            data-autofocus
            disabled={isSubmitting}
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <TextInput
            label="Phone number"
            placeholder="9876543210"
            description="The driver signs in to the mobile app with this number."
            withAsterisk
            disabled={isSubmitting}
            error={errors.phone?.message}
            {...register('phone')}
          />
          {!isEdit && (
            <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />} p="sm">
              <Text size="xs">A temporary password is generated and shown once after you save.</Text>
            </Alert>
          )}
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save changes' : 'Add driver'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// ─── One-time password modal ──────────────────────────────────────────────────

function PasswordModal({
  credentials, onClose,
}: {
  credentials: { name: string; password: string; isNew: boolean } | null;
  onClose: () => void;
}) {
  return (
    <Modal
      opened={!!credentials}
      onClose={onClose}
      title={<Text fw={600} size="lg">{credentials?.isNew ? 'Driver added' : 'Password reset'}</Text>}
      size="sm"
    >
      {credentials && (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Share this temporary password with <Text span fw={600} c="bright">{credentials.name}</Text>.
            It won’t be shown again.
          </Text>
          <Group
            gap="xs"
            wrap="nowrap"
            p="sm"
            style={{ border: '1px dashed var(--mantine-color-default-border)', borderRadius: 'var(--mantine-radius-md)' }}
          >
            <Code fz="lg" fw={700} bg="transparent" style={{ flex: 1, letterSpacing: 2 }}>{credentials.password}</Code>
            <CopyButton value={credentials.password} timeout={2000}>
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
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>Done</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

function DriverDrawer({
  driver, onClose, onEdit, onResetPassword, onToggleActive,
}: {
  driver: DriverSummary | null;
  onClose: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onToggleActive: () => void;
}) {
  return (
    <Drawer opened={!!driver} onClose={onClose} position="right" size="md" title={<Text fw={600}>Driver details</Text>}>
      {driver && (
        <Stack gap="lg">
          <Group gap="md" wrap="nowrap">
            <Avatar name={driver.fullName ?? ''} color="initials" size={52} radius="xl" />
            <div style={{ minWidth: 0 }}>
              <Text fw={600} size="lg" truncate="end">{displayName(driver)}</Text>
              <Group gap="xs" mt={4}>
                <StatusPill tone={driver.isActive ? 'green' : 'gray'}>{driver.isActive ? 'Active' : 'Inactive'}</StatusPill>
              </Group>
            </div>
          </Group>

          <DetailSection title="Account">
            <DetailRows rows={[
              { label: 'Phone (login)', value: <Text span ff="monospace" size="sm">{driver.phone ?? '—'}</Text> },
              { label: 'Sign-in', value: 'Mobile app' },
              { label: 'Added', value: formatDate(driver.createdAt) },
            ]} />
          </DetailSection>

          <DetailSection title="Assigned bus">
            {driver.bus ? (
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon variant="light" color="brand" size={32} radius="md"><IconBus size={16} /></ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>{driver.bus.name}</Text>
                  <PlateChip plate={driver.bus.plateNumber} />
                </div>
              </Group>
            ) : (
              <Text size="sm" c="dimmed">Not assigned. Assign drivers to buses from the Buses page.</Text>
            )}
          </DetailSection>

          <Group justify="space-between" mt="sm">
            <Button
              variant="subtle"
              color={driver.isActive ? 'red' : 'teal'}
              leftSection={driver.isActive ? <IconUserOff size={16} /> : <IconPlayerPlay size={16} />}
              onClick={onToggleActive}
            >
              {driver.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
            <Group gap="sm">
              <Button variant="default" leftSection={<IconKey size={16} />} onClick={onResetPassword}>Reset password</Button>
              <Button variant="default" leftSection={<IconEdit size={16} />} onClick={onEdit}>Edit</Button>
            </Group>
          </Group>
        </Stack>
      )}
    </Drawer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<DriverSummary | null>(null);
  const [target, setTarget] = useState<DriverSummary | null>(null);
  const [credentials, setCredentials] = useState<{ name: string; password: string; isNew: boolean } | null>(null);

  const [formOpen, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [confirmOpen, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  const fetchDrivers = useCallback((isCurrent: () => boolean = () => true) =>
    api.drivers.list()
      .then((res) => { if (isCurrent()) setDrivers(res.data); })
      .catch((err) => { if (isCurrent()) notify.error(errorMessage(err, 'Failed to load drivers')); })
      .finally(() => { if (isCurrent()) setLoading(false); }),
  []);

  const reload = useCallback(() => { setLoading(true); fetchDrivers(); }, [fetchDrivers]);

  useEffect(() => {
    let current = true;
    fetchDrivers(() => current);
    return () => { current = false; };
  }, [fetchDrivers]);

  const selected = drivers.find((d) => d.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drivers.filter((d) => {
      if (filter === 'active' && !d.isActive) return false;
      if (filter === 'inactive' && d.isActive) return false;
      if (!q) return true;
      return [d.fullName, d.phone, d.bus?.name, d.bus?.plateNumber].some((v) => v?.toLowerCase().includes(q));
    });
  }, [drivers, search, filter]);

  const total = drivers.length;
  const active = drivers.filter((d) => d.isActive).length;
  const onBus = drivers.filter((d) => d.isActive && d.bus).length;
  const unassigned = active - onBus;

  function startCreate() { setEditing(null); openForm(); }
  function startEdit(d: DriverSummary) { setEditing(d); openForm(); }

  async function handleResetPassword(d: DriverSummary) {
    try {
      const res = await api.drivers.resetPassword(d.id);
      setCredentials({ name: displayName(d), password: res.data.tempPassword, isNew: false });
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to reset password'));
    }
  }

  function handleToggleActive(d: DriverSummary) {
    if (d.isActive) {
      setTarget(d);
      openConfirm();
      return;
    }
    api.drivers.update(d.id, { isActive: true })
      .then(() => { notify.success('Driver reactivated.'); reload(); })
      .catch((err) => notify.error(errorMessage(err, 'Failed to reactivate driver')));
  }

  async function handleDeactivate() {
    if (!target) return;
    try {
      await api.drivers.remove(target.id);
      notify.success('Driver deactivated.');
      reload();
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to deactivate driver'));
    }
  }

  const columns: Column<DriverSummary>[] = [
    {
      key: 'driver',
      header: 'Driver',
      render: (d) => (
        <Group gap="sm" wrap="nowrap">
          <Avatar name={d.fullName ?? ''} color="initials" size={36} radius="xl" />
          <div style={{ minWidth: 0 }}>
            <Text fw={600} size="sm" truncate="end">{displayName(d)}</Text>
            <Text size="xs" c="dimmed">Added {formatDate(d.createdAt)}</Text>
          </div>
        </Group>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      width: 170,
      render: (d) => <Text size="sm" ff="monospace">{d.phone ?? '—'}</Text>,
    },
    {
      key: 'bus',
      header: 'Assigned bus',
      width: 220,
      render: (d) => d.bus ? (
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" fw={500} truncate="end">{d.bus.name}</Text>
          <PlateChip plate={d.bus.plateNumber} />
        </Group>
      ) : <Text size="sm" c="dimmed">Unassigned</Text>,
    },
    {
      key: 'status',
      header: 'Status',
      width: 130,
      render: (d) => <StatusPill tone={d.isActive ? 'green' : 'gray'}>{d.isActive ? 'Active' : 'Inactive'}</StatusPill>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Drivers"
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Drivers' }]}
        description="Driver accounts for the mobile app. Each driver signs in with their phone number."
        actions={
          <>
            <Tooltip label="Refresh">
              <ActionIcon variant="default" size="lg" onClick={reload} loading={loading} aria-label="Refresh">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
            <Button leftSection={<IconPlus size={16} />} onClick={startCreate}>Add driver</Button>
          </>
        }
      />

      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="md" mb="lg">
        <StatCard label="Total drivers" value={total} icon={<IconUsers size={20} />} loading={loading} hint="All accounts" />
        <StatCard
          label="Active"
          value={active}
          icon={<IconUserCheck size={20} />}
          color="teal"
          loading={loading}
          progress={total ? (active / total) * 100 : 0}
          hint={total ? `${total - active} inactive` : 'No drivers yet'}
        />
        <StatCard
          label="On a bus"
          value={onBus}
          icon={<IconBus size={20} />}
          color="blue"
          loading={loading}
          progress={active ? (onBus / active) * 100 : 0}
          hint={active ? `${Math.round((onBus / active) * 100)}% of active drivers` : '—'}
        />
        <StatCard label="Unassigned" value={unassigned} icon={<IconUserOff size={20} />} color="orange" loading={loading} hint={unassigned ? 'Active, without a bus' : 'Everyone has a bus'} />
      </SimpleGrid>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(d) => d.id}
        loading={loading}
        totalCount={total}
        noun={['driver', 'drivers']}
        minWidth={820}
        onRowClick={(d) => setSelectedId(d.id)}
        search={{ value: search, onChange: setSearch, placeholder: 'Search name, phone or bus' }}
        filters={
          <SegmentedControl
            value={filter}
            onChange={(v) => setFilter(v as StatusFilter)}
            data={[
              { value: 'all', label: `All ${total}` },
              { value: 'active', label: `Active ${active}` },
              { value: 'inactive', label: `Inactive ${total - active}` },
            ]}
          />
        }
        onClearFilters={() => { setSearch(''); setFilter('all'); }}
        rowActions={(d) => (
          <Menu position="bottom-end" width={190}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" aria-label={`Actions for ${displayName(d)}`}>
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => startEdit(d)}>Edit</Menu.Item>
              <Menu.Item leftSection={<IconKey size={16} />} onClick={() => handleResetPassword(d)}>Reset password</Menu.Item>
              <Menu.Divider />
              {d.isActive ? (
                <Menu.Item color="red" leftSection={<IconUserOff size={16} />} onClick={() => handleToggleActive(d)}>Deactivate</Menu.Item>
              ) : (
                <Menu.Item color="teal" leftSection={<IconPlayerPlay size={16} />} onClick={() => handleToggleActive(d)}>Reactivate</Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        )}
        renderMobileRow={(d) => (
          <Group gap="sm" wrap="nowrap">
            <Avatar name={d.fullName ?? ''} color="initials" size={36} radius="xl" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <Group gap="xs" justify="space-between" wrap="nowrap">
                <Text fw={600} size="sm" truncate="end">{displayName(d)}</Text>
                <StatusPill tone={d.isActive ? 'green' : 'gray'}>{d.isActive ? 'Active' : 'Inactive'}</StatusPill>
              </Group>
              <Text size="xs" c="dimmed" truncate="end" mt={2}>
                {d.phone ?? '—'} · {d.bus?.name ?? 'Unassigned'}
              </Text>
            </div>
          </Group>
        )}
        emptyState={
          <EmptyState
            py={64}
            icon={<IconUsers size={28} stroke={1.5} />}
            title="No drivers yet"
            description="Add a driver with their name and phone number. They'll get a temporary password for the mobile app."
          >
            <Button mt="md" leftSection={<IconPlus size={16} />} onClick={startCreate}>Add driver</Button>
          </EmptyState>
        }
      />

      <DriverDrawer
        driver={selected}
        onClose={() => setSelectedId(null)}
        onEdit={() => selected && startEdit(selected)}
        onResetPassword={() => selected && handleResetPassword(selected)}
        onToggleActive={() => selected && handleToggleActive(selected)}
      />

      <DriverModal
        opened={formOpen}
        onClose={closeForm}
        editing={editing}
        onSaved={reload}
        onCreated={(name, password) => { setCredentials({ name, password, isNew: true }); reload(); }}
      />
      <PasswordModal credentials={credentials} onClose={() => setCredentials(null)} />
      <ConfirmDialog
        opened={confirmOpen}
        onClose={closeConfirm}
        onConfirm={handleDeactivate}
        title="Deactivate driver?"
        message={<>{target ? displayName(target) : 'This driver'} won’t be able to sign in and will be unassigned from their bus. You can reactivate them later.</>}
        confirmLabel="Deactivate"
        danger
      />
    </>
  );
}
