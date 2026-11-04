import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconInfoCircle } from '@tabler/icons-react';

/** Console-wide toasts (Mantine notifications). */
export const notify = {
  success: (message: string, title?: string) =>
    notifications.show({ color: 'teal', icon: <IconCheck size={18} />, title, message }),
  error: (message: string, title = 'Something went wrong') =>
    notifications.show({ color: 'red', icon: <IconAlertCircle size={18} />, title, message, autoClose: 6000 }),
  info: (message: string, title?: string) =>
    notifications.show({ color: 'brand', icon: <IconInfoCircle size={18} />, title, message }),
};

export const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;
