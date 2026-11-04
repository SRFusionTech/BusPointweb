'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, Group, PasswordInput, Stack } from '@mantine/core';
import { api } from '@/lib/api';
import { notify, errorMessage } from '@/lib/notify';
import { PageHeader } from '@/components/console/PageHeader';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    try {
      await api.auth.changePassword(data.currentPassword, data.newPassword);
      notify.success('Your password has been updated.', 'Password changed');
      reset();
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to change password'));
    }
  }

  return (
    <>
      <PageHeader title="Change password" description="Choose a strong password you don't use elsewhere." />
      <Card maw={480} padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack>
            <PasswordInput
              label="Current password"
              autoComplete="current-password"
              withAsterisk
              disabled={isSubmitting}
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <PasswordInput
              label="New password"
              description="Min 8 characters, one uppercase letter, one number."
              autoComplete="new-password"
              withAsterisk
              disabled={isSubmitting}
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              withAsterisk
              disabled={isSubmitting}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Group justify="flex-end" mt="xs">
              <Button type="submit" loading={isSubmitting}>Update password</Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </>
  );
}
