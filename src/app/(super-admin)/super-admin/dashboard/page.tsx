import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Super Admin Dashboard' };

export default function SuperAdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Super Admin Dashboard</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Platform-wide overview will appear here.
      </p>
    </div>
  );
}
