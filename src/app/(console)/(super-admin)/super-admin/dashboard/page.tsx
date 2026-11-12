import type { Metadata } from 'next';
import { SuperDashboard } from '@/components/console/dashboard/SuperDashboard';

export const metadata: Metadata = { title: 'Platform overview' };

export default function SuperAdminDashboardPage() {
  return <SuperDashboard />;
}
