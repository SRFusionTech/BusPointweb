'use client';

import { useEffect, useRef } from 'react';

import { onDashboardSync } from '@/lib/dashboardSync';

interface DashboardRefreshOptions {
  intervalMs?: number;
  enabled?: boolean;
}

export function useDashboardAutoRefresh(
  refresh: () => Promise<unknown> | unknown,
  options: DashboardRefreshOptions = {},
) {
  const refreshRef = useRef(refresh);
  const inFlightRef = useRef(false);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined' || options.enabled === false) return;

    const triggerRefresh = () => {
      if (inFlightRef.current) return;
      try {
        const result = refreshRef.current();
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          inFlightRef.current = true;
          Promise.resolve(result).finally(() => {
            inFlightRef.current = false;
          });
        }
      } catch {
        inFlightRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerRefresh();
      }
    };

    const handleFocus = () => {
      triggerRefresh();
    };

    const stopSync = onDashboardSync(triggerRefresh);
    const interval =
      options.intervalMs && options.intervalMs > 0
        ? window.setInterval(triggerRefresh, options.intervalMs)
        : null;

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (interval) window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopSync();
    };
  }, [options.enabled, options.intervalMs]);
}
