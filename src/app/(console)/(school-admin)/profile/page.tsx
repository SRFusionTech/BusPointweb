'use client';

import { Card, DataList } from '@mantine/core';
import { PageHeader } from '@/components/console/PageHeader';
import { useAuthStore } from '@/stores/auth.store';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <>
      <PageHeader title="Profile" description="Your account details." />
      <Card maw={560} padding="lg">
        <DataList withDivider>
          <DataList.Item>
            <DataList.ItemLabel>Email address</DataList.ItemLabel>
            <DataList.ItemValue>{user?.email ?? '—'}</DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Role</DataList.ItemLabel>
            <DataList.ItemValue tt="capitalize">{user?.role?.replace('_', ' ') ?? '—'}</DataList.ItemValue>
          </DataList.Item>
        </DataList>
      </Card>
    </>
  );
}
