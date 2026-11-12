'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Box } from '@mantine/core';
import { loadGoogleMaps } from '@/components/console/AddressAutocomplete';
import type { Presence, TripRoad, TripStop } from '@/lib/tripsApi';
import { decodePolyline } from '@/lib/polyline';
import { usePalette } from '@/theme/usePalette';

export interface MapBus {
  id: string;
  label: string;
  lat: number;
  lng: number;
  presence: Presence;
  heading: number | null;
}

interface Props {
  buses?: MapBus[];
  selectedBusId?: string | null;
  onSelectBus?: (id: string) => void;
  /** Stops of the selected / viewed trip. */
  stops?: TripStop[];
  /** GPS trail (history). */
  trail?: { lat: number; lng: number }[];
  /** Road-following route line from the server (replaces straight lines between stops). */
  road?: TripRoad | null;
  /** Planned road path (no trip running) — drawn blue under the stops. */
  plannedPath?: { lat: number; lng: number }[];
  height?: number | string;
  /** Overlay content (status banners) drawn on top of the map. */
  children?: React.ReactNode;
}

const MOVE_MS = 1200;

/** Glide a marker to its new position instead of jumping (looks like the bus is driving). */
function glide(marker: google.maps.Marker, to: google.maps.LatLngLiteral, anim: Map<google.maps.Marker, number>) {
  const from = marker.getPosition();
  const prev = anim.get(marker);
  if (prev) cancelAnimationFrame(prev);
  if (!from) return marker.setPosition(to);
  const a = { lat: from.lat(), lng: from.lng() };
  // Big jumps (first fix after offline, wrong bus) — no animation.
  if (Math.abs(a.lat - to.lat) > 0.02 || Math.abs(a.lng - to.lng) > 0.02) return marker.setPosition(to);
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / MOVE_MS);
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    marker.setPosition({ lat: a.lat + (to.lat - a.lat) * e, lng: a.lng + (to.lng - a.lng) * e });
    if (k < 1) anim.set(marker, requestAnimationFrame(step));
    else anim.delete(marker);
  };
  anim.set(marker, requestAnimationFrame(step));
}

type Palette = ReturnType<typeof usePalette>['colors'];
const presenceColor = (c: Palette): Record<Presence, string> => ({
  live: c.live.pulse,
  away: c.status.warning.solid,
  offline: c.status.danger.solid,
  not_on_trip: c.status.neutral.solid,
});
const stopColor = (c: Palette) => ({ reached: c.status.success.solid, skipped: c.status.warning.solid, pending: c.live.route }) as const;

/**
 * Google map for live buses + a trip's stops / trail.
 * Map + markers are created once and only MOVED on updates (no full redraw per poll).
 */
