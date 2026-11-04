'use client';

import { useAuthStore } from '@/stores/auth.store';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Profile</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)] mb-6">
        Your account details.
      </p>

      <div className="card p-6 space-y-4">
        <div>
          <label className="label">Email address</label>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{user?.email}</p>
        </div>
        <div>
          <label className="label">Role</label>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)] capitalize">
            {user?.role?.replace('_', ' ')}
          </p>
        </div>
      </div>
    </div>
  );
}
