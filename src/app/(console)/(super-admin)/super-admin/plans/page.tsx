'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ActionIcon, Button, EmptyState, Group, Menu, Modal, SegmentedControl, SimpleGrid,
  Stack, Text, TextInput, ThemeIcon, Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCircleCheck, IconCircleOff, IconDots, IconEdit, IconPackage, IconPlayerPause,
  IconPlayerPlay, IconPlus, IconRefresh, IconTrash,
} from '@tabler/icons-react';
import { api, type PlanSummary } from '@/lib/api';
import { notify, errorMessage } from '@/lib/notify';
import { PageHeader } from '@/components/console/PageHeader';
import { DataTable, type Column } from '@/components/console/DataTable';
import { StatusPill } from '@/components/console/StatusPill';
import { StatCard } from '@/components/console/StatCard';
import { ConfirmDialog } from '@/components/console/ConfirmDialog';
import { formatDate } from '@/components/console/DetailSection';

type StatusFilter = 'all' | 'active' | 'inactive';

// ─── Create / Edit modal ─────────────────────────────────────────────────────

const planSchema = z.object({
  name: z.string().trim().min(2, 'Plan name is required'),
  description: z.string().trim().optional(),
});
type PlanForm = z.infer<typeof planSchema>;

function PlanModal({
  opened, onClose, onSaved, editing,
}: {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: PlanSummary | null;
}) {
  const isEdit = !!editing;
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<PlanForm>({ resolver: zodResolver(planSchema) });

  useEffect(() => {
    if (opened) reset({ name: editing?.name ?? '', description: editing?.description ?? '' });
  }, [opened, editing, reset]);

  async function onSubmit(values: PlanForm) {
    const body = { name: values.name, description: values.description || undefined };
    try {
      if (editing) {
        await api.plans.update(editing.id, body);
        notify.success('Plan updated.');
      } else {
        await api.plans.create(body);
        notify.success('Plan created.');
      }
      onSaved();
      onClose();
    } catch (err) {
      notify.error(errorMessage(err, `Failed to ${isEdit ? 'update' : 'create'} plan`));
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600} size="lg">{isEdit ? 'Edit plan' : 'New plan'}</Text>}
      size="sm"
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          <TextInput
            label="Plan name"
            placeholder="Pro"
            withAsterisk
            data-autofocus
            disabled={isSubmitting}
            error={errors.name?.message}
            {...register('name')}
          />
          <TextInput
            label="Description"
            description="Optional — shown to super admins."
            placeholder="Full platform access."
            disabled={isSubmitting}
            error={errors.description?.message}
            {...register('description')}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save changes' : 'Create plan'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [editing, setEditing] = useState<PlanSummary | null>(null);
  const [target, setTarget] = useState<PlanSummary | null>(null);
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [confirmOpen, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  const fetchPlans = useCallback((isCurrent: () => boolean = () => true) =>
    api.plans.list()
      .then((res) => { if (isCurrent()) setPlans(res.data); })
      .catch((err) => { if (isCurrent()) notify.error(errorMessage(err, 'Failed to load plans')); })
      .finally(() => { if (isCurrent()) setLoading(false); }),
  []);

  const reload = useCallback(() => { setLoading(true); return fetchPlans(); }, [fetchPlans]);

  useEffect(() => {
    let current = true;
    fetchPlans(() => current);
    return () => { current = false; };
  }, [fetchPlans]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plans.filter((p) => {
      if (filter === 'active' && !p.isActive) return false;
      if (filter === 'inactive' && p.isActive) return false;
      return !q || p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    });
  }, [plans, search, filter]);

  const total = plans.length;
  const active = plans.filter((p) => p.isActive).length;

  function openCreate() { setEditing(null); openModal(); }
  function openEdit(plan: PlanSummary) { setEditing(plan); openModal(); }
  function startDelete(plan: PlanSummary) { setTarget(plan); openConfirm(); }

  async function handleToggle(plan: PlanSummary) {
    try {
      await api.plans.update(plan.id, { isActive: !plan.isActive });
      notify.success(`Plan ${plan.isActive ? 'deactivated' : 'activated'}.`);
      reload();
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to update plan'));
    }
  }

  async function handleDelete() {
    if (!target) return;
    try {
      await api.plans.remove(target.id);
      notify.success('Plan deleted.');
      reload();
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to delete plan'));
    }
  }

  const columns: Column<PlanSummary>[] = [
    {
      key: 'plan',
      header: 'Plan',
      render: (p) => (
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon variant="light" color="violet" size={36} radius="md" style={{ flexShrink: 0 }}>
            <IconPackage size={18} stroke={1.75} />
          </ThemeIcon>
          <div style={{ minWidth: 0 }}>
            <Text fw={600} size="sm" truncate="end">{p.name}</Text>
            <Text size="xs" c="dimmed" truncate="end">{p.description || 'No description'}</Text>
          </div>
        </Group>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 140,
      render: (p) => <StatusPill tone={p.isActive ? 'green' : 'gray'}>{p.isActive ? 'Active' : 'Inactive'}</StatusPill>,
    },
    {
      key: 'created',
      header: 'Created',
      width: 160,
      render: (p) => <Text size="sm" c="dimmed">{formatDate(p.createdAt)}</Text>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Plans"
        breadcrumbs={[{ label: 'Platform' }, { label: 'Plans' }]}
        description="Subscription plans. Assign a school to a plan to track its billing tier."
        actions={
          <>
            <Tooltip label="Refresh">
              <ActionIcon variant="default" size="lg" onClick={reload} loading={loading} aria-label="Refresh">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
            <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>New plan</Button>
          </>
        }
      />

      <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md" mb="lg">
        <StatCard label="Total plans" value={total} icon={<IconPackage size={20} />} color="violet" loading={loading} hint="Defined on the platform" />
        <StatCard
          label="Active"
          value={active}
          icon={<IconCircleCheck size={20} />}
          color="teal"
          loading={loading}
          progress={total ? (active / total) * 100 : 0}
          hint="Available for assignment"
        />
        <StatCard label="Inactive" value={total - active} icon={<IconCircleOff size={20} />} color="gray" loading={loading} hint="Hidden from new schools" />
      </SimpleGrid>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(p) => p.id}
        loading={loading}
        totalCount={total}
        noun={['plan', 'plans']}
        minWidth={600}
        onRowClick={openEdit}
        search={{ value: search, onChange: setSearch, placeholder: 'Search plans' }}
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
        rowActions={(p) => (
          <Menu position="bottom-end" width={180}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" aria-label={`Actions for ${p.name}`}>
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => openEdit(p)}>Edit</Menu.Item>
              <Menu.Item
                leftSection={p.isActive ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                onClick={() => handleToggle(p)}
              >
                {p.isActive ? 'Deactivate' : 'Activate'}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={() => startDelete(p)}>Delete</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
        renderMobileRow={(p) => (
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon variant="light" color="violet" size={36} radius="md"><IconPackage size={18} /></ThemeIcon>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Group gap="xs" justify="space-between" wrap="nowrap">
                <Text fw={600} size="sm" truncate="end">{p.name}</Text>
                <StatusPill tone={p.isActive ? 'green' : 'gray'}>{p.isActive ? 'Active' : 'Inactive'}</StatusPill>
              </Group>
              <Text size="xs" c="dimmed" truncate="end" mt={2}>{p.description || 'No description'}</Text>
            </div>
          </Group>
        )}
        emptyState={
          <EmptyState
            py={64}
            icon={<IconPackage size={28} stroke={1.5} />}
            title="No plans yet"
            description="Create your first plan. Schools can be assigned to it during onboarding or later via settings."
          >
            <Button mt="md" leftSection={<IconPlus size={16} />} onClick={openCreate}>New plan</Button>
          </EmptyState>
        }
      />

      <PlanModal opened={modalOpen} onClose={closeModal} onSaved={reload} editing={editing} />
      <ConfirmDialog
        opened={confirmOpen}
        onClose={closeConfirm}
        onConfirm={handleDelete}
        title="Delete plan?"
        message={<>“{target?.name}” will be permanently deleted. Schools on this plan will become unassigned.</>}
        confirmLabel="Delete plan"
        danger
      />
    </>
  );
}