export function TripsMap({ buses = [], selectedBusId, onSelectBus, stops = [], trail = [], road = null, plannedPath, height = 460, children }: Props) {
  const el = useRef<HTMLDivElement | null>(null);
  const map = useRef<google.maps.Map | null>(null);
  const busMarkers = useRef(new Map<string, google.maps.Marker>());
  const stopMarkers = useRef<google.maps.Marker[]>([]);
  const lines = useRef<google.maps.Polyline[]>([]);
  const roadLines = useRef<google.maps.Polyline[]>([]);
  const anims = useRef(new Map<google.maps.Marker, number>());
  const fittedKey = useRef<string>('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const { colors: c, mapStyle, scheme } = usePalette();
  const onSelect = useRef(onSelectBus);
  useEffect(() => {
    onSelect.current = onSelectBus;
  }, [onSelectBus]);

  useEffect(() => {
    let alive = true;
    void loadGoogleMaps().then((ok) => {
      if (!alive) return;
      if (!ok || !el.current) return setStatus('unavailable');
      map.current = new google.maps.Map(el.current, {
        // No hard-coded city: fitBounds() frames the school's data as soon as it loads.
        center: { lat: 0, lng: 0 },
        zoom: 2,
        styles: mapStyle,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        clickableIcons: false,
      });
      setStatus('ready');
    });
    return () => {
      alive = false;
    };
  }, []);

  // Brand map style follows light/dark.
  useEffect(() => {
    if (status === 'ready') map.current?.setOptions({ styles: mapStyle });
  }, [mapStyle, status]);

  // Bus markers: create / move / remove.
  useEffect(() => {
    const m = map.current;
    if (status !== 'ready' || !m) return;
    const seen = new Set<string>();
    for (const b of buses) {
      seen.add(b.id);
      const icon: google.maps.Symbol = {
        path: b.heading != null ? google.maps.SymbolPath.FORWARD_CLOSED_ARROW : google.maps.SymbolPath.CIRCLE,
        rotation: b.heading ?? 0,
        scale: b.id === selectedBusId ? 8 : 6,
        fillColor: presenceColor(c)[b.presence],
        fillOpacity: b.presence === 'offline' ? 0.55 : 1,
        strokeColor: c.live.markerRing,
        strokeWeight: 2,
      };
      let marker = busMarkers.current.get(b.id);
      if (!marker) {
        marker = new google.maps.Marker({ map: m, zIndex: 10 });
        marker.addListener('click', () => onSelect.current?.(b.id));
        busMarkers.current.set(b.id, marker);
      }
      glide(marker, { lat: b.lat, lng: b.lng }, anims.current);
      marker.setIcon(icon);
      marker.setTitle(b.label);
      marker.setLabel(b.id === selectedBusId ? { text: b.label, color: c.text.primary, fontSize: '12px', fontWeight: '700', className: 'trips-map-label' } : null);
    }
    for (const [id, marker] of busMarkers.current) {
      if (!seen.has(id)) {
        marker.setMap(null);
        busMarkers.current.delete(id);
      }
    }
  }, [buses, selectedBusId, status, c]);

  // Stops + route line + trail (redrawn only when they change).
  const hasRoad = !!(road?.passed || road?.ahead) || (plannedPath?.length ?? 0) > 1;
  const stopsKey = stops.map((s) => `${s.id}:${s.status}`).join('|') + `#${trail.length}`;
  useEffect(() => {
    const m = map.current;
    if (status !== 'ready' || !m) return;
    stopMarkers.current.forEach((x) => x.setMap(null));
    lines.current.forEach((x) => x.setMap(null));
    stopMarkers.current = stops.map(
      (s) =>
        new google.maps.Marker({
          map: m,
          position: { lat: s.lat, lng: s.lng },
          title: `${s.seq + 1}. ${s.name} (${s.status})`,
          label: { text: s.kind === 'school' ? 'S' : String(s.seq + 1), color: c.text.onBrand, fontSize: '11px', fontWeight: '700' },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: s.kind === 'school' ? 11 : 9,
            fillColor: s.kind === 'school' ? c.live.school : stopColor(c)[s.status],
            fillOpacity: 1,
            strokeColor: c.live.markerRing,
            strokeWeight: 2,
          },
          zIndex: 5,
        }),
    );
    if (stops.length > 1 && !hasRoad) {
      lines.current.push(
        new google.maps.Polyline({ map: m, path: stops.map((s) => ({ lat: s.lat, lng: s.lng })), strokeColor: c.live.route, strokeOpacity: 0.35, strokeWeight: 4, clickable: false }),
      );
    }
    if (trail.length > 1) {
      lines.current.push(new google.maps.Polyline({ map: m, path: trail, strokeColor: c.live.route, strokeOpacity: 0.9, strokeWeight: 4, clickable: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsKey, status, hasRoad, scheme]);

  // Road-following line: passed (green) + ahead (blue), split at the bus. With a GPS trail (history),
  // the planned road is drawn faint underneath the actual trail.
  const roadKey = `${road?.passed ?? ''}|${road?.ahead ?? ''}|${trail.length > 0}|${plannedPath?.length ?? 0}:${plannedPath?.[0]?.lat ?? ''}`;
  useEffect(() => {
    const m = map.current;
    if (status !== 'ready' || !m) return;
    roadLines.current.forEach((x) => x.setMap(null));
    roadLines.current = [];
    if (!hasRoad) return;
    const passed = decodePolyline(road?.passed);
    const ahead = road?.passed || road?.ahead ? decodePolyline(road?.ahead) : plannedPath ?? [];
    const line = (path: { lat: number; lng: number }[], color: string, opacity: number) =>
      path.length > 1 &&
      roadLines.current.push(new google.maps.Polyline({ map: m, path, strokeColor: color, strokeOpacity: opacity, strokeWeight: 5, clickable: false, zIndex: 2 }));
    if (trail.length > 0) {
      line([...passed, ...ahead], c.live.route, 0.35);
    } else {
      line(passed, c.live.routeTravelled, 0.9);
      line(ahead, c.live.route, 0.95);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadKey, status, scheme]);

  // Fit bounds when the selection / data set changes (not on every poll).
  const fitKey = `${selectedBusId ?? ''}|${stops.map((s) => s.id).join(',')}|${buses.length}|${trail.length > 0}`;
  useEffect(() => {
    const m = map.current;
    if (status !== 'ready' || !m || fittedKey.current === fitKey) return;
    const pts = [...stops, ...trail, ...(selectedBusId ? buses.filter((b) => b.id === selectedBusId) : buses)];
    if (!pts.length) return;
    const bounds = new google.maps.LatLngBounds();
    pts.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    m.fitBounds(bounds, 48);
    if (pts.length === 1) m.setZoom(15);
    fittedKey.current = fitKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, status]);

  return (
    <Box pos="relative" h={height} style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}>
      <div ref={el} style={{ position: 'absolute', inset: 0 }} />
      {status === 'unavailable' && (
        <Alert color="warning" m="md" title="Map unavailable">
          The map couldn’t load right now. Everything is still listed below.
        </Alert>
      )}
      {children}
    </Box>
  );
}
