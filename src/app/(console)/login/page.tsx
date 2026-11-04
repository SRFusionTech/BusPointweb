'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert, Anchor, Box, Button, Center, Group, Paper, PasswordInput, Stack, Text, TextInput, ThemeIcon, Title,
} from '@mantine/core';
import { IconAlertCircle, IconBus, IconLock, IconMail } from '@tabler/icons-react';
import { ColorSchemeToggle } from '@/components/console/ColorSchemeToggle';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';

const ROLE_REDIRECT: Record<string, string> = {
  super_admin: '/super-admin/dashboard',
  school_admin: '/dashboard',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setAccessTokenExpiresAt = useAuthStore((s) => s.setAccessTokenExpiresAt);
  const showPageLoader = useUiStore((s) => s.showPageLoader);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit({ email, password }: FormValues) {
    setFormError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/web/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setFormError(json?.message ?? 'Invalid email or password.');
        return;
      }

      const { role, email: userEmail, accessTokenExpiresAt } = json.data;
      setUser({ email: userEmail, role });
      if (accessTokenExpiresAt) setAccessTokenExpiresAt(accessTokenExpiresAt);

      // Stays visible until the destination's AuthGuard finishes (it hides it)
      showPageLoader('Taking you in…');
      router.push(ROLE_REDIRECT[role] ?? '/');
    } catch {
      setFormError('Could not reach the server. Please try again.');
    }
  }

  return (
    <Stack mih="100dvh" gap={0}>
      <Group justify="space-between" px="lg" py="md">
        <Anchor component={Link} href="/" underline="never">
          <Group gap="xs">
            <ThemeIcon size="md" radius="md"><IconBus size={16} /></ThemeIcon>
            <Text fw={700}>BusPoint</Text>
          </Group>
        </Anchor>
        <ColorSchemeToggle />
      </Group>

      <Center flex={1} px="md" pb={64}>
        <Box w="100%" maw={400}>
          <Stack gap={4} mb="lg" align="center">
            <Title order={2}>Welcome back</Title>
            <Text c="dimmed" size="sm">Sign in to your BusPoint console</Text>
          </Stack>

          <Paper withBorder shadow="sm" p="xl">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack>
                {formError && (
                  <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />} role="alert">
                    {formError}
                  </Alert>
                )}
                <TextInput
                  label="Email"
                  placeholder="you@school.com"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  leftSection={<IconMail size={16} />}
                  error={errors.email?.message}
                  disabled={isSubmitting}
                  {...register('email')}
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  autoComplete="current-password"
                  leftSection={<IconLock size={16} />}
                  error={errors.password?.message}
                  disabled={isSubmitting}
                  {...register('password')}
                />
                <Button type="submit" fullWidth mt="xs" loading={isSubmitting}>
                  Sign in
                </Button>
              </Stack>
            </form>
          </Paper>

          <Text c="dimmed" size="xs" ta="center" mt="lg">
            BusPoint by SRFusion
          </Text>
        </Box>
      </Center>
    </Stack>
  );
}
