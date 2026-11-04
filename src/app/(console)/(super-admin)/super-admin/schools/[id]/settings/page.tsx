'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Badge, Box, Button, Card, EmptyState, Grid, Group, NavLink, Radio, SimpleGrid, Skeleton, Text, Title,
} from '@mantine/core';
import { IconAlertCircle, IconCreditCard } from '@tabler/icons-react';
import { api, type SchoolSummary, type SchoolSettings } from '@/lib/api';
import { notify, errorMessage } from '@/lib/notify';
import { PageHeader } from '@/components/console/PageHeader';
import { SchoolAvatar, StatusBadge } from '@/components/super-admin/school-ui';

// ─── Schema — keep in sync with backend UpdateSchoolSettingsDto ──────────────
const schema = z.object({
  subscriptionManagedBy: z.enum(['platform', 'school']),
});
type FormValues = z.infer<typeof schema>;

// ─── Settings sections — add new groups here ─────────────────────────────────
const SECTIONS = [
  { id: 'subscriptions', label: 'Subscriptions', icon: IconCreditCard },
] as const;

const SUBSCRIPTION_OPTIONS: Array<{ value: SchoolSettings['subscriptionManagedBy']; title: string; description: string }> = [
  {
    value: 'platform',
    title: 'BusPoint (platform)',
    description: 'BusPoint owns parent subscriptions for this school — plans, renewals and payment collection.',
  },
  {
    value: 'school',
    title: 'School',
    description: 'The school admin owns parent subscriptions — plans, renewals and payment collection.',
  },
];

export default function SchoolSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [school, setSchool] = useState<SchoolSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subscriptionManagedBy: 'platform' },
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.schools.get(id), api.schools.getSettings(id)])
      .then(([schoolRes, settingsRes]) => {
        if (cancelled) return;
        setSchool(schoolRes.data);
        reset(settingsRes.data); // loaded values become the "clean" baseline
      })
      .catch((err) => { if (!cancelled) setLoadError(errorMessage(err, 'Failed to load settings')); });
    return () => { cancelled = true; };
  }, [id, reset]);

  async function onSubmit(values: FormValues) {
    try {
      const res = await api.schools.updateSettings(id, values);
      reset(res.data);
      notify.success('Settings saved.');
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to save settings'));
    }
  }

  if (loadError) {
    return (
      <Card>
        <EmptyState
          py={48}
          icon={<IconAlertCircle size={26} stroke={1.5} />}
          title="Couldn't load this school"
          description={loadError}
        >
          <Button mt="md" variant="default" component={Link} href="/super-admin/schools">Back to schools</Button>
        </EmptyState>
      </Card>
    );
  }

  const loading = !school;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Schools', href: '/super-admin/schools' },
          { label: school?.name ?? '…' },
          { label: 'Settings' },
        ]}
        leading={loading ? <Skeleton h={48} w={48} radius="md" /> : <SchoolAvatar school={school} size={48} />}
        title={
          loading ? (
            <Skeleton h={28} w={220} />
          ) : (
            <Group gap="sm">
              <Title order={2} fw={600}>{school.name}</Title>
              <StatusBadge active={school.isActive} />
            </Group>
          )
        }
        description={loading ? <Skeleton h={12} maw={320} mt={6} /> : school.address}
      />

      <Grid gap="xl">
        {/* Section nav */}
        <Grid.Col span={{ base: 12, md: 3 }} visibleFrom="md">
          <Box>
            {SECTIONS.map((s) => (
              <NavLink
                key={s.id}
                href={`#${s.id}`}
                label={s.label}
                leftSection={<s.icon size={18} stroke={1.75} />}
                active
                variant="light"
              />
            ))}
          </Box>
        </Grid.Col>

        {/* Sections */}
        <Grid.Col span={{ base: 12, md: 9 }}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Card id="subscriptions" padding="lg">
              <Card.Section withBorder inheritPadding py="md">
                <Title order={4} fw={600}>Subscriptions</Title>
                <Text size="sm" c="dimmed" mt={2}>Choose who manages parent subscriptions for this school.</Text>
              </Card.Section>

              <Card.Section withBorder inheritPadding py="lg">
                <Controller
                  name="subscriptionManagedBy"
                  control={control}
                  render={({ field }) => (
                    <Radio.Group
                      label="Managed by"
                      value={field.value}
                      onChange={(v) => field.onChange(v as FormValues['subscriptionManagedBy'])}
                      readOnly={loading || isSubmitting}
                    >
                      <SimpleGrid cols={{ base: 1, sm: 2 }} mt="sm">
                        {SUBSCRIPTION_OPTIONS.map((opt) => (
                          <Radio.Card key={opt.value} value={opt.value} p="md" radius="md" disabled={loading || isSubmitting}>
                            <Group wrap="nowrap" align="flex-start" gap="sm">
                              <Radio.Indicator mt={2} />
                              <div>
                                <Text fw={500} size="sm">{opt.title}</Text>
                                <Text size="xs" c="dimmed" mt={4} lh={1.5}>{opt.description}</Text>
                              </div>
                            </Group>
                          </Radio.Card>
                        ))}
                      </SimpleGrid>
                    </Radio.Group>
                  )}
                />
              </Card.Section>

              {/* Save bar */}
              <Card.Section withBorder inheritPadding py="sm">
                <Group justify="flex-end">
                  {isDirty && <Badge color="yellow" variant="light" mr="auto">Unsaved changes</Badge>}
                  <Button variant="default" onClick={() => reset()} disabled={!isDirty || isSubmitting}>Discard</Button>
                  <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button>
                </Group>
              </Card.Section>
            </Card>
          </form>
        </Grid.Col>
      </Grid>
    </>
  );
}
