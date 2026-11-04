'use client';

import { useState } from 'react';
import { Alert, Button, Code, CopyButton, DataList, Group, Modal, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { api, type SchoolSummary } from '@/lib/api';
import { notify, errorMessage } from '@/lib/notify';

interface Props {
  school: SchoolSummary | null;
  onClose: () => void;
}

export function ResetPasswordModal({ school, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  function close() {
    setResult(null); // next school starts on the confirm step
    onClose();
  }

  async function handleReset() {
    if (!school) return;
    setLoading(true);
    try {
      const res = await api.schools.resetAdminPassword(school.id);
      setResult(res.data);
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to reset password'));
      close();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      opened={!!school}
      onClose={close}
      title={<Text fw={600} size="lg">Reset admin password</Text>}
      closeOnClickOutside={!loading && !result}
    >
      {result ? (
        <Stack>
          <Alert color="yellow" variant="light" icon={<IconAlertTriangle size={18} />}>
            Share this password with the school admin now. It won&apos;t be shown again.
          </Alert>
          <DataList withDivider>
            <DataList.Item>
              <DataList.ItemLabel>Admin email</DataList.ItemLabel>
              <DataList.ItemValue>{result.email}</DataList.ItemValue>
            </DataList.Item>
            <DataList.Item>
              <DataList.ItemLabel>Temporary password</DataList.ItemLabel>
              <DataList.ItemValue><Code fz="md" fw={700}>{result.tempPassword}</Code></DataList.ItemValue>
            </DataList.Item>
          </DataList>
          <Group justify="flex-end">
            <CopyButton value={result.tempPassword}>
              {({ copied, copy }) => (
                <Button variant="default" color={copied ? 'teal' : undefined} onClick={copy}>
                  {copied ? 'Copied' : 'Copy password'}
                </Button>
              )}
            </CopyButton>
            <Button onClick={close}>Done</Button>
          </Group>
        </Stack>
      ) : (
        <Stack>
          <Text size="sm" c="dimmed">
            A new temporary password will be generated for the admin of{' '}
            <Text span fw={600} c="var(--mantine-color-text)">{school?.name}</Text>. Their current password will stop working immediately.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={close} disabled={loading}>Cancel</Button>
            <Button color="red" onClick={handleReset} loading={loading}>Reset password</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
