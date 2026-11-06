'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ActionIcon, Alert, Badge, Button, EmptyState, Group, Menu, Modal, Stack, TagsInput, Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconArrowDown, IconArrowUp, IconDots, IconEdit, IconInfoCircle, IconPlus,
  IconSchool, IconTrash,
} from '@tabler/icons-react';
import { ApiError, type ApiResult, type SchoolClass, type SectionInput } from '@/lib/api';
import { notify, errorMessage } from '@/lib/notify';
import { DataTable, type Column } from '@/components/console/DataTable';
import { ConfirmDialog } from '@/components/console/ConfirmDialog';

/**
 * The class-master endpoints, bound to one school. School admins pass `api.classes`
 * (school from their token); super admins pass `api.superAdminClasses` bound to a school id.
 */
export interface ClassesClient {
  list: () => Promise<ApiResult<SchoolClass[]>>;
  create: (body: { name: string; sections: SectionInput[] }) => Promise<ApiResult<SchoolClass>>;
  update: (id: number, body: { name?: string; sections?: SectionInput[] }) => Promise<ApiResult<SchoolClass>>;
  remove: (id: number) => Promise<ApiResult<null>>;
  reorder: (ids: number[]) => Promise<ApiResult<SchoolClass[]>>;
}

/** What the page's header needs from the manager. */
export interface ClassesHeaderProps {
  reload: () => void;
  loading: boolean;
  startCreate: () => void;
}

/** Same rule as the backend: trimmed, inner spaces collapsed, case-insensitive. */
const nameKey = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();
const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ');

/**
 * Turns the edited section names back into the API shape: a name matching an existing
 * section keeps its id (so parents assigned to it stay assigned), anything else is new.
 */
function toSectionInputs(names: string[], existing: SchoolClass['sections']): SectionInput[] {
  const byKey = new Map(existing.map((s) => [nameKey(s.name), s.id]));
  return names.map((name) => ({ id: byKey.get(nameKey(name)), name: cleanName(name) }));
}

// ─── Add / Edit class modal ───────────────────────────────────────────────────

const classSchema = z.object({
  name: z.string().trim().min(1, 'Class name is required').max(30, 'Keep it under 30 characters'),
  sections: z.array(z.string().trim().min(1).max(10, 'Section names must be 10 characters or fewer'))
    .min(1, 'Add at least one section — parents must pick one')
    .max(26),
});
type ClassForm = z.infer<typeof classSchema>;

