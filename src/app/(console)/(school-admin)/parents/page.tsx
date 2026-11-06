'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ActionIcon, Alert, Anchor, Avatar, Button, Code, em, CopyButton, Drawer, EmptyState, Group, Menu,
  Modal, SegmentedControl, Select, SimpleGrid, Stack, Text, TextInput, Tooltip,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconCalendarDue, IconCheck, IconCopy, IconDots, IconEdit, IconInfoCircle, IconKey, IconPlayerPlay,
  IconPlus, IconRefresh, IconUserCheck, IconUserOff, IconUsersGroup,
} from '@tabler/icons-react';
import { api, ApiError, type ParentSummary, type RouteSummary, type RouteStop, type SchoolClass } from '@/lib/api';
import { notify, errorMessage } from '@/lib/notify';
import { PageHeader } from '@/components/console/PageHeader';
import { DataTable, type Column } from '@/components/console/DataTable';
import { StatusPill } from '@/components/console/StatusPill';
import { StatCard } from '@/components/console/StatCard';
import { ConfirmDialog } from '@/components/console/ConfirmDialog';
import { DetailRows, DetailSection, formatDate } from '@/components/console/DetailSection';
import { PickupPointSelect } from '@/components/console/PickupPointSelect';

type StatusFilter = 'all' | 'active' | 'inactive' | 'expiring';

const displayName = (p: ParentSummary) => p.fullName ?? p.phone ?? 'Parent';

/** "Class 5 · A", "Class 5" or null. */
function classLabel(p: Pick<ParentSummary, 'childClass' | 'childSection'>): string | null {
  if (!p.childClass) return null;
  return p.childSection ? `Class ${p.childClass.name} · ${p.childSection.name}` : `Class ${p.childClass.name}`;
}

/** Convert ISO timestamp to YYYY-MM-DD for <input type="date"> */
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

/** Tomorrow's date as YYYY-MM-DD — the default suggested when a subscription date is needed but unset. */
function tomorrowDateInput(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** True if the given ISO timestamp is in the past. */
function isExpired(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

/** True if the given ISO timestamp falls in the current calendar month (expired-this-month counts too). */
function isExpiringThisMonth(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// ─── Add / Edit parent modal ──────────────────────────────────────────────────

/** Small titled group inside the parent form. */
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6} style={{ letterSpacing: '0.05em' }}>{title}</Text>
      {children}
    </div>
  );
}

const parentSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  childName: z.string().trim().min(1, "Enter the child's name").max(100, 'Too long'),
  // Select values are strings; '' = none picked
  childClassId: z.string().min(1, 'Select a class'),
  childSectionId: z.string().min(1, 'Select a section'),
  routeStopId: z.string().min(1, 'Select a pickup point for this parent'),
  subscriptionExpiresAt: z.string(),
});
type ParentForm = z.infer<typeof parentSchema>;

