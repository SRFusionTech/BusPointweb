'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ActionIcon, Alert, Badge, Box, Button, Group, Loader, Menu, Paper, Stack, Text, TextInput, Title, Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAlertTriangle, IconArrowDown, IconArrowLeft, IconArrowUp, IconBuildingCommunity, IconCheck, IconCrosshair, IconDeviceFloppy,
  IconDots, IconFlag, IconFocusCentered, IconGripVertical, IconLock, IconMapPin, IconPencil, IconPlus,
  IconTrash, IconX,
} from '@tabler/icons-react';
import { api, type MySchool, type RouteDetail } from '@/lib/api';
import { notify, errorMessage } from '@/lib/notify';
import { AddressAutocomplete, loadGoogleMaps } from '@/components/console/AddressAutocomplete';
import { ConfirmDialog } from '@/components/console/ConfirmDialog';
import { computeRoadRoute, formatDuration, type LatLng, type RoadRoute } from '@/lib/roadRoute';
import './route-editor.css';

// ─── Model ────────────────────────────────────────────────────────────────────

interface DraftStop {
  key: string;
  /** Used only when autoName is false */
  name: string;
  /** Default "Stop N" names follow the stop's position until the admin renames it */
  autoName: boolean;
  lat: number;
  lng: number;
  address: string | null;
}

interface EndPoint {
  lat: number;
  lng: number;
  address: string | null;
}

type Target = { kind: 'new' } | { kind: 'stop'; key: string } | { kind: 'end' };
type Selection = 'school' | 'end' | string | null;

const LAST_STOP = 'Last Stop';
const AUTO_NAME = /^Stop \d+$/;
const COLORS = { school: '#0f172a', stop: '#2563eb', end: '#dc2626', selected: '#f59e0b' };

const stopName = (s: DraftStop, i: number) => (s.autoName ? `Stop ${i + 1}` : s.name);
const newKey = () => `new-${Math.random().toString(36).slice(2, 10)}`;

function toPayload(stops: DraftStop[], end: EndPoint | null) {
  return {
    stops: stops.map((s, i) => ({ name: stopName(s, i), lat: s.lat, lng: s.lng, address: s.address ?? undefined })),
    end: end ? { lat: end.lat, lng: end.lng, address: end.address ?? undefined } : null,
  };
}

function distanceKm(points: { lat: number; lng: number }[]) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2
      + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
    total += 2 * R * Math.asin(Math.sqrt(h));
  }
  return total;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const { results } = await new google.maps.Geocoder().geocode({ location: { lat, lng } });
    return results[0]?.formatted_address ?? null;
  } catch {
    return null;
  }
}

