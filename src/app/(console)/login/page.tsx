'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert, Anchor, Box, Button, Group, PasswordInput, Stack, Text, TextInput, ThemeIcon, Title,
} from '@mantine/core';
import { IconAlertCircle, IconClockHour4, IconDeviceMobile, IconLock, IconMail, IconMapPin, IconShieldCheck } from '@tabler/icons-react';
import { Logo } from '@/components/brand/Logo';
import { API_BASE } from '@/lib/apiBase';
import { ColorSchemeToggle } from '@/components/console/ColorSchemeToggle';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import './login.css';

const classes = {
  shell: 'bp-login',
  brand: 'bp-login-brand',
  brandInner: 'bp-login-brand-inner',
  headline: 'bp-login-headline',
  glass: 'bp-login-glass',
  pulse: 'bp-login-pulse',
  stop: 'bp-login-stop',
  rail: 'bp-login-rail',
  dot: 'bp-login-dot',
  line: 'bp-login-line',
  feature: 'bp-login-feature',
  featureIcon: 'bp-login-feature-icon',
  formSide: 'bp-login-form-side',
  formWrap: 'bp-login-form-wrap',
};

const ROLE_REDIRECT: Record<string, string> = {
  super_admin: '/super-admin/dashboard',
  school_admin: '/dashboard',
};

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});
type FormValues = z.infer<typeof schema>;

// Illustrative trip shown on the brand panel
const DEMO_STOPS = [
  { name: 'Palm Grove Gate', note: '6 students picked up', time: '7:10', state: 'done' },
  { name: 'Lakeside Villas', note: '4 students picked up', time: '7:18', state: 'done' },
  { name: 'Marina Walk', note: 'Arriving in 2 min', time: '7:24', state: 'current' },
  { name: 'Al Wasl Park', note: 'About 7:31', time: '7:31', state: 'next' },
  { name: 'School', note: 'On time', time: '7:55', state: 'next' },
] as const;

const FEATURES = [
  { icon: IconMapPin, title: 'Your whole fleet, live', text: 'Every bus on one map, updated every few seconds.' },
  { icon: IconClockHour4, title: 'Arrival times for every stop', text: 'Families see exactly when to step out.' },
  { icon: IconShieldCheck, title: 'Private by design', text: 'Separate access for admins, drivers and families.' },
];

