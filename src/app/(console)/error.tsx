'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, Center, Group, Stack, Text, Title } from '@mantine/core';
import { LogoMark } from '@/components/brand/Logo';

/** Console crash screen — the shell stays usable, the user gets a way back. */
export default function ConsoleError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Center mih="70dvh" p="xl">
      <Stack align="center" gap="sm" maw={440} ta="center">
        <span style={{ color: 'var(--bp-text-brand)', display: 'inline-flex' }}>
          <LogoMark size={48} />
        </span>
        <Title order={1} className="font-display" fz="h2" mt="md">
          Something went wrong
        </Title>
        <Text c="dimmed">This page hit an unexpected problem. Your data is safe — try again, or head back to the overview.</Text>
        <Group mt="md">
          <Button onClick={() => retry()}>Try again</Button>
          <Button component={Link} href="/login" variant="default">
            Back to the console
          </Button>
        </Group>
      </Stack>
    </Center>
  );
}