const coords = (p: { lat: number; lng: number }) => `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;

// ─── Map ──────────────────────────────────────────────────────────────────────

interface MapPoint {
  key: Selection & string;
  kind: 'school' | 'stop' | 'end';
  label: string;
  title: string;
  lat: number;
  lng: number;
}

interface MapLabel extends google.maps.OverlayView {
  setPosition(position: google.maps.LatLng | google.maps.LatLngLiteral): void;
}

let LabelOverlay: (new (position: google.maps.LatLngLiteral, text: string, kind: string, selected: boolean) => MapLabel) | null = null;

/** HTML name pill drawn beside a marker. Defined lazily — OverlayView only exists once Maps has loaded. */
function createMapLabel(position: google.maps.LatLngLiteral, text: string, kind: string, selected: boolean): MapLabel {
  LabelOverlay ??= class extends google.maps.OverlayView {
    private div: HTMLDivElement | null = null;
    private position: google.maps.LatLng;

    constructor(pos: google.maps.LatLngLiteral, private text: string, private kind: string, private selected: boolean) {
      super();
      this.position = new google.maps.LatLng(pos);
    }

    onAdd() {
      const div = document.createElement('div');
      div.className = 'bp-map-label';
      div.dataset.kind = this.kind;
      div.dataset.selected = String(this.selected);
      div.textContent = this.text;
      this.getPanes()?.floatPane.appendChild(div);
      this.div = div;
    }

    draw() {
      const point = this.getProjection()?.fromLatLngToDivPixel(this.position);
      if (point && this.div) {
        this.div.style.left = `${point.x}px`;
        this.div.style.top = `${point.y}px`;
      }
    }

    onRemove() {
      this.div?.remove();
      this.div = null;
    }

    setPosition(pos: google.maps.LatLng | google.maps.LatLngLiteral) {
      this.position = pos instanceof google.maps.LatLng ? pos : new google.maps.LatLng(pos);
      this.draw();
    }
  };
  return new LabelOverlay(position, text, kind, selected);
}

/** Road-following route through the points, recomputed (debounced) when positions or order change. */
function useRoadRoute(points: LatLng[]) {
  const key = points.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join('|');
  const [result, setResult] = useState<{ key: string; route: RoadRoute | null } | null>(null);

  useEffect(() => {
    if (!key.includes('|')) return; // fewer than two points
    const pts = key.split('|').map((pair) => {
      const [lat, lng] = pair.split(',').map(Number);
      return { lat, lng };
    });
    const controller = new AbortController();
    const timer = setTimeout(() => {
      computeRoadRoute(pts, controller.signal)
        .then((route) => setResult({ key, route }))
        .catch(() => { if (!controller.signal.aborted) setResult({ key, route: null }); });
    }, 600);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key]);

  const current = result?.key === key ? result : null;
  return {
    route: current?.route ?? null,
    loading: points.length > 1 && !current,
    failed: !!current && !current.route,
  };
}

function RouteMap({
  points, roadPath, selected, placing, fitSignal, onPick, onSelect, onMove,
}: {
  points: MapPoint[];
  /** Road-following path; straight lines are drawn while it loads or if routing fails */
  roadPath: LatLng[] | null;
  selected: Selection;
  placing: boolean;
  fitSignal: number;
  onPick: (lat: number, lng: number) => void;
  onSelect: (key: Selection) => void;
  onMove: (key: string, lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const labelsRef = useRef<MapLabel[]>([]);
  const linesRef = useRef<google.maps.Polyline[]>([]);
  const handlersRef = useRef({ onPick, onSelect, onMove });
  const pointsRef = useRef(points);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => { handlersRef.current = { onPick, onSelect, onMove }; });
  useEffect(() => { pointsRef.current = points; }, [points]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(async (ok) => {
      if (cancelled) return;
      if (!ok || !containerRef.current) { setStatus('failed'); return; }
      await Promise.all([
        google.maps.importLibrary('maps'),
        google.maps.importLibrary('marker'),
        google.maps.importLibrary('geocoding'),
      ]);
      if (cancelled || !containerRef.current) return;
      const map = new google.maps.Map(containerRef.current, {
        center: { lat: 17.385, lng: 78.4867 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        gestureHandling: 'greedy',
      });
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) handlersRef.current.onPick(e.latLng.lat(), e.latLng.lng());
      });
      mapRef.current = map;
      setStatus('ready');
    });
    return () => { cancelled = true; };
  }, []);

  // Markers
  useEffect(() => {
    const map = mapRef.current;
    if (status !== 'ready' || !map) return;
    markersRef.current.forEach((m) => m.setMap(null));
    labelsRef.current.forEach((l) => l.setMap(null));
    labelsRef.current = [];

    markersRef.current = points.map((p) => {
      const isSelected = p.key === selected;
      const label = createMapLabel({ lat: p.lat, lng: p.lng }, p.title, p.kind, isSelected);
      label.setMap(map);
      labelsRef.current.push(label);
      const marker = new google.maps.Marker({
        map,
        position: { lat: p.lat, lng: p.lng },
        title: p.title,
        draggable: p.kind !== 'school',
        zIndex: isSelected ? 1000 : p.kind === 'school' ? 900 : 100,
        label: { text: p.label, color: '#fff', fontSize: '11px', fontWeight: '700' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 15 : 12,
          fillColor: COLORS[p.kind],
          fillOpacity: 1,
          strokeColor: isSelected ? COLORS.selected : '#ffffff',
          strokeWeight: 3,
        },
      });
      marker.addListener('click', () => handlersRef.current.onSelect(p.key));
      marker.addListener('drag', (e: google.maps.MapMouseEvent) => { if (e.latLng) label.setPosition(e.latLng); });
      marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) handlersRef.current.onMove(p.key, e.latLng.lat(), e.latLng.lng());
      });
      return marker;
    });
  }, [points, selected, status]);

  // Route line: road path with a white casing (Google-Maps style), or faint straight lines as a fallback
  useEffect(() => {
    const map = mapRef.current;
    if (status !== 'ready' || !map) return;
    linesRef.current.forEach((l) => l.setMap(null));
    linesRef.current = [];
    if (points.length < 2) return;

    const arrows = [{
      icon: { path: google.maps.SymbolPath.FORWARD_OPEN_ARROW, scale: 2.5, strokeColor: '#ffffff', strokeWeight: 2.5 },
      offset: '60px',
      repeat: '110px',
    }];

    if (roadPath && roadPath.length > 1) {
      linesRef.current = [
        new google.maps.Polyline({ map, path: roadPath, strokeColor: '#ffffff', strokeOpacity: 1, strokeWeight: 15, clickable: false, zIndex: 1 }),
        new google.maps.Polyline({ map, path: roadPath, strokeColor: COLORS.stop, strokeOpacity: 1, strokeWeight: 10, clickable: false, zIndex: 2, icons: arrows }),
      ];
    } else {
      linesRef.current = [
        new google.maps.Polyline({
          map,
          path: points.map((p) => ({ lat: p.lat, lng: p.lng })),
          strokeColor: COLORS.stop,
          strokeOpacity: 0.7,
          strokeWeight: 6,
          clickable: false,
          zIndex: 1,
          icons: arrows,
        }),
      ];
    }
  }, [points, roadPath, status]);

  // Fit everything in view (first load + "Fit route" button)
  useEffect(() => {
    const map = mapRef.current;
    const pts = pointsRef.current;
    if (status !== 'ready' || !map || fitSignal === 0 || pts.length === 0) return;
    if (pts.length === 1) {
      map.setCenter(pts[0]);
      map.setZoom(15);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    pts.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 80);
  }, [fitSignal, status]);

  // Bring the selected stop into view
  useEffect(() => {
    const map = mapRef.current;
    const p = pointsRef.current.find((pt) => pt.key === selected);
    if (status !== 'ready' || !map || !p) return;
    const bounds = map.getBounds();
    if (!bounds || !bounds.contains(p)) map.panTo(p);
  }, [selected, status]);

  useEffect(() => {
    mapRef.current?.setOptions({ draggableCursor: placing ? 'crosshair' : null });
  }, [placing, status]);

  return (
    <>
      <div ref={containerRef} className="bp-route-map-canvas" />
      {status !== 'ready' && (
        <Stack align="center" justify="center" gap="xs" style={{ position: 'absolute', inset: 0, background: 'var(--mantine-color-default-hover)' }}>
          {status === 'loading' ? <Loader size="sm" /> : <IconMapPin size={28} stroke={1.5} />}
          <Text size="sm" c="dimmed" ta="center" maw={300}>
            {status === 'loading'
              ? 'Loading map…'
              : 'Map unavailable. Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and that the Maps JavaScript API is enabled.'}
          </Text>
        </Stack>
      )}
    </>
  );
}

// ─── Route name (inline rename) ───────────────────────────────────────────────

function RouteName({ name, onRename }: { name: string; onRename: (name: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);

  async function save() {
    const next = value.trim();
    if (!next || next === name) { setEditing(false); return; }
    setSaving(true);
    try {
      await onRename(next);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <Group gap={6} wrap="nowrap">
        <TextInput
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setEditing(false);
          }}
          autoFocus
          size="md"
          w={320}
          disabled={saving}
          aria-label="Route name"
        />
        <ActionIcon size="lg" onClick={save} loading={saving} aria-label="Save name"><IconCheck size={18} /></ActionIcon>
        <ActionIcon size="lg" variant="default" onClick={() => setEditing(false)} disabled={saving} aria-label="Cancel"><IconX size={18} /></ActionIcon>
      </Group>
    );
  }

  return (
    <Group gap={6} wrap="nowrap" miw={0}>
      <Title order={2} fw={600} lineClamp={1}>{name}</Title>
      <Tooltip label="Rename route">
        <ActionIcon variant="subtle" color="gray" onClick={() => { setValue(name); setEditing(true); }} aria-label="Rename route">
          <IconPencil size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RouteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [school, setSchool] = useState<MySchool | null>(null);
  const [schoolLocated, setSchoolLocated] = useState<boolean | null>(null);
  const [stops, setStops] = useState<DraftStop[]>([]);
  const [end, setEnd] = useState<EndPoint | null>(null);
  const [baseline, setBaseline] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selected, setSelected] = useState<Selection>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [search, setSearch] = useState('');
  const [fitSignal, setFitSignal] = useState(0);

  const [armedKey, setArmedKey] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const [leaveOpen, { open: openLeave, close: closeLeave }] = useDisclosure(false);

  const applyRoute = useCallback((r: RouteDetail) => {
    const pickups = r.stops.filter((s) => s.kind === 'stop' || !s.kind);
    const last = r.stops.find((s) => s.kind === 'end');
    const draft = pickups.map((s) => ({
      key: s.id, name: s.name, autoName: AUTO_NAME.test(s.name), lat: s.lat, lng: s.lng, address: s.address,
    }));
    const endPoint = last ? { lat: last.lat, lng: last.lng, address: last.address } : null;
    setRoute(r);
    setStops(draft);
    setEnd(endPoint);
    setBaseline(JSON.stringify(toPayload(draft, endPoint)));
  }, []);

  // Load route + school; backfill the school's coordinates from its address if missing
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.routes.get(id), api.mySchool.get()])
      .then(async ([routeRes, schoolRes]) => {
        if (cancelled) return;
        applyRoute(routeRes.data);
        let s = schoolRes.data;
        if (s.lat === null || s.lng === null) {
          const ok = await loadGoogleMaps();
          if (ok) {
            await google.maps.importLibrary('geocoding');
            const { results } = await new google.maps.Geocoder().geocode({ address: s.address }).catch(() => ({ results: [] }));
            const loc = results[0]?.geometry.location;
            if (loc) {
              await api.mySchool.setLocation(loc.lat(), loc.lng()).catch(() => null);
              s = { ...s, lat: loc.lat(), lng: loc.lng() };
            }
          }
        }
        if (cancelled) return;
        setSchool(s);
        setSchoolLocated(s.lat !== null && s.lng !== null);
        setFitSignal((n) => n + 1);
      })
      .catch((err) => { if (!cancelled) notify.error(errorMessage(err, 'Failed to load route')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, applyRoute]);

  const payload = useMemo(() => toPayload(stops, end), [stops, end]);
  const dirty = !loading && JSON.stringify(payload) !== baseline;

  // Warn before closing the tab with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Esc cancels placing mode
  useEffect(() => {
    if (!target) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setTarget(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [target]);

  // Keep the selected row visible in the list
  useEffect(() => {
    if (selected) rowRefs.current.get(selected)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected]);

  const points: MapPoint[] = useMemo(() => {
    const list: MapPoint[] = [];
    if (school?.lat != null && school.lng != null) {
      list.push({ key: 'school', kind: 'school', label: 'S', title: school.name, lat: school.lat, lng: school.lng });
    }
    stops.forEach((s, i) => list.push({ key: s.key, kind: 'stop', label: String(i + 1), title: stopName(s, i), lat: s.lat, lng: s.lng }));
    if (end) list.push({ key: 'end', kind: 'end', label: 'E', title: LAST_STOP, lat: end.lat, lng: end.lng });
    return list;
  }, [school, stops, end]);

  const road = useRoadRoute(points);
  const tripSummary = road.route
    ? `${(road.route.meters / 1000).toFixed(1)} km · ${formatDuration(road.route.seconds)} drive`
    : points.length > 1 ? `~${distanceKm(points).toFixed(1)} km straight-line` : '';

  // ─── Edits ──────────────────────────────────────────────────────────────────

  function updateStop(key: string, patch: Partial<DraftStop>) {
    setStops((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function fillAddress(key: string, lat: number, lng: number) {
    reverseGeocode(lat, lng).then((address) => {
      if (!address) return;
      if (key === 'end') setEnd((e) => (e && e.lat === lat && e.lng === lng ? { ...e, address } : e));
      else setStops((prev) => prev.map((s) => (s.key === key && s.lat === lat && s.lng === lng ? { ...s, address } : s)));
    });
  }

  /** Map click or search result — goes to whatever is being placed, else adds a new stop. */
  function placeAt(lat: number, lng: number, address: string | null) {
    const t = target ?? { kind: 'new' as const };
    if (t.kind === 'end') {
      setEnd({ lat, lng, address });
      setSelected('end');
      if (!address) fillAddress('end', lat, lng);
    } else if (t.kind === 'stop') {
      updateStop(t.key, { lat, lng, address });
      setSelected(t.key);
      if (!address) fillAddress(t.key, lat, lng);
    } else {
      const key = newKey();
      setStops((prev) => [...prev, { key, name: '', autoName: true, lat, lng, address }]);
      setSelected(key);
      if (!address) fillAddress(key, lat, lng);
    }
    setTarget(null);
  }

  function moveMarker(key: string, lat: number, lng: number) {
    if (key === 'end') setEnd({ lat, lng, address: null });
    else updateStop(key, { lat, lng, address: null });
    setSelected(key);
    fillAddress(key, lat, lng);
  }

  function reorder(fromKey: string, toIndex: number) {
    setStops((prev) => {
      const from = prev.findIndex((s) => s.key === fromKey);
      if (from < 0 || toIndex < 0 || toIndex >= prev.length || from === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function removeStop(key: string) {
    setStops((prev) => prev.filter((s) => s.key !== key));
    if (selected === key) setSelected(null);
    if (target?.kind === 'stop' && target.key === key) setTarget(null);
  }

  function discard() {
    if (route) applyRoute(route);
    setSelected(null);
    setTarget(null);
  }

  async function save() {
    if (!end) {
      notify.error('Set where the Last Stop is before saving.', 'Last Stop missing');
      setTarget({ kind: 'end' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.routes.saveStops(id, payload);
      applyRoute({ ...route!, stops: res.data });
      notify.success('Route saved.');
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to save route'));
    } finally {
      setSaving(false);
    }
  }

  async function rename(name: string) {
    try {
      await api.routes.update(id, { name });
      setRoute((r) => (r ? { ...r, name } : r));
      notify.success('Route renamed.');
    } catch (err) {
      notify.error(errorMessage(err, 'Failed to rename route'));
      throw err;
    }
  }

  function leave() {
    if (dirty) openLeave();
    else router.push('/routes');
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const placingLabel = !target
    ? null
    : target.kind === 'end'
      ? LAST_STOP
      : target.kind === 'stop'
        ? stopName(stops.find((s) => s.key === target.key)!, stops.findIndex((s) => s.key === target.key))
        : `Stop ${stops.length + 1}`;

  if (loading) {
    return (
      <Stack align="center" py={120} gap="sm">
        <Loader />
        <Text size="sm" c="dimmed">Loading route…</Text>
      </Stack>
    );
  }

  if (!route) {
    return (
      <Stack align="center" py={120} gap="sm">
        <Text fw={600}>Route not found</Text>
        <Button variant="default" onClick={() => router.push('/routes')}>Back to routes</Button>
      </Stack>
    );
  }

  return (
    <>
      {/* Header */}
      <Group justify="space-between" align="flex-end" mb="md" gap="md">
        <Box miw={0}>
          <Button variant="subtle" color="gray" size="compact-sm" leftSection={<IconArrowLeft size={14} />} onClick={leave} mb={6} px={4}>
            Routes
          </Button>
          <RouteName name={route.name} onRename={rename} />
          <Text size="sm" c="dimmed" mt={2}>
            Starts at {school?.name ?? 'your school'} · {stops.length} stop{stops.length === 1 ? '' : 's'}
            {end ? ' · ends at Last Stop' : ''}
            {tripSummary ? ` · ${tripSummary}` : ''}
          </Text>
        </Box>
        <Group gap="sm">
          {dirty && <Badge variant="dot" color="orange" size="lg">Unsaved changes</Badge>}
          {dirty && <Button variant="default" onClick={discard} disabled={saving}>Discard</Button>}
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={save}
            loading={saving}
            disabled={!dirty || !schoolLocated}
          >
            Save route
          </Button>
        </Group>
      </Group>

      <div className="bp-route-editor">
        {/* ── Stop list ── */}
        <div className="bp-route-panel">
          <Group justify="space-between" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
            <div>
              <Text fw={600} size="sm">Stops in order</Text>
              <Text size="xs" c="dimmed">Drag ⋮⋮ to reorder · click a stop to edit</Text>
            </div>
          </Group>

          {schoolLocated === false && (
            <Alert color="orange" variant="light" m="sm" mb={0} title="School location missing">
              We couldn’t find your school on the map, so routes can’t start from it yet. Contact BusPoint support to set it.
            </Alert>
          )}

          <div className="bp-route-list">
            {/* School — fixed start */}
            <div
              className="bp-stop"
              data-line="true"
              data-selected={selected === 'school'}
              ref={(el) => { if (el) rowRefs.current.set('school', el); }}
              onClick={() => setSelected('school')}
            >
              <span className="bp-stop-grip" />
              <span className="bp-stop-badge" style={{ background: COLORS.school }}>
                <IconBuildingCommunity size={14} />
              </span>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6} wrap="nowrap">
                  <Text size="sm" fw={600} truncate="end">{school?.name ?? 'School'}</Text>
                  <Tooltip label="Every route starts at your school. Its location can’t be changed here.">
                    <IconLock size={13} color="var(--mantine-color-dimmed)" />
                  </Tooltip>
                </Group>
                <Text size="xs" c="dimmed" truncate="end">Starting point · {school?.address}</Text>
              </Box>
            </div>

            {/* Pickups */}
            {stops.map((s, i) => {
              const name = stopName(s, i);
              return (
                <div
                  key={s.key}
                  className="bp-stop"
                  data-line="true"
                  data-selected={selected === s.key}
                  data-dragging={dragKey === s.key}
                  data-drop={overKey === s.key && dragKey !== s.key}
                  ref={(el) => { if (el) rowRefs.current.set(s.key, el); else rowRefs.current.delete(s.key); }}
                  draggable={armedKey === s.key}
                  onDragStart={(e) => { setDragKey(s.key); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragOver={(e) => { if (!dragKey) return; e.preventDefault(); setOverKey(s.key); }}
                  onDrop={(e) => { e.preventDefault(); if (dragKey) reorder(dragKey, i); }}
                  onDragEnd={() => { setDragKey(null); setOverKey(null); setArmedKey(null); }}
                  onClick={() => setSelected(s.key)}
                >
                  <span
                    className="bp-stop-grip"
                    onMouseDown={() => setArmedKey(s.key)}
                    onMouseUp={() => setArmedKey(null)}
                    aria-hidden
                  >
                    <IconGripVertical size={16} />
                  </span>
                  <span className="bp-stop-badge" style={{ background: COLORS.stop }}>{i + 1}</span>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <TextInput
                      variant="unstyled"
                      size="sm"
                      value={name}
                      placeholder={`Stop ${i + 1}`}
                      onFocus={() => setSelected(s.key)}
                      onChange={(e) => updateStop(s.key, { name: e.currentTarget.value, autoName: false })}
                      onBlur={(e) => { if (!e.currentTarget.value.trim()) updateStop(s.key, { name: '', autoName: true }); }}
                      styles={{ input: { fontWeight: 600, height: 22, minHeight: 22, lineHeight: '22px', padding: 0 } }}
                      aria-label={`Name of stop ${i + 1}`}
                    />
                    <Text size="xs" c="dimmed" truncate="end">{s.address ?? coords(s)}</Text>
                  </Box>
                  <Menu position="bottom-end" width={190}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" size="sm" onClick={(e) => e.stopPropagation()} aria-label={`Actions for ${name}`}>
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconCrosshair size={16} />} onClick={() => { setSelected(s.key); setTarget({ kind: 'stop', key: s.key }); }}>
                        Change location
                      </Menu.Item>
                      <Menu.Item leftSection={<IconArrowUp size={16} />} disabled={i === 0} onClick={() => reorder(s.key, i - 1)}>Move up</Menu.Item>
                      <Menu.Item leftSection={<IconArrowDown size={16} />} disabled={i === stops.length - 1} onClick={() => reorder(s.key, i + 1)}>Move down</Menu.Item>
                      <Menu.Divider />
                      <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={() => removeStop(s.key)}>Remove stop</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </div>
              );
            })}

            <button
              type="button"
              className="bp-stop-add"
              data-active={target?.kind === 'new'}
              onClick={() => setTarget(target?.kind === 'new' ? null : { kind: 'new' })}
            >
              <IconPlus size={15} /> {target?.kind === 'new' ? 'Click the map to place it…' : 'Add stop'}
            </button>

            {/* Last Stop — fixed end */}
            <div
              className="bp-stop"
              data-selected={selected === 'end'}
              ref={(el) => { if (el) rowRefs.current.set('end', el); }}
              onClick={() => (end ? setSelected('end') : setTarget({ kind: 'end' }))}
            >
              <span className="bp-stop-grip" />
              <span className="bp-stop-badge" style={{ background: COLORS.end }}><IconFlag size={13} /></span>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6} wrap="nowrap">
                  <Text size="sm" fw={600}>{LAST_STOP}</Text>
                  <Tooltip label="The final stop is always called “Last Stop”. You can change where it is.">
                    <IconLock size={13} color="var(--mantine-color-dimmed)" />
                  </Tooltip>
                </Group>
                <Text size="xs" c={end ? 'dimmed' : 'orange'} truncate="end">
                  {end ? (end.address ?? coords(end)) : 'Not placed yet — required to save'}
                </Text>
              </Box>
              <Button
                size="compact-xs"
                variant={end ? 'subtle' : 'light'}
                onClick={(e) => { e.stopPropagation(); setTarget({ kind: 'end' }); }}
              >
                {end ? 'Change' : 'Set location'}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Map ── */}
        <div className="bp-route-map">
          <RouteMap
            points={points}
            roadPath={road.route?.path ?? null}
            selected={selected}
            placing={!!target}
            fitSignal={fitSignal}
            onPick={(lat, lng) => placeAt(lat, lng, null)}
            onSelect={setSelected}
            onMove={moveMarker}
          />

          <div className="bp-route-search">
            <AddressAutocomplete
              id="route-stop-search"
              value={search}
              onChange={setSearch}
              onPlaceSelect={(place) => { placeAt(place.lat, place.lng, place.address); setSearch(''); }}
              placeholder={placingLabel ? `Search a location for ${placingLabel}` : 'Search an address to add a stop'}
            />
            <Tooltip label="Fit whole route">
              <ActionIcon
                variant="default"
                size={36}
                onClick={() => setFitSignal((n) => n + 1)}
                aria-label="Fit whole route"
                style={{ boxShadow: 'var(--mantine-shadow-md)' }}
              >
                <IconFocusCentered size={18} />
              </ActionIcon>
            </Tooltip>
          </div>

          {(road.loading || road.failed) && (
            <Tooltip
              label="The Google Maps key needs the Routes API enabled to draw road-following routes."
              disabled={!road.failed}
              multiline
              w={260}
            >
              <Paper className="bp-route-status" shadow="md" radius="xl" px="sm" py={6} withBorder>
                <Group gap={8} wrap="nowrap">
                  {road.loading ? <Loader size={12} /> : <IconAlertTriangle size={14} color="var(--mantine-color-orange-6)" />}
                  <Text size="xs" fw={500}>
                    {road.loading ? 'Calculating road route…' : 'Road route unavailable — showing straight lines'}
                  </Text>
                </Group>
              </Paper>
            </Tooltip>
          )}

          {placingLabel && (
            <Paper className="bp-route-banner" shadow="lg" radius="xl" px="md" py={8} withBorder>
              <Group gap="sm" wrap="nowrap">
                <IconCrosshair size={16} color="var(--mantine-primary-color-filled)" />
                <Text size="sm">
                  Click the map or search to place <Text span fw={600}>{placingLabel}</Text>
                </Text>
                <Button size="compact-xs" variant="subtle" color="gray" onClick={() => setTarget(null)}>Cancel</Button>
              </Group>
            </Paper>
          )}
        </div>
      </div>

      <ConfirmDialog
        opened={leaveOpen}
        onClose={closeLeave}
        onConfirm={async () => { router.push('/routes'); }}
        title="Leave without saving?"
        message="Your changes to this route’s stops will be lost."
        confirmLabel="Discard & leave"
        danger
      />
    </>
  );
}
