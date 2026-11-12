'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Drawer,
  Group,
  Pagination,
  ScrollArea,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useDebouncedValue, useMediaQuery } from '@mantine/hooks';
import { IconBuildingPlus, IconInbox, IconMail, IconPhone, IconSearch, IconWorld } from '@tabler/icons-react';
import { PageHeader } from '@/components/console/PageHeader';
import { api, type DemoRequest, type DemoRequestStats, type DemoRequestStatus } from '@/lib/api';
import { notify } from '@/lib/notify';
import { dashboardBus } from '@/lib/dashboardBus';
import { PREFILL_SCHOOL_KEY } from '@/lib/prefill';

const STATUS: Record<DemoRequestStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'teal' },
  contacted: { label: 'Contacted', color: 'info' },
  demo_scheduled: { label: 'Demo scheduled', color: 'brass' },
  won: { label: 'Won', color: 'success' },
  lost: { label: 'Lost', color: 'gray' },
};
const ORDER: DemoRequestStatus[] = ['new', 'contacted', 'demo_scheduled', 'won', 'lost'];

const LABELS: Record<string, string> = {
  ib: 'IB',
  cambridge: 'British / Cambridge',
  american: 'American',
  national: 'National curriculum',
  other: 'Other',
  under_500: 'Under 500',
  '500_1000': '500–1,000',
  '1000_2500': '1,000–2,500',
  over_2500: '2,500+',
  '1_5': '1–5',
  '6_15': '6–15',
  '16_40': '16–40',
  over_40: '40+',
  email: 'Email',
  phone: 'Phone call',
  whatsapp: 'WhatsApp',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  any: 'Any time',
};
const label = (v: string | null) => (v ? (LABELS[v] ?? v) : '—');

