'use client';

import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { mantineTheme, COLOR_SCHEME_STORAGE_KEY } from '@/theme/mantine-theme';
import { PageLoader } from '@/components/console/PageLoader';

const colorSchemeManager = localStorageColorSchemeManager({ key: COLOR_SCHEME_STORAGE_KEY });

export function ConsoleProviders({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={mantineTheme} colorSchemeManager={colorSchemeManager} defaultColorScheme="light">
      <Notifications position="top-right" limit={4} />
      <PageLoader />
      {children}
    </MantineProvider>
  );
}
