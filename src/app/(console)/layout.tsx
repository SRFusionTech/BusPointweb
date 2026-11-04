import '@mantine/core/styles.layer.css';
import '@mantine/notifications/styles.layer.css';
import '@mantine/spotlight/styles.layer.css';
import '@mantine/nprogress/styles.layer.css';
import './console.css';
import { ConsoleProviders } from './providers';

/** Login + school-admin + super-admin. Mantine only — no Tailwind here. */
export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleProviders>{children}</ConsoleProviders>;
}
