'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Badge, Box, Button, Card, EmptyState, Grid, Group, NavLink, Radio, SimpleGrid, Skeleton, Stack, Text, TextInput, Title,
} from '@mantine/core';
import { IconAlertCircle, IconCalendarOff, IconCreditCard, IconSchool, IconUsersGroup } from '@tabler/icons-react';
import { api, type SchoolSummary, type SchoolSettings, type PlanSummary } from '@/lib/api';
import { notify, errorMessage } from '@/lib/notify';
import { PageHeader } from '@/components/console/PageHeader';
import { CreatableSelect } from '@/components/console/CreatableSelect';
import { SchoolAvatar, StatusBadge } from '@/components/super-admin/school-ui';

// ─── Schema — keep in sync with backend UpdateSchoolSettingsDto ──────────────
const schema = z.object({
  subscriptionManagedBy: z.enum(['platform', 'school', 'both']),
  planId: z.string().nullable(),
  planExpiresAt: z.string().nullable(),
});
type FormValues = z.infer<typeof schema>;

// ─── Settings sections — add new groups here ─────────────────────────────────
const SECTIONS = [
  { id: 'subscriptions', label: 'Subscriptions', icon: IconCreditCard },
  { id: 'access', label: 'Access', icon: IconCalendarOff },
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
  {
    value: 'both',
    title: 'Both',
    description: 'BusPoint and the school admin both manage parent subscriptions.',
  },
];

/** Convert ISO timestamp to YYYY-MM-DD for <input type="date"> */
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

/** Tomorrow's date as YYYY-MM-DD — the default expiry suggested when a management option is first picked. */
function tomorrowDateInput(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** True if the given YYYY-MM-DD is in the past relative to today */
function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export default function SchoolSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [school, setSchool] = useState<SchoolSummary | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PlanSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subscriptionManagedBy: 'platform', planId: null, planExpiresAt: null },
  });

  const planExpiresAt = watch('planExpiresAt');

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.schools.get(id), api.schools.getSettings(id)])
      .then(([schoolRes, settingsRes]) => {
        if (cancelled) return;
        setSchool(schoolRes.data);
        setAvailablePlans(settingsRes.data.availablePlans ?? []);
        reset({
          subscriptionManagedBy: settingsRes.data.subscriptionManagedBy,
          planId: settingsRes.data.planId ?? null,
          planExpiresAt: toDateInput(settingsRes.data.planExpiresAt),
        });
      })
      .catch((err) => { if (!cancelled) setLoadError(errorMessage(err, 'Failed to load settings')); });
    return () => { cancelled = true; };
  }, [id, reset]);

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        subscriptionManagedBy: values.subscriptionManagedBy,
        planId: values.planId || null,
        planExpiresAt: values.planExpiresAt || null,
      };
      const res = await api.schools.updateSettings(id, payload);
      reset({
        subscriptionManagedBy: res.data.subscriptionManagedBy,
        planId: res.data.planId ?? null,
        planExpiresAt: toDateInput(res.data.planExpiresAt),
      });
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
        actions={
          <>
            <Button variant="default" leftSection={<IconSchool size={16} />} component={Link} href={`/super-admin/schools/${id}/classes`}>
              Manage classes
            </Button>
            <Button variant="default" leftSection={<IconUsersGroup size={16} />} component={Link} href={`/super-admin/schools/${id}/parents`}>
              Manage parents
            </Button>
          </>
        }
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
            <Stack gap="xl">

              {/* ── Subscriptions ── */}
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
                        onChange={(v) => {
                          field.onChange(v as FormValues['subscriptionManagedBy']);
                          // Whichever option is picked, nudge toward an expiry date instead of leaving it blank.
                          if (!planExpiresAt) setValue('planExpiresAt', tomorrowDateInput(), { shouldDirty: true });
                        }}
                        readOnly={loading || isSubmitting}
                      >
                        <SimpleGrid cols={{ base: 1, sm: 3 }} mt="sm">
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
              </Card>

              {/* ── Access ── */}
              <Card id="access" padding="lg">
                <Card.Section withBorder inheritPadding py="md">
                  <Title order={4} fw={600}>Access</Title>
                  <Text size="sm" c="dimmed" mt={2}>
                    Set a plan expiry date. After this date all logins for this school’s users will be blocked
                    with a clear “subscription expired” message. Leave blank to keep the school always active.
                  </Text>
                </Card.Section>

                <Card.Section withBorder inheritPadding py="lg">
                  <Stack gap="lg" maw={360}>
                    <Controller
                      name="planId"
                      control={control}
                      render={({ field }) => (
                        <CreatableSelect
                          label="Plan"
                          description="Which plan this school is on. No restrictions are enforced yet — recorded for future billing."
                          entity="plan"
                          requireName
                          placeholder={availablePlans.length ? 'Unassigned' : 'No plans yet — type a name to create one'}
                          clearable
                          disabled={loading || isSubmitting}
                          data={availablePlans.map((p) => ({
                            value: p.id,
                            label: p.name,
                            description: p.description ?? undefined,
                          }))}
                          value={field.value ?? null}
                          onChange={(v) => field.onChange(v)}
                          onCreate={async (name) => {
                            try {
                              const res = await api.plans.create({ name });
                              setAvailablePlans((prev) => [...prev, res.data]);
                              field.onChange(res.data.id);
                              notify.success(`Plan “${name}” created. Save to apply it.`);
                            } catch (err) {
                              notify.error(errorMessage(err, 'Failed to create plan'));
                            }
                          }}
                        />
                      )}
                    />
                    <TextInput
                      type="date"
                      label="Plan expires on"
                      description="Drivers, parents and school admins cannot log in after this date."
                      disabled={loading || isSubmitting}
                      error={
                        planExpiresAt && isExpired(planExpiresAt)
                          ? 'This date is in the past — this school is currently blocked.'
                          : undefined
                      }
                      {...register('planExpiresAt', {
                        setValueAs: (v: string) => v || null,
                      })}
                    />
                    {planExpiresAt && (
                      <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        w="fit-content"
                        onClick={() => setValue('planExpiresAt', null, { shouldDirty: true })}
                        disabled={isSubmitting}
                      >
                        Clear expiry date
                      </Button>
                    )}
                  </Stack>
                </Card.Section>
              </Card>

              {/* ── Save bar ── */}
              <Card padding="sm">
                <Card.Section inheritPadding py="sm">
                  <Group justify="flex-end">
                    {isDirty && <Badge color="yellow" variant="light" mr="auto">Unsaved changes</Badge>}
                    <Button variant="default" onClick={() => reset()} disabled={!isDirty || isSubmitting}>Discard</Button>
                    <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button>
                  </Group>
                </Card.Section>
              </Card>

            </Stack>
          </form>
        </Grid.Col>
      </Grid>
    </>
  );
}
