import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Welcome back — your school overview will appear here.
      </p>
    </div>
  );
}
