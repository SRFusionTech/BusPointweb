'use client';

import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/console/PageHeader';
import { ClassesManager } from '@/components/console/ClassesManager';

export default function ClassesPage() {
  return (
    <ClassesManager
      client={api.classes}
      renderHeader={({ reload, loading, startCreate }) => (
        <PageHeader
          title="Classes"
          breadcrumbs={[{ label: 'School' }, { label: 'Classes' }]}
          description="Your school's classes and their sections. These appear as dropdowns when adding a parent."
          actions={
            <>
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
