'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ActionIcon, Button, Card, EmptyState, Group, Skeleton, Title, Tooltip } from '@mantine/core';
import { IconAlertCircle, IconPlus, IconRefresh, IconSettings, IconUsersGroup } from '@tabler/icons-react';
import { api, type SchoolSummary } from '@/lib/api';
import { errorMessage } from '@/lib/notify';
import { PageHeader } from '@/components/console/PageHeader';
import { ClassesManager, type ClassesClient } from '@/components/console/ClassesManager';
import { SchoolAvatar, StatusBadge } from '@/components/super-admin/school-ui';

export default function SuperAdminSchoolClassesPage() {
  const { id: schoolId } = useParams<{ id: string }>();
  const [school, setSchool] = useState<SchoolSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.schools.get(schoolId)
      .then((res) => { if (!cancelled) setSchool(res.data); })
      .catch((err) => { if (!cancelled) setLoadError(errorMessage(err, "Couldn't load this school")); });
    return () => { cancelled = true; };
  }, [schoolId]);

  // Stable per school, so the manager doesn't refetch on every render
  const client = useMemo<ClassesClient>(() => ({
    list: () => api.superAdminClasses.list(schoolId),
    create: (body) => api.superAdminClasses.create(schoolId, body),
    update: (id, body) => api.superAdminClasses.update(schoolId, id, body),
    remove: (id) => api.superAdminClasses.remove(schoolId, id),
    reorder: (ids) => api.superAdminClasses.reorder(schoolId, ids),
  }), [schoolId]);

  if (loadError) {
    return (
      <Card>
        <EmptyState py={48} icon={<IconAlertCircle size={26} stroke={1.5} />} title="Couldn't load this school" description={loadError}>
          <Button mt="md" variant="default" component={Link} href="/super-admin/schools">Back to schools</Button>
        </EmptyState>
      </Card>
    );
  }

  return (
    <ClassesManager
      client={client}
      renderHeader={({ reload, loading, startCreate }) => (
        <PageHeader
          breadcrumbs={[
            { label: 'Schools', href: '/super-admin/schools' },
            { label: school?.name ?? '…' },
            { label: 'Classes' },
          ]}
          leading={school ? <SchoolAvatar school={school} size={48} /> : <Skeleton h={48} w={48} radius="md" />}
          title={
            school ? (
              <Group gap="sm">
                <Title order={2} fw={600}>{school.name}</Title>
                <StatusBadge active={school.isActive} />
              </Group>
            ) : <Skeleton h={28} w={220} />
          }
          description={school ? 'Classes and sections for this school — used in the parent form.' : <Skeleton h={12} maw={320} mt={6} />}
          actions={
            <>
              <Button variant="default" leftSection={<IconSettings size={16} />} component={Link} href={`/super-admin/schools/${schoolId}/settings`}>
                Settings
              </Button>
              <Button variant="default" leftSection={<IconUsersGroup size={16} />} component={Link} href={`/super-admin/schools/${schoolId}/parents`}>
                Parents
              </Button>
              <Tooltip label="Refresh">
                <ActionIcon variant="default" size="lg" onClick={reload} loading={loading} aria-label="Refresh">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
              <Button leftSection={<IconPlus size={16} />} onClick={startCreate}>Add class</Button>
            </>
          }
        />
      )}
    />
  );
}