function when(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 60_000;
  if (diff < 60) return `${Math.max(1, Math.round(diff))} min ago`;
  if (diff < 60 * 24) return `${Math.round(diff / 60)} h ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

function StatusBadge({ status }: { status: DemoRequestStatus }) {
  const s = STATUS[status];
  return (
    <Badge color={s.color} variant="light" size="md">
      {s.label}
    </Badge>
  );
}

const PAGE_SIZE = 25;

export default function DemoRequestsPage() {
  const router = useRouter();
  const isPhone = useMediaQuery('(max-width: 48em)');
  const [items, setItems] = useState<DemoRequest[]>([]);
  const [stats, setStats] = useState<DemoRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'all' | DemoRequestStatus>('all');
  const [query, setQuery] = useState('');
  const [debounced] = useDebouncedValue(query, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<DemoRequest | null>(null);
  const [draft, setDraft] = useState<{ status: DemoRequestStatus; notes: string; assignedTo: string }>({ status: 'new', notes: '', assignedTo: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, st] = await Promise.all([
        api.demoRequests.list({ status: status === 'all' ? undefined : status, q: debounced.trim() || undefined, page, limit: PAGE_SIZE }),
        api.demoRequests.stats(),
      ]);
      setItems(list.data);
      setTotalPages(list.meta?.totalPages ?? 1);
      setStats(st.data);
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Couldn’t load demo requests');
    } finally {
      setLoading(false);
    }
  }, [status, debounced, page]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => setPage(1), [status, debounced]);

  function open(r: DemoRequest) {
    setSelected(r);
    setDraft({ status: r.status, notes: r.notes ?? '', assignedTo: r.assignedTo ?? '' });
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await api.demoRequests.update(selected.id, draft);
      setItems((xs) => xs.map((x) => (x.id === selected.id ? res.data : x)));
      setSelected(res.data);
      notify.success('Saved');
      dashboardBus.emit('demoRequests');
      void api.demoRequests.stats().then((r) => setStats(r.data));
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Couldn’t save');
    } finally {
      setSaving(false);
    }
  }

  function convert() {
    if (!selected) return;
    try {
      sessionStorage.setItem(
        PREFILL_SCHOOL_KEY,
        JSON.stringify({ name: selected.schoolName, adminName: selected.contactName, adminEmail: selected.email, adminPhone: selected.phone }),
      );
    } catch {
      // storage blocked: the form simply opens empty
    }
    router.push('/super-admin/schools');
  }

  const segments = useMemo(
    () => [
      { value: 'all', label: `All${stats ? ` · ${stats.total}` : ''}` },
      ...ORDER.map((s) => ({ value: s, label: `${STATUS[s].label}${stats ? ` · ${stats.byStatus[s] ?? 0}` : ''}` })),
    ],
    [stats],
  );

  const empty = !loading && items.length === 0;

  return (
    <>
      <PageHeader
        title="Demo requests"
        description="Schools that asked for a demo on the website. Reply quickly — every request is a school waiting to hear from you."
        breadcrumbs={[{ label: 'Platform', href: '/super-admin/dashboard' }, { label: 'Demo requests' }]}
      />

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="lg">
        {(['new', 'contacted', 'demo_scheduled', 'won'] as const).map((s) => (
          <Card key={s} padding="md">
            <Text size="sm" c="dimmed" fw={500}>
              {STATUS[s].label}
            </Text>
            {stats ? (
              <Text fz="h2" fw={600} className="tnum">
                {stats.byStatus[s] ?? 0}
              </Text>
            ) : (
              <Skeleton h={30} w={40} mt={6} />
            )}
          </Card>
        ))}
      </SimpleGrid>

      <Card padding={0}>
        <Stack gap="sm" p="md">
          <ScrollArea type="never" offsetScrollbars={false}>
            <SegmentedControl value={status} onChange={(v) => setStatus(v as typeof status)} data={segments} size="sm" />
          </ScrollArea>
          <TextInput
            leftSection={<IconSearch size={16} />}
            placeholder="Search school, contact, email, city or country"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            aria-label="Search demo requests"
          />
        </Stack>

        {empty ? (
          <Stack align="center" gap="xs" py={64} px="md">
            <ThemeIcon size={64} radius="xl" variant="light" color="navy">
              <IconInbox size={30} />
            </ThemeIcon>
            <Title order={3} className="font-display" mt="sm">
              {query || status !== 'all' ? 'Nothing matches' : 'No demo requests yet'}
            </Title>
            <Text c="dimmed" ta="center" maw={380}>
              {query || status !== 'all' ? 'Try another search or filter.' : 'Requests from the website’s “Request a demo” form will appear here.'}
            </Text>
          </Stack>
        ) : isPhone ? (
          <Stack gap={0}>
            {(loading ? Array.from({ length: 4 }) : items).map((r, i) =>
              loading || !r ? (
                <Box key={i} p="md" style={{ borderTop: '1px solid var(--bp-border-subtle)' }}>
                  <Skeleton h={14} w="60%" mb={8} />
                  <Skeleton h={12} w="40%" />
                </Box>
              ) : (
                <Box
                  key={(r as DemoRequest).id}
                  p="md"
                  component="button"
                  type="button"
                  onClick={() => open(r as DemoRequest)}
                  style={{ borderTop: '1px solid var(--bp-border-subtle)', textAlign: 'left', width: '100%', background: 'none' }}
                >
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Box miw={0}>
                      <Text fw={600} truncate="end">
                        {(r as DemoRequest).schoolName}
                      </Text>
                      <Text size="sm" c="dimmed" truncate="end">
                        {(r as DemoRequest).contactName} · {(r as DemoRequest).city}, {(r as DemoRequest).country}
                      </Text>
                    </Box>
                    <StatusBadge status={(r as DemoRequest).status} />
                  </Group>
                  <Text size="xs" c="dimmed" mt={6}>
                    {when((r as DemoRequest).createdAt)}
                  </Text>
                </Box>
              ),
            )}
          </Stack>
        ) : (
          <Table.ScrollContainer minWidth={820}>
            <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>School</Table.Th>
                  <Table.Th>Location</Table.Th>
                  <Table.Th>Buses</Table.Th>
                  <Table.Th>Contact</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Received</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <Table.Tr key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <Table.Td key={j}>
                            <Skeleton h={14} w={j === 0 ? 180 : 90} />
                          </Table.Td>
                        ))}
                      </Table.Tr>
                    ))
                  : items.map((r) => (
                      <Table.Tr key={r.id} onClick={() => open(r)} style={{ cursor: 'pointer' }} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && open(r)}>
                        <Table.Td>
                          <Text fw={600} size="sm">
                            {r.schoolName}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {label(r.schoolType)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {r.city}, {r.country}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{label(r.busRange)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {r.contactName}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {r.contactRole}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <StatusBadge status={r.status} />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {when(r.createdAt)}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}

        {totalPages > 1 && (
          <Group justify="center" p="md" style={{ borderTop: '1px solid var(--bp-border-subtle)' }}>
            <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
          </Group>
        )}
      </Card>

      <Drawer
        opened={!!selected}
        onClose={() => setSelected(null)}
        position="right"
        size={isPhone ? '100%' : 520}
        title={<Text fw={600}>Demo request</Text>}
      >
        {selected && (
          <Stack gap="lg">
            <Box>
              <Title order={2} className="font-display" fz="h3">
                {selected.schoolName}
              </Title>
              <Text c="dimmed" size="sm">
                {selected.city}, {selected.country} · received {when(selected.createdAt)}
              </Text>
            </Box>

            <Card padding="md" bg="var(--bp-bg-surface-alt)" withBorder={false}>
              <Stack gap={6}>
                <Text fw={600}>
                  {selected.contactName}{' '}
                  <Text span c="dimmed" fw={400}>
                    · {selected.contactRole}
                  </Text>
                </Text>
                <Group gap="xs">
                  <IconMail size={16} />
                  <Anchor href={`mailto:${selected.email}`} size="sm">
                    {selected.email}
                  </Anchor>
                </Group>
                <Group gap="xs">
                  <IconPhone size={16} />
                  <Anchor href={`tel:${selected.phone}`} size="sm" className="tnum">
                    {selected.phone}
                  </Anchor>
                </Group>
                {selected.website && (
                  <Group gap="xs">
                    <IconWorld size={16} />
                    <Anchor href={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`} target="_blank" rel="noreferrer" size="sm">
                      {selected.website}
                    </Anchor>
                  </Group>
                )}
                <Text size="sm" c="dimmed">
                  Prefers {label(selected.preferredContact)} · {label(selected.preferredTime)}
                </Text>
              </Stack>
            </Card>

            <SimpleGrid cols={3} spacing="sm">
              {[
                ['Curriculum', label(selected.schoolType)],
                ['Students', label(selected.studentRange)],
                ['Buses', label(selected.busRange)],
              ].map(([k, v]) => (
                <Box key={k}>
                  <Text size="xs" c="dimmed">
                    {k}
                  </Text>
                  <Text size="sm" fw={500}>
                    {v}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>

            {selected.message && (
              <Box>
                <Text size="xs" c="dimmed" mb={4}>
                  Message
                </Text>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {selected.message}
                </Text>
              </Box>
            )}

            <Stack gap="sm">
              <Select
                label="Status"
                data={ORDER.map((s) => ({ value: s, label: STATUS[s].label }))}
                value={draft.status}
                onChange={(v) => v && setDraft((d) => ({ ...d, status: v as DemoRequestStatus }))}
                allowDeselect={false}
              />
              <TextInput label="Owner" placeholder="Who is following up?" value={draft.assignedTo} onChange={(e) => setDraft((d) => ({ ...d, assignedTo: e.currentTarget.value }))} />
              <Textarea label="Notes" autosize minRows={3} placeholder="Call notes, next steps, demo date…" value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.currentTarget.value }))} />
              <Button onClick={() => void save()} loading={saving}>
                Save changes
              </Button>
            </Stack>

            <Card padding="md" withBorder>
              <Group justify="space-between" wrap="nowrap" gap="md">
                <Box>
                  <Text fw={600} size="sm">
                    Ready to onboard?
                  </Text>
                  <Text size="xs" c="dimmed">
                    Create the school with these details prefilled.
                  </Text>
                </Box>
                <Button variant="light" leftSection={<IconBuildingPlus size={16} />} onClick={convert}>
                  Convert to school
                </Button>
              </Group>
            </Card>

            {(selected.source || selected.utm) && (
              <Text size="xs" c="dimmed">
                Source: {selected.source ?? 'direct'}
                {selected.utm ? ` · ${Object.entries(selected.utm).map(([k, v]) => `${k.replace('utm_', '')}=${v}`).join(', ')}` : ''}
              </Text>
            )}
          </Stack>
        )}
      </Drawer>
    </>
  );
}
