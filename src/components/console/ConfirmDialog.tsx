'use client';

import { useState, type ReactNode } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';

export function ConfirmDialog({
  opened, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger,
}: {
  opened: boolean;
  onClose: () => void;
  /** Should handle its own errors; the dialog closes when it resolves. */
  onConfirm: () => Promise<void>;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>{title}</Text>}
      size="sm"
      closeOnClickOutside={!busy}
      closeOnEscape={!busy}
    >
      <Stack gap="lg">
        <Text size="sm" c="dimmed">{message}</Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button color={danger ? 'red' : undefined} onClick={handleConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
