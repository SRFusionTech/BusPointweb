'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { NavigationProgress, nprogress } from '@mantine/nprogress';

/**
 * Top progress bar for client-side navigation. The App Router has no
 * route-change events, so: start on any internal link click, finish when
 * the pathname changes.
 */
export function RouteProgress() {
  const pathname = usePathname();

  useEffect(() => { nprogress.complete(); }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (!(a instanceof HTMLAnchorElement) || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin === location.origin && url.pathname !== location.pathname) nprogress.start();
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return <NavigationProgress size={2} />;
}
