'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ActionIcon, Button, CopyButton, Divider, em, Group, Modal, SimpleGrid, Stack, Text, TextInput, Tooltip,
} from '@mantine/core';
import { CreatableSelect } from '@/components/console/CreatableSelect';
import { useMediaQuery } from '@mantine/hooks';
import { IconCheck, IconCopy, IconRefresh } from '@tabler/icons-react';
import { api, type PlanSummary } from '@/lib/api';
import { notify, errorMessage } from '@/lib/notify';
import { AddressAutocomplete } from '@/components/console/AddressAutocomplete';

// ─── Schema — mirrors backend CreateSchoolDto ────────────────────────────────
const schema = z.object({
  name:          z.string().trim().min(2, 'School name is required'),
  address:       z.string().trim().min(5, 'Pick the school address from the suggestions'),
  lat:           z.number().nullable().optional(),
  lng:           z.number().nullable().optional(),
  logoUrl:       z.string().trim().url('Enter a valid URL').or(z.literal('')).optional(),
  planId:        z.string().nullable().optional(),
  adminName:     z.string().trim().min(2, 'Admin name is required'),
  adminPhone:    z.string().trim().min(1, 'Phone number is required'),
  adminEmail:    z.string().trim().email('Enter a valid email address'),
  adminPassword: z.string().min(8, 'Generate a password first'),
});
type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  name: '', address: '', lat: null, lng: null, logoUrl: '', planId: null, adminName: '', adminPhone: '', adminEmail: '', adminPassword: '',
};

function generatePassword(): string {
  const words = ['School', 'Admin', 'BusPoint', 'Access', 'Portal'];
  const symbols = ['@', '#', '!', '$'];
  const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
  return pick(words) + String(Math.floor(1000 + Math.random() * 9000)) + pick(symbols);
}

interface Props {
  opened: boolean;
  onClose: () => void;
  onCreated: () => void;
  plans?: PlanSummary[];
}

export function AddSchoolModal({ opened, onClose, onCreated, plans = [] }: Props) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  const password = watch('adminPassword');

  // Plans created from inside this modal, until the parent's list is reloaded
  const [createdPlans, setCreatedPlans] = useState<PlanSummary[]>([]);
  const planOptions = [...plans, ...createdPlans.filter((c) => !plans.some((p) => p.id === c.id))]
    .filter((p) => p.isActive)
    .map((p) => ({ value: p.id, label: p.name, description: p.description ?? undefined }));
  // Full-screen on phones (below Mantine's `sm` breakpoint, 48em)
  const isPhone = useMediaQuery(`(max-width: ${em(767)})`);

  // Fresh form (with a generated password) every time the modal opens
  useEffect(() => {
    if (opened) reset({ ...EMPTY, adminPassword: generatePassword() });
  }, [opened, reset]);

  function handleRegenerate() {
    setValue('adminPassword', generatePassword(), { shouldValidate: true });
  }

  async function onSubmit(data: FormValues) {
    try {
      await api.schools.create({
        name: data.name,
        address: data.address,
        lat: data.lat ?? undefined,
        lng: data.lng ?? undefined,
        logoUrl: data.logoUrl || undefined,
        planId: data.planId || undefined,
        adminEmail: data.adminEmail.toLowerCase(),
        adminPassword: data.adminPassword,
        adminName: data.adminName,
        adminPhone: data.adminPhone,
      });
      notify.success(`${data.name} is ready. Share the admin password now — it won't be shown again.`, 'School created');
      onCreated();
      onClose();
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to create school'));
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600} size="lg">Add school</Text>}
      size="lg"
      fullScreen={isPhone}
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          <Divider label="School details" labelPosition="left" />
          <TextInput
            label="School name"
            placeholder="Sunrise Public School"
            withAsterisk
            data-autofocus
            disabled={isSubmitting}
            error={errors.name?.message}
            {...register('name')}
          />
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <AddressAutocomplete
                label="Address"
                withAsterisk
                value={field.value}
                onChange={(address) => {
                  field.onChange(address);
                  // Typing after a pick invalidates its coordinates
                  setValue('lat', null);
                  setValue('lng', null);
                }}
                onPlaceSelect={(place) => {
                  setValue('lat', place.lat);
                  setValue('lng', place.lng);
                }}
                disabled={isSubmitting}
                error={errors.address?.message}
              />
            )}
          />
          <TextInput
            label="Logo URL"
            description="Optional"
            placeholder="https://school.com/logo.png"
            type="url"
            disabled={isSubmitting}
            error={errors.logoUrl?.message}
            {...register('logoUrl')}
          />
          <Controller
            name="planId"
            control={control}
            render={({ field }) => (
              <CreatableSelect
                label="Plan"
                description="Assign the school to a subscription plan."
                entity="plan"
                requireName
                placeholder={planOptions.length ? 'Search or create a plan' : 'No plans yet — type a name to create one'}
                clearable
                disabled={isSubmitting}
                data={planOptions}
                value={field.value ?? null}
                onChange={field.onChange}
                onCreate={async (name) => {
                  try {
                    const res = await api.plans.create({ name });
                    setCreatedPlans((prev) => [...prev, res.data]);
                    field.onChange(res.data.id);
                    notify.success(`Plan “${name}” created.`);
                  } catch (err) {
                    notify.error(errorMessage(err, 'Failed to create plan'));
                  }
                }}
              />
            )}
          />

          <Divider label="Admin account" labelPosition="left" mt="xs" />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Admin name"
              placeholder="Ravi Kumar"
              withAsterisk
              disabled={isSubmitting}
              error={errors.adminName?.message}
              {...register('adminName')}
            />
            <TextInput
              label="Phone number"
              placeholder="+91 98765 43210"
              type="tel"
              withAsterisk
              disabled={isSubmitting}
              error={errors.adminPhone?.message}
              {...register('adminPhone')}
            />
          </SimpleGrid>
          <TextInput
            label="Email address"
            placeholder="admin@school.com"
            type="email"
            withAsterisk
            disabled={isSubmitting}
            error={errors.adminEmail?.message}
            {...register('adminEmail')}
          />
          <TextInput
            label="Temporary password"
            description="Generated automatically. Copy it and share it with the admin."
            withAsterisk
            readOnly
            error={errors.adminPassword?.message}
            rightSectionWidth={68}
            rightSection={
              <Group gap={2} wrap="nowrap">
                <Tooltip label="Generate new">
                  <ActionIcon variant="subtle" color="gray" onClick={handleRegenerate} disabled={isSubmitting} aria-label="Generate new password">
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Tooltip>
                <CopyButton value={password} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied' : 'Copy'}>
                      <ActionIcon variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy} aria-label="Copy password">
                        {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            }
            {...register('adminPassword')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create school</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
