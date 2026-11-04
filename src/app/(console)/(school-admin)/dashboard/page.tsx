import type { Metadata } from 'next';
import { PageHeader } from '@/components/console/PageHeader';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <PageHeader
      title="Dashboard"
      description="Welcome back — your school overview will appear here."
    />
  );
}
