import type { Metadata } from 'next';
import { SchoolDashboard } from '@/components/console/dashboard/SchoolDashboard';

export const metadata: Metadata = { title: 'Overview' };

export default function DashboardPage() {
  return <SchoolDashboard />;
}
