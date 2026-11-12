'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@mantine/core';
import { api } from '@/lib/api';
import { dashboardBus } from '@/lib/dashboardBus';

/** Live count next to a sidebar item (e.g. new demo requests). Polls every 60 s and on change events. */
export function NavBadge({ kind }: { kind: 'demoRequests' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () =>
      api.demoRequests
        .stats()
        .then((r) => alive && setCount(r.data.byStatus.new ?? 0))
        .catch(() => undefined);
    void load();
    const id = setInterval(load, 60_000);
    const off = dashboardBus.on(kind, load);
    return () => {
      alive = false;
      clearInterval(id);
      off();
    };
  }, [kind]);
  if (!count) return null;
  return (
    <Badge size="sm" color="teal" variant="filled" circle={count < 10} aria-label={`${count} new`}>
      {count > 99 ? '99+' : count}
    </Badge>
  );
}
