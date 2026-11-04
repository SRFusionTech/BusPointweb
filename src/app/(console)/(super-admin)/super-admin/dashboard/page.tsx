import type { Metadata } from 'next';
import { PageHeader } from '@/components/console/PageHeader';

export const metadata: Metadata = { title: 'Super Admin Dashboard' };

export default function SuperAdminDashboardPage() {
  return (
    <PageHeader
      title="Dashboard"
      breadcrumbs={[{ label: 'Platform' }, { label: 'Dashboard' }]}
      description="Platform-wide overview will appear here."
    />
  );
}
