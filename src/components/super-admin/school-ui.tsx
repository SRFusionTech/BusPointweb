import { Avatar, Badge } from '@mantine/core';
import type { SchoolSummary } from '@/lib/api';

export function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant="dot" color={active ? 'teal' : 'gray'}>
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );
}

export function SchoolAvatar({ school, size = 36 }: { school: SchoolSummary; size?: number }) {
  return (
    <Avatar src={school.logoUrl || null} alt="" size={size} radius="md" color="brand" variant="light">
      {school.name.trim()[0]?.toUpperCase() ?? '?'}
    </Avatar>
  );
}
