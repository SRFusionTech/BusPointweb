'use client';

import { Loader, Overlay, Stack, Text } from '@mantine/core';
import { useUiStore } from '@/stores/ui.store';

export function PageLoader() {
  const message = useUiStore((s) => s.pageLoader);
  if (!message) return null;

  return (
    <Overlay fixed zIndex={1000} blur={4} backgroundOpacity={0.6} color="var(--mantine-color-body)" center>
      <Stack align="center" gap="sm" role="status" aria-live="polite">
        <Loader size="lg" />
        <Text fw={600} size="lg">BusPoint</Text>
        <Text c="dimmed" size="sm">{message}</Text>
      </Stack>
    </Overlay>
  );
}
