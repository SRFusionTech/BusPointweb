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
import {
  IconAlertCircle, IconBellRinging, IconBus, IconDeviceMobile, IconLock, IconMail, IconMapPin,
  IconShieldCheck,
} from '@tabler/icons-react';
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});
type FormValues = z.infer<typeof schema>;

// Illustrative trip shown on the brand panel
const DEMO_STOPS = [
  { name: 'Ameerpet', note: 'Picked up 6 students', time: '7:10', state: 'done' },
  { name: 'SR Nagar', note: 'Picked up 4 students', time: '7:18', state: 'done' },
  { name: 'Erragadda', note: 'Arriving in 2 min', time: '7:24', state: 'current' },
  { name: 'Bharat Nagar', note: 'Parents notified', time: '7:31', state: 'next' },
  { name: 'School', note: 'Expected on time', time: '7:55', state: 'next' },
] as const;

const FEATURES = [
  { icon: IconMapPin, title: 'Live GPS tracking', text: 'See every bus on the map as it moves.' },
  { icon: IconBellRinging, title: 'Stop-by-stop alerts', text: 'Parents are notified before the bus reaches them.' },
  { icon: IconShieldCheck, title: 'Built for schools', text: 'Separate access for admins, drivers and parents.' },
];

function BrandMark({ inverted }: { inverted?: boolean }) {
  return (
    <Group gap="xs" wrap="nowrap">
      <ThemeIcon size={34} radius="md" variant={inverted ? 'white' : 'filled'}>
        <IconBus size={19} />
      </ThemeIcon>
      <Text fw={700} size="lg" c={inverted ? 'white' : undefined}>BusPoint</Text>
    </Group>
  );
}

function BrandPanel() {
  return (
    <aside className={classes.brand} aria-hidden="true">
      <div className={classes.brandInner}>
        <BrandMark inverted />

        <Stack gap="xl">
          <Box>
            <h1 className={classes.headline}>
              Every school bus,<br /><span>live on one screen.</span>
            </h1>
            <Text c="rgba(255,255,255,0.7)" size="md" mt="md" maw={440}>
              Plan routes, assign drivers and keep parents informed — from the first stop to the school gate.
            </Text>
          </Box>

          <div className={classes.glass}>
            <Group justify="space-between" mb="md">
              <div>
                <Text size="sm" fw={600} c="white">Route A · Morning</Text>
                <Text size="xs" c="rgba(255,255,255,0.6)">Bus 4 · TS 09 AB 1234</Text>
              </div>
              <Group gap={8} wrap="nowrap">
                <span className={classes.pulse} />
                <Text size="xs" fw={600} c="#86efac">Live</Text>
              </Group>
            </Group>
            {DEMO_STOPS.map((s, i) => (
              <div key={s.name} className={classes.stop}>
                <div className={classes.rail}>
                  <span className={classes.dot} data-state={s.state} />
                  {i < DEMO_STOPS.length - 1 && <span className={classes.line} data-done={s.state === 'done'} />}
                </div>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={s.state === 'current' ? 600 : 500} c={s.state === 'next' ? 'rgba(255,255,255,0.75)' : 'white'}>
                    {s.name}
                  </Text>
                  <Text size="xs" c={s.state === 'current' ? '#86efac' : 'rgba(255,255,255,0.5)'}>{s.note}</Text>
                </Box>
                <Text size="xs" c="rgba(255,255,255,0.55)" ff="monospace">{s.time}</Text>
              </div>
            ))}
          </div>
        </Stack>

        <Stack gap="md">
          {FEATURES.map((f) => (
            <div key={f.title} className={classes.feature}>
              <span className={classes.featureIcon}><f.icon size={17} stroke={1.75} /></span>
              <div>
                <Text size="sm" fw={600} c="white">{f.title}</Text>
                <Text size="xs" c="rgba(255,255,255,0.6)">{f.text}</Text>
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
    <div className={classes.shell}>
      <BrandPanel />

      <main className={classes.formSide}>
        <Group justify="space-between">
          <Anchor component={Link} href="/" underline="never" c="inherit" hiddenFrom="md">
            <BrandMark />
          </Anchor>
          <Box visibleFrom="md" />
          <ColorSchemeToggle />
        </Group>

        <div className={classes.formWrap}>
          <Box w="100%" maw={380}>
            <Title order={1} fz={28} fw={700} style={{ letterSpacing: '-0.02em' }}>Sign in</Title>
            <Text c="dimmed" size="sm" mt={6} mb={28}>
              Welcome back. Use the account your school or the BusPoint team set up for you.
            </Text>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack gap="md">
                {formError && (
                  <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />} role="alert">
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
          <Text size="xs" c="dimmed">© BusPoint by SRFusion</Text>
          <Anchor component={Link} href="/" size="xs" c="dimmed">Back to website</Anchor>
        </Group>
      </main>
    </div>
  );
}
