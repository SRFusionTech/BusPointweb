import type { ReactNode } from 'react';
import { Box, Group, Stack, Text } from '@mantine/core';

/** Titled block inside a detail drawer. */
export function DetailSection({
  title, action, children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box>
      <Group justify="space-between" mb={8}>
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.05em' }}>{title}</Text>
        {action}
      </Group>
      <Box
        p="md"
        style={{
          border: '1px solid var(--mantine-color-default-border)',
          borderRadius: 'var(--mantine-radius-md)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export function DetailRows({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <Stack gap={10}>
      {rows.map((r) => (
        <Group key={r.label} justify="space-between" wrap="nowrap" gap="md">
          <Text size="sm" c="dimmed">{r.label}</Text>
          <Text size="sm" fw={500} ta="right" component="div">{r.value}</Text>
        </Group>
      ))}
    </Stack>
  );
}

/** Licence-plate style chip. */
export function PlateChip({ plate }: { plate: string }) {
  return (
    <Text
      component="span"
      ff="monospace"
      size="xs"
      fw={600}
      px={6}
      py={2}
      style={{
        display: 'inline-block',
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 4,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {plate}
    </Text>
  );
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
