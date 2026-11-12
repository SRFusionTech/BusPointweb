import type { ReactNode } from 'react';
import { Card, Group, Progress, Skeleton, Text, ThemeIcon } from '@mantine/core';

/** Semantic accents only — anything else falls back to calm brand navy (no rainbow dashboards). */
const ACCENTS = new Set(['teal', 'navy', 'success', 'warning', 'danger', 'info', 'brass']);
const ALIASES: Record<string, string> = { red: 'danger', orange: 'warning', yellow: 'warning', green: 'success', blue: 'info', brand: 'teal' };

export function StatCard({
  label,
  value,
  hint,
  icon,
  color = 'navy',
  loading,
  progress,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  color?: string;
  loading?: boolean;
  /** 0–100; renders a thin bar under the value. */
  progress?: number;
}) {
  const c = ALIASES[color] ?? (ACCENTS.has(color) ? color : 'navy');
  return (
    <Card padding="lg">
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
        <Text size="sm" fw={500} c="dimmed">
          {label}
        </Text>
        <ThemeIcon variant="light" color={c} size={36} radius="md">
          {icon}
        </ThemeIcon>
      </Group>
      {loading ? (
        <Skeleton h={32} w={64} mt={6} />
      ) : (
        <Text fz="h2" fw={600} lh={1.15} mt={4} className="tnum">
          {value}
        </Text>
      )}
      {progress !== undefined && !loading && <Progress value={progress} color={c === 'navy' ? 'teal' : c} size={6} radius="xl" mt="sm" />}
      {hint && (
        <Text size="xs" c="dimmed" mt={progress !== undefined ? 8 : 6}>
          {hint}
        </Text>
      )}
    </Card>
  );
}
