'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Group, Pagination, Paper, Select, Table, Text, TextInput } from '@mantine/core';
import { PageHeader } from '@/components/console/PageHeader';
import { StatusPill } from '@/components/console/StatusPill';
import { api, type BusSummary } from '@/lib/api';
import { errorMessage } from '@/lib/notify';
import {
  DIRECTION_LABEL, END_REASON_LABEL, fmtDateTime, fmtDistance, fmtDuration, fmtTime, tripsApi,
  type Direction, type TripSummary,
} from '@/lib/tripsApi';

const LIMIT = 25;

/** All trips of the school (history), newest first, with filters. */
export default function TripHistoryPage() {
  const router = useRouter();
  const [rows, setRows] = useState<TripSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buses, setBuses] = useState<BusSummary[]>([]);
  const [busId, setBusId] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    api.buses.list().then((r) => setBuses(r.data)).catch(() => undefined);
  }, []);

  const queryKey = JSON.stringify({ page, busId, direction, from, to });
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    let alive = true;
    const fetchPage = async () => {
      try {
        const res = await tripsApi.list({
          page,
          limit: LIMIT,
          busId: busId ?? undefined,
          direction: direction ?? undefined,
          from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
          to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
        });
        if (!alive) return;
        setRows(res.data);
        setTotal(res.meta?.total ?? res.data.length);
        setTotalPages(Math.max(1, res.meta?.totalPages ?? 1));
        setError(null);
      } catch (e) {
        if (alive) setError(errorMessage(e, 'Could not load trips.'));
      } finally {
        if (alive) setLoadedKey(JSON.stringify({ page, busId, direction, from, to }));
      }
    };
    void fetchPage();
    return () => {
      alive = false;
    };
  }, [page, busId, direction, from, to]);

  return (
    <>
      <PageHeader title="Trip history" description={`${total} trip${total === 1 ? '' : 's'}`} />

      <Group mb="md" align="flex-end" wrap="wrap">
        <Select
          label="Bus"
          placeholder="All buses"
          clearable
          data={buses.map((b) => ({ value: b.id, label: `${b.name} · ${b.plateNumber}` }))}
          value={busId}
          onChange={(v) => { setPage(1); setBusId(v); }}
          w={220}
        />
        <Select
          label="Direction"
          placeholder="Both"
          clearable
          data={[{ value: 'pickup', label: 'Pickup' }, { value: 'drop', label: 'Drop' }]}
          value={direction}
          onChange={(v) => { setPage(1); setDirection(v as Direction | null); }}
          w={140}
        />
        <TextInput label="From" type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.currentTarget.value); }} w={160} />
        <TextInput label="To" type="date" value={to} onChange={(e) => { setPage(1); setTo(e.currentTarget.value); }} w={160} />
      </Group>

      {error && <Alert color="red" mb="md">{error}</Alert>}

      <Paper withBorder radius="md">
        <Table.ScrollContainer minWidth={980}>
          <Table highlightOnHover verticalSpacing="sm" fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Started</Table.Th>
                <Table.Th>Ended</Table.Th>
                <Table.Th>Trip</Table.Th>
                <Table.Th>Bus</Table.Th>
                <Table.Th>Driver</Table.Th>
                <Table.Th>Duration</Table.Th>
                <Table.Th>Distance</Table.Th>
                <Table.Th>Stops</Table.Th>
                <Table.Th>Alerts</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {!loading && rows.length === 0 && (
                <Table.Tr><Table.Td colSpan={10}><Text c="dimmed" ta="center" py="lg">No trips match.</Text></Table.Td></Table.Tr>
              )}
              {rows.map((t) => (
                <Table.Tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/trips/${t.id}`)}>
                  <Table.Td>{fmtDateTime(t.startedAt)}</Table.Td>
                  <Table.Td>{t.endedAt ? fmtTime(t.endedAt) : '—'}</Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600}>{DIRECTION_LABEL[t.direction]}</Text>
                    <Text size="xs" c="dimmed">{t.routeName}</Text>
                  </Table.Td>
                  <Table.Td>{t.bus ? `${t.bus.name} · ${t.bus.plateNumber}` : '—'}</Table.Td>
                  <Table.Td>{t.driver?.fullName ?? '—'}</Table.Td>
                  <Table.Td>{fmtDuration(t.durationSec)}</Table.Td>
                  <Table.Td>{fmtDistance(t.distanceM)}</Table.Td>
                  <Table.Td>
                    {t.stops.reached}/{t.stops.total}
                    {t.stops.skipped ? <Text span c="orange" size="sm"> · {t.stops.skipped} skipped</Text> : null}
                  </Table.Td>
                  <Table.Td>{t.alertsCount ? <Text span c="red" size="sm">{t.alertsCount}</Text> : '—'}</Table.Td>
                  <Table.Td>
                    {t.status === 'in_progress' ? (
                      <StatusPill tone="blue">Running</StatusPill>
                    ) : (
                      <StatusPill tone={t.endReason === 'last_stop' ? 'green' : 'orange'}>{t.endReason ? END_REASON_LABEL[t.endReason] : 'Completed'}</StatusPill>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {totalPages > 1 && (
        <Group justify="center" mt="md">
          <Pagination total={totalPages} value={page} onChange={setPage} />
        </Group>
      )}
    </>
  );
}
