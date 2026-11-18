'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Center, Loader, Stack, Text, Title } from '@mantine/core';
import { useAuthStore, type UserRole } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { api, ApiError } from '@/lib/api';

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
  /** Session is fine but the server couldn't be reached — offer a retry instead of a fake logout. */
  const [unreachable, setUnreachable] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    async function check() {
      try {
        // Trust the cached user once its profile (incl. school branding) has been loaded
        if (user && allowed.includes(user.role) && user.school !== undefined) {
          setReady(true);
          return;
        }

        // Otherwise re-verify the stored access token (handles hard refresh)
        const { data } = await api.auth.me();
        const role = data.role as UserRole;

        if (!allowed.includes(role)) {
          router.replace('/login');
          return;
        }

        setUser({ email: data.email, role, fullName: data.fullName, school: data.school });
        setReady(true);
      } catch (e) {
        // Only a session that really ended goes to login: the refresh was rejected (api.ts then clears
        // the tokens) or the server answered 401/403. A network blip or 5xx must not sign anyone out.
        const sessionEnded = !useAuthStore.getState().refreshToken || (e instanceof ApiError && (e.status === 401 || e.status === 403));
        if (sessionEnded) {
          setUser(null);
          router.replace('/login');
        } else {
          setUnreachable(true);
        }
      } finally {
        hidePageLoader(); // shown by the login page during redirect
      }
    }

    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  if (unreachable) {
    return (
      <Center h="100dvh" px="md">
        <Stack align="center" gap="sm" maw={420}>
          <Title order={3} ta="center">
            Couldn’t reach BusPoint
          </Title>
          <Text c="dimmed" ta="center">
            You’re still signed in. Check your connection and try again.
          </Text>
          <Button
            onClick={() => {
              setUnreachable(false);
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </Button>
        </Stack>
      </Center>
    );
  }

  if (!ready) {
    return (
      <Center h="100dvh">
        <Loader />
      </Center>
    );
  }

  return <>{children}</>;
}
