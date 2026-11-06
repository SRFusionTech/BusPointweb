'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Box } from '@mantine/core';
import { loadGoogleMaps } from '@/components/console/AddressAutocomplete';
import type { Presence, TripRoad, TripStop } from '@/lib/tripsApi';
import { decodePolyline } from '@/lib/polyline';

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
  height?: number | string;
}

const PRESENCE_COLOR: Record<Presence, string> = { live: '#16a34a', away: '#f59e0b', offline: '#dc2626', not_on_trip: '#94a3b8' };
const STOP_COLOR = { reached: '#16a34a', skipped: '#f59e0b', pending: '#2563eb' } as const;

/**
 * Google map for live buses + a trip's stops / trail.
 * Map + markers are created once and only MOVED on updates (no full redraw per poll).
 */
export function TripsMap({ buses = [], selectedBusId, onSelectBus, stops = [], trail = [], road = null, height = 460 }: Props) {
  const el = useRef<HTMLDivElement | null>(null);
  const map = useRef<google.maps.Map | null>(null);
  const busMarkers = useRef(new Map<string, google.maps.Marker>());
  const stopMarkers = useRef<google.maps.Marker[]>([]);
  const lines = useRef<google.maps.Polyline[]>([]);
  const roadLines = useRef<google.maps.Polyline[]>([]);
  const fittedKey = useRef<string>('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
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
        center: { lat: 17.385, lng: 78.4867 },
        zoom: 12,
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
        fillColor: PRESENCE_COLOR[b.presence],
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      };
      let marker = busMarkers.current.get(b.id);
      if (!marker) {
        marker = new google.maps.Marker({ map: m, zIndex: 10 });
        marker.addListener('click', () => onSelect.current?.(b.id));
        busMarkers.current.set(b.id, marker);
      }
      marker.setPosition({ lat: b.lat, lng: b.lng });
      marker.setIcon(icon);
      marker.setTitle(b.label);
      marker.setLabel(b.id === selectedBusId ? { text: b.label, color: '#0f172a', fontSize: '12px', fontWeight: '700', className: 'trips-map-label' } : null);
    }
    for (const [id, marker] of busMarkers.current) {
      if (!seen.has(id)) {
        marker.setMap(null);
        busMarkers.current.delete(id);
      }
    }
  }, [buses, selectedBusId, status]);

  // Stops + route line + trail (redrawn only when they change).
  const hasRoad = !!(road?.passed || road?.ahead);
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
          label: { text: s.kind === 'school' ? 'S' : String(s.seq + 1), color: '#ffffff', fontSize: '11px', fontWeight: '700' },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: s.kind === 'school' ? 11 : 9,
            fillColor: s.kind === 'school' ? '#0f172a' : STOP_COLOR[s.status],
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          zIndex: 5,
        }),
    );
    if (stops.length > 1 && !hasRoad) {
      lines.current.push(
        new google.maps.Polyline({ map: m, path: stops.map((s) => ({ lat: s.lat, lng: s.lng })), strokeColor: '#2563eb', strokeOpacity: 0.35, strokeWeight: 4, clickable: false }),
      );
    }
    if (trail.length > 1) {
      lines.current.push(new google.maps.Polyline({ map: m, path: trail, strokeColor: '#16a34a', strokeOpacity: 0.9, strokeWeight: 4, clickable: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsKey, status, hasRoad]);

  // Road-following line: passed (green) + ahead (blue), split at the bus. With a GPS trail (history),
  // the planned road is drawn faint underneath the actual trail.
  const roadKey = `${road?.passed ?? ''}|${road?.ahead ?? ''}|${trail.length > 0}`;
  useEffect(() => {
    const m = map.current;
    if (status !== 'ready' || !m) return;
    roadLines.current.forEach((x) => x.setMap(null));
    roadLines.current = [];
    if (!hasRoad) return;
    const passed = decodePolyline(road?.passed);
    const ahead = decodePolyline(road?.ahead);
    const line = (path: { lat: number; lng: number }[], color: string, opacity: number) =>
      path.length > 1 &&
      roadLines.current.push(new google.maps.Polyline({ map: m, path, strokeColor: color, strokeOpacity: opacity, strokeWeight: 5, clickable: false, zIndex: 2 }));
    if (trail.length > 0) {
      line([...passed, ...ahead], '#2563eb', 0.35);
    } else {
      line(passed, '#16a34a', 0.9);
      line(ahead, '#2563eb', 0.9);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadKey, status]);

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
        <Alert color="orange" m="md" title="Map unavailable">
          Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (Maps JavaScript API) to see the map. All data is still listed below.
        </Alert>
      )}
    </Box>
  );
}
