'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type UserRole } from '@/stores/auth.store';
import { api } from '@/lib/api';

interface Props {
  requiredRole: UserRole | UserRole[];
  children: React.ReactNode;
}

/** Protects a layout: verifies session via /auth/me on mount, redirects if wrong role. */
export function AuthGuard({ requiredRole, children }: Props) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    async function check() {
      try {
        // If Zustand already has a user with the right role, trust it
        if (user && allowed.includes(user.role)) {
          setReady(true);
          return;
        }

        // Otherwise re-verify via the cookie (handles hard refresh)
        const { data } = await api.auth.me();
        const role = data.role as UserRole;

        if (!allowed.includes(role)) {
          router.replace('/login');
          return;
        }

        setUser({ email: data.email, role });
        setReady(true);
      } catch {
        setUser(null);
        router.replace('/login');
      }
    }

    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--color-surface-primary)]">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--color-primary-100)]" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--color-primary-600)]" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
