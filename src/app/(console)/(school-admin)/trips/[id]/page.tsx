'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Alert, Grid, Group, Loader, Paper, Title } from '@mantine/core';
import { PageHeader } from '@/components/console/PageHeader';
import { DetailRows, PlateChip } from '@/components/console/DetailSection';
import { StatusPill } from '@/components/console/StatusPill';
import { TripStopsTable } from '@/components/console/trips/TripStopsTable';
import { TripEventsList } from '@/components/console/trips/TripEventsList';
import { TripsMap } from '@/components/console/trips/TripsMap';
import { errorMessage } from '@/lib/notify';
import {
  DIRECTION_LABEL, END_REASON_LABEL, fmtDateTime, fmtDistance, fmtDuration, tripsApi, type TripDetail,
} from '@/lib/tripsApi';

/** One trip: info, map with the GPS trail, every stop with students, and the full event log. */
export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tripsApi.get(id).then((r) => setTrip(r.data)).catch((e) => setError(errorMessage(e, 'Could not load this trip.')));
  }, [id]);

  return (
    <>
      <PageHeader
        title={trip ? `${DIRECTION_LABEL[trip.direction]} trip · ${trip.routeName}` : 'Trip'}
        breadcrumbs={[{ label: 'Trip history', href: '/trips' }, { label: trip ? fmtDateTime(trip.startedAt) : '…' }]}
      />
      {error && <Alert color="red">{error}</Alert>}
      {!trip && !error && <Loader />}

      {trip && (
        <>
          <Grid gap="md">
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Paper withBorder radius="md" p="md" h="100%">
                <Group gap="sm" mb="sm">
                  {trip.bus && <Title order={5}>{trip.bus.name}</Title>}
                  {trip.bus && <PlateChip plate={trip.bus.plateNumber} />}
                  {trip.status === 'in_progress' ? (
                    <StatusPill tone="blue">Running</StatusPill>
                  ) : (
                    <StatusPill tone={trip.endReason === 'last_stop' ? 'green' : 'orange'}>{trip.endReason ? END_REASON_LABEL[trip.endReason] : 'Completed'}</StatusPill>
                  )}
                </Group>
                <DetailRows
                  rows={[
                    { label: 'Driver', value: trip.driver ? `${trip.driver.fullName ?? '—'}${trip.driver.phone ? ` (${trip.driver.phone})` : ''}` : '—' },
                    { label: 'Direction', value: DIRECTION_LABEL[trip.direction] },
                    { label: 'Route', value: trip.routeName },
                    { label: 'Started', value: fmtDateTime(trip.startedAt) },
                    { label: 'Ended', value: trip.endedAt ? fmtDateTime(trip.endedAt) : 'Still running' },
                    { label: 'Duration', value: fmtDuration(trip.durationSec) },
                    { label: 'Distance', value: fmtDistance(trip.distanceM) },
                    { label: 'Stops', value: `${trip.progress.reached} reached · ${trip.progress.skipped} skipped · ${trip.progress.pending} pending (of ${trip.progress.total})` },
                    { label: 'Students on route', value: trip.stops.reduce((n, s) => n + s.studentsCount, 0) },
                    { label: 'GPS points', value: trip.trailPointsTotal },
                  ]}
                />
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Paper withBorder radius="md" p={0}>
                <TripsMap stops={trip.stops} trail={trip.trail} road={trip.road} height={420} />
              </Paper>
            </Grid.Col>
          </Grid>

          <Paper withBorder radius="md" p="md" mt="lg">
            <Title order={5} mb="xs">Stops</Title>
            <TripStopsTable trip={trip} />
          </Paper>

          <Paper withBorder radius="md" p="md" mt="lg">
            <Title order={5} mb="xs">Event log</Title>
            <TripEventsList events={trip.events} />
          </Paper>
        </>
      )}
    </>
  );
}