function ParentModal({
  opened, onClose, editing, routes, classes, getStops, routeId, onRouteChange, requireSubscriptionDate, onCreated, onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  editing: ParentSummary | null;
  routes: RouteSummary[];
  classes: SchoolClass[];
  getStops: (routeId: string) => Promise<RouteStop[]>;
  routeId: string | null;
  onRouteChange: (routeId: string | null) => void;
  requireSubscriptionDate: boolean;
  onCreated: (name: string, password: string) => void;
  onSaved: () => void;
}) {
  const isEdit = !!editing;
  const {
    register, handleSubmit, reset, control, setError, setValue,
    formState: { errors, isSubmitting },
  } = useForm<ParentForm>({ resolver: zodResolver(parentSchema) });
  const watchedClassId = useWatch({ control, name: 'childClassId' });
  // Full-screen on phones (below Mantine's `sm` breakpoint, 48em)
  const isPhone = useMediaQuery(`(max-width: ${em(767)})`);

  useEffect(() => {
    if (opened) {
      const currentExpiry = toDateInput(editing?.subscriptionExpiresAt);
      reset({
        fullName: editing?.fullName ?? '',
        phone: editing?.phone ?? '',
        childName: editing?.childName ?? '',
        childClassId: editing?.childClass ? String(editing.childClass.id) : '',
        childSectionId: editing?.childSection ? String(editing.childSection.id) : '',
        routeStopId: editing?.stop?.id ?? '',
        subscriptionExpiresAt: currentExpiry || (requireSubscriptionDate ? tomorrowDateInput() : ''),
      });
    }
  }, [opened, editing, requireSubscriptionDate, reset]);

  async function onSubmit(values: ParentForm) {
    if (requireSubscriptionDate && !values.subscriptionExpiresAt) {
      setError('subscriptionExpiresAt', { message: 'Set a subscription expiry date for this parent' });
      return;
    }
    try {
      const body = {
        ...values,
        childClassId: Number(values.childClassId),
        childSectionId: Number(values.childSectionId),
        subscriptionExpiresAt: values.subscriptionExpiresAt || null,
      };
      if (editing) {
        await api.parents.update(editing.id, body);
        notify.success('Parent updated.');
        onSaved();
      } else {
        const res = await api.parents.create({
          ...body,
          subscriptionExpiresAt: body.subscriptionExpiresAt ?? undefined,
        });
        onCreated(res.data.fullName ?? values.fullName, res.data.tempPassword);
      }
      onClose();
    } catch (err) {
      // Phone taken (409) and an invalid/removed pickup point (404) belong under their own field,
      // not just a toast — otherwise it looks like the form has no validation for them.
      if (err instanceof ApiError && err.status === 409) {
        setError('phone', { message: err.message });
      } else if (err instanceof ApiError && err.status === 404) {
        setError('routeStopId', { message: err.message });
      } else {
        notify.error(errorMessage(err, `Failed to ${isEdit ? 'update' : 'add'} parent`));
      }
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600} size="lg">{isEdit ? 'Edit parent' : 'Add parent'}</Text>}
      size="xl"
      fullScreen={isPhone}
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="lg">
          <FormSection title="Parent">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" verticalSpacing="sm">
              <TextInput
                label="Full name"
                placeholder="Anjali Sharma"
                withAsterisk
                data-autofocus
                disabled={isSubmitting}
                error={errors.fullName?.message}
                {...register('fullName')}
              />
              <TextInput
                label="Phone number"
                placeholder="9876543210"
                withAsterisk
                inputMode="numeric"
                disabled={isSubmitting}
                error={errors.phone?.message}
                {...register('phone')}
              />
            </SimpleGrid>
          </FormSection>

          <FormSection title="Child">
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" verticalSpacing="sm">
              <TextInput
                label="Child's name"
                placeholder="Aarav Sharma"
                withAsterisk
                disabled={isSubmitting}
                error={errors.childName?.message}
                {...register('childName')}
              />
              <Controller
                name="childClassId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Class"
                    placeholder={classes.length ? 'Select class' : 'No classes yet'}
                    data={classes.map((c) => ({ value: String(c.id), label: c.name }))}
                    withAsterisk
                    searchable
                    disabled={isSubmitting || classes.length === 0}
                    value={field.value || null}
                    onChange={(v) => {
                      field.onChange(v ?? '');
                      // Sections belong to a class — a new class means picking its section again
                      setValue('childSectionId', '');
                    }}
                    error={errors.childClassId?.message}
                  />
                )}
              />
              <Controller
                name="childSectionId"
                control={control}
                render={({ field }) => {
                  const sections = classes.find((c) => String(c.id) === watchedClassId)?.sections ?? [];
                  return (
                    <Select
                      label="Section"
                      placeholder={watchedClassId ? 'Select section' : 'Pick class first'}
                      data={sections.map((s) => ({ value: String(s.id), label: s.name }))}
                      withAsterisk
                      disabled={isSubmitting || sections.length === 0}
                      value={field.value || null}
                      onChange={(v) => field.onChange(v ?? '')}
                      error={errors.childSectionId?.message}
                    />
                  );
                }}
              />
            </SimpleGrid>
            {classes.length === 0 && (
              <Alert variant="light" color="orange" icon={<IconInfoCircle size={16} />} p="sm" mt="sm">
                <Text size="xs">
                  No classes set up yet. A child’s class and section are required —{' '}
                  <Anchor component={Link} href="/classes" size="xs">add classes &amp; sections</Anchor> first.
                </Text>
              </Alert>
            )}
          </FormSection>

          <FormSection title="Pickup">
            {routes.length === 0 ? (
              <Alert variant="light" color="orange" icon={<IconInfoCircle size={16} />} p="sm">
                <Text size="xs">No routes with pickup points yet. Add a route and its stops first — a parent needs a pickup point to be able to sign in.</Text>
              </Alert>
            ) : (
              <Controller
                name="routeStopId"
                control={control}
                render={({ field }) => (
                  <PickupPointSelect
                    routes={routes}
                    getStops={getStops}
                    routeId={routeId}
                    onRouteChange={onRouteChange}
                    stopId={field.value || null}
                    onStopChange={(v) => field.onChange(v ?? '')}
                    disabled={isSubmitting}
                    error={errors.routeStopId?.message}
                  />
                )}
              />
            )}
          </FormSection>

          {requireSubscriptionDate && (
            <FormSection title="Subscription">
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <TextInput
                  type="date"
                  label="Expires on"
                  description="After this date the parent can't sign in."
                  withAsterisk
                  disabled={isSubmitting}
                  error={errors.subscriptionExpiresAt?.message}
                  {...register('subscriptionExpiresAt')}
                />
              </SimpleGrid>
            </FormSection>
          )}

          {!isEdit && (
            <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />} p="sm">
              <Text size="xs">
                The parent signs in to the mobile app with their phone number. A temporary password is
                generated and shown once after you save.
              </Text>
            </Alert>
          )}
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" loading={isSubmitting} disabled={!isEdit && (routes.length === 0 || classes.length === 0)}>
              {isEdit ? 'Save changes' : 'Add parent'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// ─── Change subscription date modal ──────────────────────────────────────────

function SubscriptionDateModal({
  parent, onClose, onSaved,
}: {
  parent: ParentSummary | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  // Lazy-initialized from `parent` — the caller remounts this (via `key`) whenever the target changes.
  const [value, setValue] = useState(() => toDateInput(parent?.subscriptionExpiresAt) || tomorrowDateInput());
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!parent || !value) return;
    setSaving(true);
    try {
      await api.parents.update(parent.id, { subscriptionExpiresAt: value });
      notify.success('Subscription date updated.');
      onSaved();
      onClose();
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to update subscription date'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal opened={!!parent} onClose={onClose} title={<Text fw={600} size="lg">Change subscription date</Text>} size="sm">
      {parent && (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Set a new subscription expiry for <Text span fw={600} c="bright">{displayName(parent)}</Text>.
          </Text>
          <TextInput
            type="date"
            label="Subscription expires on"
            withAsterisk
            disabled={saving}
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!value}>Save</Button>
          </Group>
        </Stack>
      )}
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
      title={<Text fw={600} size="lg">{credentials?.isNew ? 'Parent added' : 'Password reset'}</Text>}
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

function ParentDrawer({
  parent, requireSubscriptionDate, onClose, onEdit, onResetPassword, onToggleActive, onChangeSubscriptionDate,
}: {
  parent: ParentSummary | null;
  requireSubscriptionDate: boolean;
  onClose: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onToggleActive: () => void;
  onChangeSubscriptionDate: () => void;
}) {
  return (
    <Drawer opened={!!parent} onClose={onClose} position="right" size="md" title={<Text fw={600}>Parent details</Text>}>
      {parent && (
        <Stack gap="lg">
          <Group gap="md" wrap="nowrap">
            <Avatar name={parent.fullName ?? ''} color="initials" size={52} radius="xl" />
            <div style={{ minWidth: 0 }}>
              <Text fw={600} size="lg" truncate="end">{displayName(parent)}</Text>
              <Group gap="xs" mt={4}>
                <StatusPill tone={parent.isActive ? 'green' : 'gray'}>{parent.isActive ? 'Active' : 'Inactive'}</StatusPill>
              </Group>
            </div>
          </Group>

          <DetailSection title="Account">
            <DetailRows rows={[
              { label: 'Phone (login)', value: <Text span ff="monospace" size="sm">{parent.phone ?? '—'}</Text> },
              { label: 'Sign-in', value: 'Mobile app' },
              { label: 'Added', value: formatDate(parent.createdAt) },
            ]} />
          </DetailSection>

          <DetailSection title="Child">
            <DetailRows rows={[
              { label: 'Name', value: parent.childName ?? '—' },
              { label: 'Class', value: parent.childClass?.name ?? '—' },
              { label: 'Section', value: parent.childSection?.name ?? '—' },
            ]} />
          </DetailSection>

          <DetailSection title="Pickup point">
            {parent.stop ? (
              <DetailRows rows={[
                { label: 'Stop', value: parent.stop.name },
                { label: 'Route', value: parent.stop.routeName },
              ]} />
            ) : (
              <Text size="sm" c="red">
                No pickup point assigned — this parent can’t sign in. Edit to assign one.
              </Text>
            )}
          </DetailSection>

          {requireSubscriptionDate && (
            <DetailSection title="Subscription">
              <DetailRows rows={[
                {
                  label: 'Expires on',
                  value: parent.subscriptionExpiresAt ? (
                    <Text span c={isExpired(parent.subscriptionExpiresAt) ? 'red' : undefined}>
                      {formatDate(parent.subscriptionExpiresAt)}{isExpired(parent.subscriptionExpiresAt) ? ' (expired)' : ''}
                    </Text>
                  ) : <Text span c="red">Not set</Text>,
                },
              ]} />
              <Button mt="sm" variant="default" size="xs" leftSection={<IconCalendarDue size={14} />} onClick={onChangeSubscriptionDate}>
                Change subscription date
              </Button>
            </DetailSection>
          )}

          <Group justify="space-between" mt="sm">
            <Button
              variant="subtle"
              color={parent.isActive ? 'red' : 'teal'}
              leftSection={parent.isActive ? <IconUserOff size={16} /> : <IconPlayerPlay size={16} />}
              onClick={onToggleActive}
            >
              {parent.isActive ? 'Deactivate' : 'Reactivate'}
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

export default function ParentsPage() {
  const [parents, setParents] = useState<ParentSummary[]>([]);
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [requireSubscriptionDate, setRequireSubscriptionDate] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ParentSummary | null>(null);
  const [formRouteId, setFormRouteId] = useState<string | null>(null);
  const [target, setTarget] = useState<ParentSummary | null>(null);
  const [subscriptionTarget, setSubscriptionTarget] = useState<ParentSummary | null>(null);
  const [credentials, setCredentials] = useState<{ name: string; password: string; isNew: boolean } | null>(null);

  const [formOpen, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [confirmOpen, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  const fetchParents = useCallback((isCurrent: () => boolean = () => true) =>
    Promise.all([api.parents.list(), api.routes.list(), api.mySchool.get(), api.classes.list()])
      .then(([parentsRes, routesRes, schoolRes, classesRes]) => {
        if (!isCurrent()) return;
        setParents(parentsRes.data);
        setRoutes(routesRes.data);
        setClasses(classesRes.data);
        setRequireSubscriptionDate(schoolRes.data.subscriptionManagedBy !== 'platform');
      })
      .catch((err) => { if (isCurrent()) notify.error(errorMessage(err, 'Failed to load parents')); })
      .finally(() => { if (isCurrent()) setLoading(false); }),
  []);

  const getStops = useCallback((routeId: string) => api.routes.get(routeId).then((res) => res.data.stops), []);

  const reload = useCallback(() => { setLoading(true); fetchParents(); }, [fetchParents]);

  useEffect(() => {
    let current = true;
    fetchParents(() => current);
    return () => { current = false; };
  }, [fetchParents]);

  const selected = parents.find((p) => p.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parents.filter((p) => {
      if (filter === 'active' && !p.isActive) return false;
      if (filter === 'inactive' && p.isActive) return false;
      if (filter === 'expiring' && !isExpiringThisMonth(p.subscriptionExpiresAt)) return false;
      if (!q) return true;
      return [p.fullName, p.phone, p.childName, p.stop?.name, p.stop?.routeName].some((v) => v?.toLowerCase().includes(q));
    });
  }, [parents, search, filter]);

  const total = parents.length;
  const active = parents.filter((p) => p.isActive).length;
  const expiringThisMonth = parents.filter((p) => isExpiringThisMonth(p.subscriptionExpiresAt)).length;

  function startCreate() { setEditing(null); setFormRouteId(null); openForm(); }
  function startEdit(p: ParentSummary) { setEditing(p); setFormRouteId(p.stop?.routeId ?? null); openForm(); }

  async function handleResetPassword(p: ParentSummary) {
    try {
      const res = await api.parents.resetPassword(p.id);
      setCredentials({ name: displayName(p), password: res.data.tempPassword, isNew: false });
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to reset password'));
    }
  }

  function handleToggleActive(p: ParentSummary) {
    if (p.isActive) {
      setTarget(p);
      openConfirm();
      return;
    }
    api.parents.update(p.id, { isActive: true })
      .then(() => { notify.success('Parent reactivated.'); reload(); })
      .catch((err) => notify.error(errorMessage(err, 'Failed to reactivate parent')));
  }

  async function handleDeactivate() {
    if (!target) return;
    try {
      await api.parents.remove(target.id);
      notify.success('Parent deactivated.');
      reload();
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to deactivate parent'));
    }
  }

  const columns: Column<ParentSummary>[] = [
    {
      key: 'parent',
      header: 'Parent',
      render: (p) => (
        <Group gap="sm" wrap="nowrap">
          <Avatar name={p.fullName ?? ''} color="initials" size={36} radius="xl" />
          <div style={{ minWidth: 0 }}>
            <Text fw={600} size="sm" truncate="end">{displayName(p)}</Text>
            <Text size="xs" c="dimmed">Added {formatDate(p.createdAt)}</Text>
          </div>
        </Group>
      ),
    },
    {
      key: 'child',
      header: 'Child',
      width: 200,
      render: (p) => p.childName ? (
        <div style={{ minWidth: 0 }}>
          <Text size="sm" fw={500} truncate="end">{p.childName}</Text>
          {classLabel(p) && <Text size="xs" c="dimmed" truncate="end">{classLabel(p)}</Text>}
        </div>
      ) : <Text size="sm" c="dimmed">—</Text>,
    },
    {
      key: 'phone',
      header: 'Phone',
      width: 170,
      render: (p) => <Text size="sm" ff="monospace">{p.phone ?? '—'}</Text>,
    },
    {
      key: 'stop',
      header: 'Pickup point',
      width: 220,
      render: (p) => p.stop ? (
        <div style={{ minWidth: 0 }}>
          <Text size="sm" fw={500} truncate="end">{p.stop.name}</Text>
          <Text size="xs" c="dimmed" truncate="end">{p.stop.routeName}</Text>
        </div>
      ) : <Text size="sm" c="red">Unassigned</Text>,
    },
    ...(requireSubscriptionDate ? [{
      key: 'subscription',
      header: 'Subscription',
      width: 160,
      render: (p: ParentSummary) => p.subscriptionExpiresAt ? (
        <Text size="sm" c={isExpired(p.subscriptionExpiresAt) ? 'red' : undefined}>
          {formatDate(p.subscriptionExpiresAt)}
        </Text>
      ) : <Text size="sm" c="red">Not set</Text>,
    } as Column<ParentSummary>] : []),
    {
      key: 'status',
      header: 'Status',
      width: 130,
      render: (p) => <StatusPill tone={p.isActive ? 'green' : 'gray'}>{p.isActive ? 'Active' : 'Inactive'}</StatusPill>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Parents"
        breadcrumbs={[{ label: 'Fleet' }, { label: 'Parents' }]}
        description="Parent accounts for the mobile app. Each parent signs in with their phone number."
        actions={
          <>
            <Tooltip label="Refresh">
              <ActionIcon variant="default" size="lg" onClick={reload} loading={loading} aria-label="Refresh">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
            <Button leftSection={<IconPlus size={16} />} onClick={startCreate}>Add parent</Button>
          </>
        }
      />

      <SimpleGrid cols={{ base: 1, xs: 2, lg: requireSubscriptionDate ? 3 : 2 }} spacing="md" mb="lg">
        <StatCard label="Total parents" value={total} icon={<IconUsersGroup size={20} />} loading={loading} hint="All accounts" />
        <StatCard
          label="Active"
          value={active}
          icon={<IconUserCheck size={20} />}
          color="teal"
          loading={loading}
          progress={total ? (active / total) * 100 : 0}
          hint={total ? `${total - active} inactive` : 'No parents yet'}
        />
        {requireSubscriptionDate && (
          <StatCard
            label="Expiring this month"
            value={expiringThisMonth}
            icon={<IconCalendarDue size={20} />}
            color="orange"
            loading={loading}
            hint={expiringThisMonth ? 'Renew before they lose access' : 'Nothing expiring this month'}
          />
        )}
      </SimpleGrid>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(p) => p.id}
        loading={loading}
        totalCount={total}
        noun={['parent', 'parents']}
        minWidth={1020}
        onRowClick={(p) => setSelectedId(p.id)}
        search={{ value: search, onChange: setSearch, placeholder: 'Search parent, child or phone' }}
        filters={
          <SegmentedControl
            value={filter}
            onChange={(v) => setFilter(v as StatusFilter)}
            data={[
              { value: 'all', label: `All ${total}` },
              { value: 'active', label: `Active ${active}` },
              { value: 'inactive', label: `Inactive ${total - active}` },
              ...(requireSubscriptionDate ? [{ value: 'expiring', label: `Expiring this month ${expiringThisMonth}` }] : []),
            ]}
          />
        }
        onClearFilters={() => { setSearch(''); setFilter('all'); }}
        rowActions={(p) => (
          <Menu position="bottom-end" width={210}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" aria-label={`Actions for ${displayName(p)}`}>
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => startEdit(p)}>Edit</Menu.Item>
              <Menu.Item leftSection={<IconKey size={16} />} onClick={() => handleResetPassword(p)}>Reset password</Menu.Item>
              {requireSubscriptionDate && (
                <Menu.Item leftSection={<IconCalendarDue size={16} />} onClick={() => setSubscriptionTarget(p)}>
                  Change subscription date
                </Menu.Item>
              )}
              <Menu.Divider />
              {p.isActive ? (
                <Menu.Item color="red" leftSection={<IconUserOff size={16} />} onClick={() => handleToggleActive(p)}>Deactivate</Menu.Item>
              ) : (
                <Menu.Item color="teal" leftSection={<IconPlayerPlay size={16} />} onClick={() => handleToggleActive(p)}>Reactivate</Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        )}
        renderMobileRow={(p) => (
          <Group gap="sm" wrap="nowrap">
            <Avatar name={p.fullName ?? ''} color="initials" size={36} radius="xl" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <Group gap="xs" justify="space-between" wrap="nowrap">
                <Text fw={600} size="sm" truncate="end">{displayName(p)}</Text>
                <StatusPill tone={p.isActive ? 'green' : 'gray'}>{p.isActive ? 'Active' : 'Inactive'}</StatusPill>
              </Group>
              <Text size="xs" c="dimmed" truncate="end" mt={2}>{p.phone ?? '—'} · {p.stop?.name ?? 'Unassigned'}</Text>
              {p.childName && (
                <Text size="xs" c="dimmed" truncate="end">
                  Child: {p.childName}{classLabel(p) ? ` (${classLabel(p)})` : ''}
                </Text>
              )}
            </div>
          </Group>
        )}
        emptyState={
          <EmptyState
            py={64}
            icon={<IconUsersGroup size={28} stroke={1.5} />}
            title="No parents yet"
            description="Add a parent with their name, phone number, child's details and pickup point. They'll get a temporary password for the mobile app."
          >
            <Button mt="md" leftSection={<IconPlus size={16} />} onClick={startCreate}>Add parent</Button>
          </EmptyState>
        }
      />

      <ParentDrawer
        parent={selected}
        requireSubscriptionDate={requireSubscriptionDate}
        onClose={() => setSelectedId(null)}
        onEdit={() => selected && startEdit(selected)}
        onResetPassword={() => selected && handleResetPassword(selected)}
        onToggleActive={() => selected && handleToggleActive(selected)}
        onChangeSubscriptionDate={() => selected && setSubscriptionTarget(selected)}
      />

      <ParentModal
        opened={formOpen}
        onClose={closeForm}
        editing={editing}
        routes={routes}
        classes={classes}
        getStops={getStops}
        routeId={formRouteId}
        onRouteChange={setFormRouteId}
        requireSubscriptionDate={requireSubscriptionDate}
        onSaved={reload}
        onCreated={(name, password) => { setCredentials({ name, password, isNew: true }); reload(); }}
      />
      <SubscriptionDateModal key={subscriptionTarget?.id ?? 'closed'} parent={subscriptionTarget} onClose={() => setSubscriptionTarget(null)} onSaved={reload} />
      <PasswordModal credentials={credentials} onClose={() => setCredentials(null)} />
      <ConfirmDialog
        opened={confirmOpen}
        onClose={closeConfirm}
        onConfirm={handleDeactivate}
        title="Deactivate parent?"
        message={<>{target ? displayName(target) : 'This parent'} won’t be able to sign in. You can reactivate them later.</>}
        confirmLabel="Deactivate"
        danger
      />
    </>
  );
}
