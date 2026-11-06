'use client';

import { useEffect, useState } from 'react';
import { Select, SimpleGrid } from '@mantine/core';
import type { RouteStop, RouteSummary } from '@/lib/api';

interface PickupPointSelectProps {
  routes: RouteSummary[];
  getStops: (routeId: string) => Promise<RouteStop[]>;
  routeId: string | null;
  onRouteChange: (routeId: string | null) => void;
  stopId: string | null;
  onStopChange: (stopId: string | null) => void;
  disabled?: boolean;
  error?: string;
}

/** Route + pickup-point pair, used when assigning a parent's bus stop. */
export function PickupPointSelect({
  routes, getStops, routeId, onRouteChange, stopId, onStopChange, disabled, error,
}: PickupPointSelectProps) {
  // Keyed by the route it was fetched for, so loading/empty states are derived rather than
  // toggled synchronously in the effect (and a late response for an old route is never shown).
  const [stopsData, setStopsData] = useState<{ routeId: string; stops: RouteStop[] } | null>(null);

  useEffect(() => {
    if (!routeId) return;
    let cancelled = false;
    getStops(routeId)
      .then((all) => { if (!cancelled) setStopsData({ routeId, stops: all.filter((s) => s.kind === 'stop') }); })
      .catch(() => { if (!cancelled) setStopsData({ routeId, stops: [] }); });
    return () => { cancelled = true; };
  }, [routeId, getStops]);

  const visibleStops = routeId && stopsData?.routeId === routeId ? stopsData.stops : [];
  const loadingStops = routeId !== null && stopsData?.routeId !== routeId;

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" verticalSpacing="sm">
      <Select
        label="Route"
        placeholder={routes.length ? 'Select a route' : 'No routes yet'}
        withAsterisk
        searchable
        data={routes.map((r) => ({ value: r.id, label: r.name }))}
        value={routeId}
        onChange={(v) => { onRouteChange(v); onStopChange(null); }}
        disabled={disabled || routes.length === 0}
      />
      <Select
        label="Pickup point"
        placeholder={
          !routeId ? 'Select a route first'
            : loadingStops ? 'Loading stops…'
            : visibleStops.length ? 'Select a pickup point'
            : 'This route has no pickup points yet'
        }
        withAsterisk
        searchable
        data={visibleStops.map((s) => ({ value: s.id, label: s.name }))}
        value={stopId}
        onChange={onStopChange}
        disabled={disabled || !routeId || loadingStops || visibleStops.length === 0}
        error={error}
      />
    </SimpleGrid>
  );
}