function BrandPanel() {
  return (
    <aside className={classes.brand} aria-hidden="true">
      <div className={classes.brandInner}>
        <span style={{ color: 'var(--bp-text-on-brand)', display: 'inline-flex' }}>
          <Logo size={32} />
        </span>

        <Stack gap="xl">
          <Box>
            <h1 className={classes.headline}>Every school bus, live on one calm screen.</h1>
            <Text className="bp-login-sub" size="md" mt="md" maw={440}>
              Plan routes, assign drivers and keep families informed — from the first stop to the school gate.
            </Text>
          </Box>

          <div className={classes.glass}>
            <Group justify="space-between" mb="md">
              <div>
                <Text size="sm" fw={600} className="bp-login-stop-name">
                  Morning route · Bus 04
                </Text>
                <Text size="xs" className="bp-login-stop-note">
                  14 students on board
                </Text>
              </div>
              <Group gap={8} wrap="nowrap">
                <span className={classes.pulse} />
                <Text size="xs" fw={600} className="bp-login-live">
                  Live
                </Text>
              </Group>
            </Group>
            {DEMO_STOPS.map((s, i) => (
              <div key={s.name} className={classes.stop}>
                <div className={classes.rail}>
                  <span className={classes.dot} data-state={s.state} />
                  {i < DEMO_STOPS.length - 1 && <span className={classes.line} data-done={s.state === 'done'} />}
                </div>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={s.state === 'current' ? 600 : 500} className="bp-login-stop-name" data-state={s.state}>
                    {s.name}
                  </Text>
                  <Text size="xs" className="bp-login-stop-note" data-state={s.state}>
                    {s.note}
                  </Text>
                </Box>
                <Text size="xs" className="bp-login-stop-note tnum">
                  {s.time}
                </Text>
              </div>
            ))}
          </div>
        </Stack>

        <Stack gap="md">
          {FEATURES.map((f) => (
            <div key={f.title} className={classes.feature}>
              <span className={classes.featureIcon}>
                <f.icon size={18} stroke={1.75} />
              </span>
              <div>
                <Text size="sm" fw={600} className="bp-login-stop-name">
                  {f.title}
                </Text>
                <Text size="xs" className="bp-login-stop-note">
                  {f.text}
                </Text>
              </div>
            </div>
          ))}
        </Stack>
      </div>
    </aside>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setTokens = useAuthStore((s) => s.setTokens);
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
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setFormError(json?.message ?? 'Invalid email or password.');
        return;
      }

      const { role, email: userEmail, accessToken, refreshToken, accessTokenExpiresAt } = json.data;
      setTokens({ accessToken, refreshToken, accessTokenExpiresAt });
      setUser({ email: userEmail, role });

      // Stays visible until the destination's AuthGuard finishes (it hides it)
      showPageLoader('Taking you in…');
      router.push(ROLE_REDIRECT[role] ?? '/');
    } catch {
      setFormError('Could not reach the server. Please try again.');
    }
  }

  return (
    <div className={classes.shell}>
      <BrandPanel />

      <main className={classes.formSide}>
        <Group justify="space-between">
          <Anchor component={Link} href="/" underline="never" c="var(--bp-text-brand)" hiddenFrom="md" aria-label="BusPoint home">
            <Logo size={28} />
          </Anchor>
          <Box visibleFrom="md" />
          <ColorSchemeToggle />
        </Group>

        <div className={classes.formWrap}>
          <Box w="100%" maw={380}>
            <Title order={1} className="font-display" fz="h1">
              Welcome back
            </Title>
            <Text c="dimmed" size="sm" mt={6} mb={28}>
              Sign in to the BusPoint console with the account your school or the BusPoint team set up for you.
            </Text>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack gap="md">
                {formError && (
                  <Alert color="danger" variant="light" icon={<IconAlertCircle size={18} />} role="alert">
                    {formError}
                  </Alert>
                )}
                <TextInput
                  size="md"
                  label="Email"
                  placeholder="you@school.com"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  leftSection={<IconMail size={18} stroke={1.75} />}
                  error={errors.email?.message}
                  disabled={isSubmitting}
                  {...register('email')}
                />
                <PasswordInput
                  size="md"
                  label="Password"
                  placeholder="Your password"
                  autoComplete="current-password"
                  leftSection={<IconLock size={18} stroke={1.75} />}
                  error={errors.password?.message}
                  disabled={isSubmitting}
                  {...register('password')}
                />
                <Button type="submit" size="md" fullWidth mt={4} loading={isSubmitting}>
                  Sign in
                </Button>
              </Stack>
            </form>

            <Group
              gap="sm"
              wrap="nowrap"
              mt={28}
              p="sm"
              style={{
                border: '1px solid var(--mantine-color-default-border)',
                borderRadius: 'var(--mantine-radius-md)',
                background: 'var(--mantine-color-default-hover)',
              }}
            >
              <ThemeIcon variant="light" size={32} radius="md"><IconDeviceMobile size={17} /></ThemeIcon>
              <Text size="xs" c="dimmed">
                Drivers and parents sign in with their phone number in the BusPoint mobile app.
              </Text>
            </Group>
          </Box>
        </div>

        <Group justify="space-between" gap="xs">
          <Text size="xs" c="dimmed">BusPoint by SRFusion</Text>
          <Anchor component={Link} href="/" size="xs" c="dimmed">Back to website</Anchor>
        </Group>
      </main>
    </div>
  );
}
