import type { ReactNode } from 'react';
import { Card, Group, Progress, Skeleton, Text, ThemeIcon } from '@mantine/core';

export function StatCard({
  label, value, hint, icon, color = 'brand', loading, progress,
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
  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `linear-gradient(135deg, var(--mantine-color-${color}-light) 0%, transparent 55%)`,
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
        <Text size="sm" fw={500} c="dimmed">{label}</Text>
        <ThemeIcon variant="filled" color={color} size={36} radius="md" style={{ boxShadow: 'var(--mantine-shadow-sm)' }}>
          {icon}
        </ThemeIcon>
      </Group>

      {loading
        ? <Skeleton h={34} w={56} mt={4} />
        : <Text fz={32} fw={700} lh={1.1} mt={4} style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</Text>}

      {progress !== undefined && !loading && (
        <Progress value={progress} color={color} size={6} radius="xl" mt="sm" />
      )}

      {hint && (
        <Text size="xs" c="dimmed" mt={progress !== undefined ? 8 : 6}>{hint}</Text>
      )}
    </Card>
  );
}