function ClassModal({
  client, opened, onClose, editing, classes, onSaved,
}: {
  client: ClassesClient;
  opened: boolean;
  onClose: () => void;
  editing: SchoolClass | null;
  classes: SchoolClass[];
  onSaved: () => void;
}) {
  const isEdit = !!editing;
  const {
    register, handleSubmit, reset, control, setError,
    formState: { errors, isSubmitting },
  } = useForm<ClassForm>({ resolver: zodResolver(classSchema) });

  useEffect(() => {
    if (opened) {
      reset({ name: editing?.name ?? '', sections: editing?.sections.map((s) => s.name) ?? [] });
    }
  }, [opened, editing, reset]);

  async function onSubmit(values: ClassForm) {
    // Same school can't have the same class twice
    const clash = classes.find((c) => c.id !== editing?.id && nameKey(c.name) === nameKey(values.name));
    if (clash) {
      setError('name', { message: `Class “${clash.name}” already exists` });
      return;
    }
    // Same class can't have the same section twice ("A" and "a" count as the same)
    const seen = new Set<string>();
    for (const s of values.sections) {
      if (seen.has(nameKey(s))) {
        setError('sections', { message: `Section “${cleanName(s)}” is added twice` });
        return;
      }
      seen.add(nameKey(s));
    }

    try {
      const body = {
        name: cleanName(values.name),
        sections: toSectionInputs(values.sections, editing?.sections ?? []),
      };
      if (editing) {
        await client.update(editing.id, body);
        notify.success('Class updated.');
      } else {
        await client.create(body);
        notify.success('Class added.');
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Duplicate class name, duplicate section, or a removed section still has parents
        setError(err.message.toLowerCase().includes('section') ? 'sections' : 'name', { message: err.message });
      } else {
        notify.error(errorMessage(err, `Failed to ${isEdit ? 'update' : 'add'} class`));
      }
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600} size="lg">{isEdit ? 'Edit class' : 'Add class'}</Text>}
      size="sm"
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          <TextInput
            label="Class name"
            placeholder="e.g. LKG, 1, 10"
            withAsterisk
            data-autofocus
            disabled={isSubmitting}
            error={errors.name?.message}
            {...register('name')}
          />
          <Controller
            name="sections"
            control={control}
            render={({ field }) => (
              <TagsInput
                label="Sections"
                withAsterisk
                description="Type a section and press Enter (or comma). At least one is required — use “A” if the class isn’t split."
                placeholder={field.value?.length ? '' : 'e.g. A, B, C'}
                splitChars={[',', ' ', '|']}
                clearable
                disabled={isSubmitting}
                value={field.value ?? []}
                onChange={(v) => field.onChange(v.map(cleanName).filter(Boolean))}
                error={errors.sections?.message ?? errors.sections?.[0]?.message}
              />
            )}
          />
          {isEdit && (
            <Alert variant="light" color="blue" icon={<IconInfoCircle size={16} />} p="sm">
              <Text size="xs">
                A section that still has parents assigned can’t be removed — move those parents first.
              </Text>
            </Alert>
          )}
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save changes' : 'Add class'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// ─── Manager ──────────────────────────────────────────────────────────────────

/** Class + section master list with add/edit/reorder/delete — shared by school and super admins. */
export function ClassesManager({
  client, renderHeader,
}: {
  client: ClassesClient;
  renderHeader: (props: ClassesHeaderProps) => ReactNode;
}) {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [target, setTarget] = useState<SchoolClass | null>(null);

  const [formOpen, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [confirmOpen, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  const fetchClasses = useCallback((isCurrent: () => boolean = () => true) =>
    client.list()
      .then((res) => { if (isCurrent()) setClasses(res.data); })
      .catch((err) => { if (isCurrent()) notify.error(errorMessage(err, 'Failed to load classes')); })
      .finally(() => { if (isCurrent()) setLoading(false); }),
  [client]);

  const reload = useCallback(() => { setLoading(true); fetchClasses(); }, [fetchClasses]);

  useEffect(() => {
    let current = true;
    fetchClasses(() => current);
    return () => { current = false; };
  }, [fetchClasses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) =>
      c.name.toLowerCase().includes(q) || c.sections.some((s) => s.name.toLowerCase().includes(q)));
  }, [classes, search]);

  function startCreate() { setEditing(null); openForm(); }
  function startEdit(c: SchoolClass) { setEditing(c); openForm(); }

  async function move(c: SchoolClass, delta: -1 | 1) {
    const ids = classes.map((x) => x.id);
    const from = ids.indexOf(c.id);
    const to = from + delta;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    try {
      const res = await client.reorder(ids);
      setClasses(res.data);
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to reorder classes'));
    }
  }

  async function handleDelete() {
    if (!target) return;
    try {
      await client.remove(target.id);
      notify.success('Class deleted.');
      reload();
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to delete class'));
    }
  }

  // Reordering only makes sense on the full, unfiltered list
  const canReorder = !search.trim();

  const columns: Column<SchoolClass>[] = [
    {
      key: 'name',
      header: 'Class',
      width: 200,
      render: (c) => <Text fw={600} size="sm">{c.name}</Text>,
    },
    {
      key: 'sections',
      header: 'Sections',
      render: (c) => c.sections.length ? (
        <Group gap={6}>
          {c.sections.map((s) => <Badge key={s.id} variant="light" radius="sm">{s.name}</Badge>)}
        </Group>
      ) : <Text size="sm" c="dimmed">No sections</Text>,
    },
    {
      key: 'parents',
      header: 'Parents',
      width: 120,
      render: (c) => <Text size="sm">{c.parentsCount ?? 0}</Text>,
    },
  ];

  return (
    <>
      {renderHeader({ reload, loading, startCreate })}

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(c) => String(c.id)}
        loading={loading}
        totalCount={classes.length}
        noun={['class', 'classes']}
        minWidth={560}
        onRowClick={startEdit}
        search={{ value: search, onChange: setSearch, placeholder: 'Search class or section' }}
        onClearFilters={() => setSearch('')}
        rowActions={(c) => {
          const index = classes.findIndex((x) => x.id === c.id);
          return (
            <Menu position="bottom-end" width={190}>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" aria-label={`Actions for class ${c.name}`}>
                  <IconDots size={18} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => startEdit(c)}>Edit</Menu.Item>
                <Menu.Item
                  leftSection={<IconArrowUp size={16} />}
                  disabled={!canReorder || index === 0}
                  onClick={() => move(c, -1)}
                >
                  Move up
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconArrowDown size={16} />}
                  disabled={!canReorder || index === classes.length - 1}
                  onClick={() => move(c, 1)}
                >
                  Move down
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => { setTarget(c); openConfirm(); }}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          );
        }}
        renderMobileRow={(c) => (
          <div style={{ minWidth: 0 }}>
            <Group gap="xs" justify="space-between" wrap="nowrap">
              <Text fw={600} size="sm">Class {c.name}</Text>
              <Text size="xs" c="dimmed">{c.parentsCount ?? 0} parents</Text>
            </Group>
            <Text size="xs" c="dimmed" mt={2}>
              {c.sections.length ? `Sections: ${c.sections.map((s) => s.name).join(', ')}` : 'No sections'}
            </Text>
          </div>
        )}
        emptyState={
          <EmptyState
            py={64}
            icon={<IconSchool size={28} stroke={1.5} />}
            title="No classes yet"
            description="Add the school's classes and their sections, then pick them when adding parents."
          >
            <Button mt="md" leftSection={<IconPlus size={16} />} onClick={startCreate}>Add class</Button>
          </EmptyState>
        }
      />

      <ClassModal client={client} opened={formOpen} onClose={closeForm} editing={editing} classes={classes} onSaved={reload} />
      <ConfirmDialog
        opened={confirmOpen}
        onClose={closeConfirm}
        onConfirm={handleDelete}
        title="Delete class?"
        message={
          target?.parentsCount
            ? <>Class {target.name} has {target.parentsCount} parent(s) assigned. Move them to another class before deleting.</>
            : <>Class {target?.name} and its sections will be removed.</>
        }
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
