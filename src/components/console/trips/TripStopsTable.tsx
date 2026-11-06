import { Stack, Table, Text } from '@mantine/core';
import { StatusPill } from '@/components/console/StatusPill';
import { fmtDistance, fmtTime, type TripSnapshot } from '@/lib/tripsApi';

/** Every stop of a trip with status, times, distance and the students (child, class, parent, phone). */
export function TripStopsTable({ trip }: { trip: TripSnapshot }) {
  const onTrip = trip.status === 'in_progress';
  return (
    <Table.ScrollContainer minWidth={760}>
      <Table striped highlightOnHover verticalSpacing="xs" fz="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            <Table.Th>Stop</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Reached</Table.Th>
            <Table.Th>ETA</Table.Th>
            <Table.Th>Distance</Table.Th>
            <Table.Th>Students</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {trip.stops.map((s) => {
            const isNext = onTrip && s.id === trip.nextStopId;
            const isHere = onTrip && s.id === trip.atStopId;
            return (
              <Table.Tr key={s.id} bg={isNext ? 'var(--mantine-color-blue-light)' : undefined}>
                <Table.Td>{s.seq + 1}</Table.Td>
                <Table.Td>
                  <Text size="sm" fw={600}>{s.name}</Text>
                  <Text size="xs" c="dimmed">
                    {s.kind === 'school' ? 'School' : s.kind === 'end' ? 'Last stop' : 'Stop'}
                    {s.address ? ` · ${s.address}` : ''}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {s.status === 'reached' ? (
                    <StatusPill tone="green">{isHere ? 'Bus here' : 'Reached'}</StatusPill>
                  ) : s.status === 'skipped' ? (
                    <StatusPill tone="orange">Skipped</StatusPill>
                  ) : isNext ? (
                    <StatusPill tone="blue">Next</StatusPill>
                  ) : (
                    <StatusPill tone="gray">Upcoming</StatusPill>
                  )}
                </Table.Td>
                <Table.Td>{fmtTime(s.arrivedAt)}</Table.Td>
                <Table.Td>{s.status === 'pending' ? fmtTime(s.etaAt) : '—'}</Table.Td>
                <Table.Td>{s.status === 'pending' ? fmtDistance(s.distanceM) : '—'}</Table.Td>
                <Table.Td>
                  {s.students.length === 0 ? (
                    <Text size="xs" c="dimmed">—</Text>
                  ) : (
                    <Stack gap={2}>
                      {s.students.map((st) => (
                        <Text key={st.parentId} size="xs">
                          <b>{st.childName ?? 'Student'}</b>
                          {st.className ? ` (${st.className})` : ''} · {st.parentName ?? 'Parent'}
                          {st.parentPhone ? ` · ${st.parentPhone}` : ''}
                        </Text>
                      ))}
                    </Stack>
                  )}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
