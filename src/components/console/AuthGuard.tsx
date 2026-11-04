'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Loader } from '@mantine/core';
import { useAuthStore, type UserRole } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { api } from '@/lib/api';

interface Props {
  requiredRole: UserRole | UserRole[];
  children: React.ReactNode;
}

/** Protects a layout: verifies session via /auth/me on mount, redirects if wrong role. */
export function AuthGuard({ requiredRole, children }: Props) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const hidePageLoader = useUiStore((s) => s.hidePageLoader);
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
      } finally {
        hidePageLoader(); // shown by the login page during redirect
      }
    }

    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <Center h="100dvh">
        <Loader />
      </Center>
    );
  }

  return <>{children}</>;
}
