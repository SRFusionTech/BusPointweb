'use client';

import { Suspense } from 'react';
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { mantineTheme, cssVariablesResolver, COLOR_SCHEME_STORAGE_KEY } from '@/theme/mantine-theme';
import { PageLoader } from '@/components/console/PageLoader';
import { RouteProgress } from '@/components/console/RouteProgress';

const colorSchemeManager = localStorageColorSchemeManager({ key: COLOR_SCHEME_STORAGE_KEY });

export function ConsoleProviders({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider
      theme={mantineTheme}
      cssVariablesResolver={cssVariablesResolver}
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme="light"
    >
      {/* usePathname() must sit under Suspense or it blocks prerendering (cacheComponents) */}
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      <Notifications position="top-right" limit={4} />
      <PageLoader />
      {children}
    </MantineProvider>
  );
}
