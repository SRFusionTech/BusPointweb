'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, Pencil, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { useGoogleMaps } from './useGoogleMaps';

export type LatLng = { lat: number; lng: number };

export type PinnedPoint = LatLng & {
  id?: string;
  label?: string;
  address?: string;
};

type Mode = 'single' | 'multi';

interface Props {
  mode: Mode;
  /** Initial map center if no points yet. Defaults to the school pin or India centroid. */
  center?: LatLng | null;
  /** Currently pinned point(s). Single mode uses points[0]. */
  points: PinnedPoint[];
  /** Called whenever the pinned point(s) change (click, drag, search). */
  onChange: (points: PinnedPoint[]) => void;
  /** Optional reference pin always rendered (e.g. the school in starting-point and stops steps). */
  referencePin?: (PinnedPoint & { color?: string }) | null;
  /** Pixel height of the map. */
  height?: number;
  /** Hint text shown above the map. */
  hint?: string;
  /** Color override for the primary pin(s). */
  pinColor?: string;
  /** Search placeholder. */
  searchPlaceholder?: string;
  /** Show a numbered ordered list of pins below the map. Only meaningful in multi mode. */
  showOrderedList?: boolean;
  /** Called when the user clicks a list item (multi mode). */
  onSelectPoint?: (index: number) => void;
  /** Called when the user removes a pin (multi mode). */
  onRemovePoint?: (index: number) => void;
  /** Called when the user reorders pins (multi mode). */
  onMovePoint?: (from: number, to: number) => void;
}

const DEFAULT_CENTER: LatLng = { lat: 20.5937, lng: 78.9629 };

function buildPinSvg(color: string, label?: string): string {
  const text = label
    ? `<text x="16" y="20" font-family="system-ui,sans-serif" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`
    : `<circle cx="16" cy="16" r="4" fill="#fff"/>`;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <defs>
        <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>
      <g filter="url(#s)">
        <path d="M18 2 C8 2 2 10 2 18 c0 11 16 24 16 24 s16-13 16-24 c0-8-6-16-16-16 z" fill="${color}" stroke="#fff" stroke-width="2"/>
        ${text}
      </g>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function MapPicker({
  mode,
  center,
  points,
  onChange,
  referencePin,
  height = 380,
  hint,
  pinColor = '#a855f7',
  searchPlaceholder = 'Search for a place or address…',
  showOrderedList,
  onSelectPoint,
  onRemovePoint,
  onMovePoint,
}: Props) {
  const { status, error } = useGoogleMaps();
  const mapDivRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const referenceMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const skipNextOptimizeRef = useRef(false);

  const [searchValue, setSearchValue] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [multiAddMode, setMultiAddMode] = useState(false);
  const drawingPathRef = useRef<Array<LatLng>>([]);
  const drawingPolylineRef = useRef<any>(null);
  const drawingListenersRef = useRef<any>(null);

  /* Initialize the map once. */
  useEffect(() => {
    if (status !== 'ready' || !mapDivRef.current || mapRef.current) return;
    const google = (window as any).google;

    const initialCenter =
      points[0] ?? center ?? referencePin ?? DEFAULT_CENTER;
    const initialZoom = points[0] || referencePin ? 13 : 5;

    mapRef.current = new google.maps.Map(mapDivRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
      gestureHandling: 'greedy',
      zoomControl: true,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });

    geocoderRef.current = new google.maps.Geocoder();

    /* Click handler */
    mapRef.current.addListener('click', async (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const address = await reverseGeocode(lat, lng).catch(() => undefined);
      if (mode === 'single') {
        onChange([{ lat, lng, address }]);
      } else {
        onChange([...points, { lat, lng, address }]);
      }
    });

    /* Autocomplete (Places library) */
    if (inputRef.current && google.maps.places) {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ['geometry', 'formatted_address', 'name'],
      });
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (!place?.geometry?.location) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address ?? place.name;
        const newPoint: PinnedPoint = { lat, lng, address };

        if (mode === 'single') {
          onChange([newPoint]);
        } else {
          onChange([...points, newPoint]);
        }

        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(15);
        setSearchValue('');
        if (inputRef.current) inputRef.current.value = '';
      });
    }
    // Prepare polyline for ordered route visualization (fallback)
    polylineRef.current = new google.maps.Polyline({
      map: null,
      path: [],
      strokeColor: pinColor,
      strokeOpacity: 0.9,
      strokeWeight: 4,
      geodesic: true,
    });
    // Directions service & renderer
    directionsServiceRef.current = new google.maps.DirectionsService();
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: { strokeColor: pinColor, strokeWeight: 4 },
    });
    directionsRendererRef.current.setMap(mapRef.current);
    // drawing polyline used during mouse-draw multi-add
    drawingPolylineRef.current = new google.maps.Polyline({
      map: null,
      path: [],
      strokeColor: '#06b6d4',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      geodesic: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const geocodeAddress = (address: string): Promise<LatLng | undefined> => {
    return new Promise((resolve) => {
      if (!geocoderRef.current) return resolve(undefined);
      geocoderRef.current.geocode({ address }, (results: any[], status: string) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
        } else {
          resolve(undefined);
        }
      });
    });
  };

  /* Sync primary marker(s) */
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return;
    const google = (window as any).google;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    points.forEach((p, idx) => {
      const label = mode === 'multi' ? String(idx + 1) : undefined;
      const marker = new google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapRef.current,
        draggable: true,
        icon: {
          url: buildPinSvg(pinColor, label),
          scaledSize: new google.maps.Size(36, 44),
          anchor: new google.maps.Point(18, 42),
        },
        title: p.label ?? p.address ?? `(${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`,
      });

      marker.addListener('dragend', async (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const address = await reverseGeocode(lat, lng).catch(() => undefined);
        const next = [...points];
        next[idx] = { ...next[idx], lat, lng, address };
        onChange(next);
      });

      markersRef.current.push(marker);
    });

    if (points.length === 1 && mode === 'single') {
      mapRef.current.panTo({ lat: points[0].lat, lng: points[0].lng });
      if ((mapRef.current.getZoom?.() ?? 0) < 12) mapRef.current.setZoom(14);
    } else if (points.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      points.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      if (referencePin) bounds.extend({ lat: referencePin.lat, lng: referencePin.lng });
      mapRef.current.fitBounds(bounds, 60);
    }

    // Update route via Directions API when we have enough points.
    const hasSchoolPin = Boolean(referencePin);
    const optimizedStops = points;

    if (directionsServiceRef.current && directionsRendererRef.current && (hasSchoolPin ? optimizedStops.length >= 1 : optimizedStops.length >= 2)) {
      const origin = referencePin ?? optimizedStops[0];
      const destination = referencePin ?? optimizedStops[optimizedStops.length - 1];
      const waypointsSource = referencePin ? optimizedStops : optimizedStops.slice(1, -1);
      const waypoints = waypointsSource.map((p) => ({
        location: new google.maps.LatLng(p.lat, p.lng),
        stopover: true,
      }));

      const request = {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      };

      directionsServiceRef.current.route(request, (result: any, dsStatus: string) => {
        if (dsStatus === 'OK' && result) {
          directionsRendererRef.current.setDirections(result);
          directionsRendererRef.current.setMap(mapRef.current);

          // Reorder pickup points to the optimized waypoint order exactly once per change.
          if (!skipNextOptimizeRef.current && referencePin && waypoints.length > 1 && result.routes?.[0]?.waypoint_order) {
            const order: number[] = result.routes[0].waypoint_order;
            if (order.length === waypoints.length) {
              const reordered = order.map((idx) => points[idx]);
              if (reordered.length === points.length) {
                skipNextOptimizeRef.current = true;
                onChange(reordered);
              }
            }
          } else if (skipNextOptimizeRef.current) {
            skipNextOptimizeRef.current = false;
          }
        } else {
          // Fallback to direct polyline if routing fails.
          if (polylineRef.current) {
            const path = [
              ...(referencePin ? [new google.maps.LatLng(referencePin.lat, referencePin.lng)] : []),
              ...points.map((p) => new google.maps.LatLng(p.lat, p.lng)),
              ...(referencePin ? [new google.maps.LatLng(referencePin.lat, referencePin.lng)] : []),
            ];
            polylineRef.current.setPath(path);
            polylineRef.current.setMap(points.length > 0 ? mapRef.current : null);
          }
        }
      });
    } else if (polylineRef.current) {
      // Fallback direct path for 0/1 point or when Directions API isn't ready.
      const path = [
        ...(referencePin ? [new google.maps.LatLng(referencePin.lat, referencePin.lng)] : []),
        ...points.map((p) => new google.maps.LatLng(p.lat, p.lng)),
        ...(referencePin ? [new google.maps.LatLng(referencePin.lat, referencePin.lng)] : []),
      ];
      polylineRef.current.setPath(path);
      polylineRef.current.setMap(points.length > 0 ? mapRef.current : null);
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] });
      }
    }
  }, [points, status, mode, pinColor, referencePin]);

  // Drawing listeners for drag-to-add mode
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return;
    const google = (window as any).google;
    const map = mapRef.current;
    let isDrawing = false;

    const onDown = (e: any) => {
      if (!multiAddMode) return;
      isDrawing = true;
      drawingPathRef.current = [{ lat: e.latLng.lat(), lng: e.latLng.lng() }];
      if (drawingPolylineRef.current) {
        drawingPolylineRef.current.setPath(drawingPathRef.current.map(p => new google.maps.LatLng(p.lat, p.lng)));
        drawingPolylineRef.current.setMap(map);
      }
      // change cursor
      map.setOptions({ draggableCursor: 'crosshair' });
    };

    const onMove = (e: any) => {
      if (!isDrawing) return;
      drawingPathRef.current.push({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      if (drawingPolylineRef.current) drawingPolylineRef.current.setPath(drawingPathRef.current.map(p => new google.maps.LatLng(p.lat, p.lng)));
    };

    const onUp = async (e: any) => {
      if (!isDrawing) return;
      isDrawing = false;
      if (drawingPolylineRef.current) drawingPolylineRef.current.setMap(null);
      map.setOptions({ draggableCursor: null });

      const sampled = samplePath(drawingPathRef.current, 40);
      if (sampled.length === 0) return;
      const newPoints = sampled.map((p) => ({ lat: p.lat, lng: p.lng, address: undefined } as PinnedPoint));
      // append immediately
      onChange([...points, ...newPoints]);

      // reverse geocode in background and update addresses
      for (let i = 0; i < newPoints.length; i++) {
        const addr = await reverseGeocode(newPoints[i].lat, newPoints[i].lng).catch(() => undefined);
        if (addr) {
          const base = [...points, ...newPoints];
          const idxStart = points.length;
          base[idxStart + i] = { ...base[idxStart + i], address: addr };
          onChange(base);
        }
      }
    };

    // register listeners
    const down = map.addListener('mousedown', onDown);
    const move = map.addListener('mousemove', onMove);
    const up = map.addListener('mouseup', onUp);
    drawingListenersRef.current = { down, move, up };

    return () => {
      try { down.remove(); move.remove(); up.remove(); } catch { }
      if (drawingPolylineRef.current) drawingPolylineRef.current.setMap(null);
      map.setOptions({ draggableCursor: null });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiAddMode, status, mapRef.current, points]);

  /* Sync reference pin (e.g. school) */
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return;
    const google = (window as any).google;

    if (referenceMarkerRef.current) {
      referenceMarkerRef.current.setMap(null);
      referenceMarkerRef.current = null;
    }

    if (!referencePin) return;

    referenceMarkerRef.current = new google.maps.Marker({
      position: { lat: referencePin.lat, lng: referencePin.lng },
      map: mapRef.current,
      icon: {
        url: buildPinSvg(referencePin.color ?? '#0ea5e9', 'S'),
        scaledSize: new google.maps.Size(36, 44),
        anchor: new google.maps.Point(18, 42),
      },
      title: referencePin.label ?? 'School',
      zIndex: 0,
    });
  }, [referencePin, status]);

  useEffect(() => {
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, []);

  const handleListItemClick = (idx: number) => {
    if (mapRef.current && points[idx]) {
      mapRef.current.panTo({ lat: points[idx].lat, lng: points[idx].lng });
      if ((mapRef.current.getZoom?.() ?? 0) < 14) mapRef.current.setZoom(15);
    }
    onSelectPoint?.(idx);
  };

  const addPointAtCenter = async () => {
    if (!mapRef.current) return;
    const c = mapRef.current.getCenter?.();
    if (!c) return;
    const lat = c.lat();
    const lng = c.lng();
    const addr = await reverseGeocode(lat, lng).catch(() => undefined);
    const newPoint: PinnedPoint = { lat, lng, address: addr };
    onChange([...points, newPoint]);
    const newIndex = points.length;
    // center and open rename/selection
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      if ((mapRef.current.getZoom?.() ?? 0) < 14) mapRef.current.setZoom(15);
    }
    // trigger select callback to allow parent to open rename modal
    onSelectPoint?.(newIndex);
  };

  const handleBulkAdd = async () => {
    setBulkError(null);
    setBulkLoading(true);
    const lines = bulkText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const added: PinnedPoint[] = [];
    for (const line of lines) {
      // try lat,lng
      const m = line.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
      if (m) {
        const lat = Number(m[1]);
        const lng = Number(m[2]);
        added.push({ lat, lng, address: undefined });
        continue;
      }
      // otherwise geocode as address
      try {
        const g = await geocodeAddress(line);
        if (g) added.push({ lat: g.lat, lng: g.lng, address: line });
        else {
          // skip unknown lines but record error
          setBulkError(`Could not locate: "${line}"`);
        }
      } catch (err) {
        setBulkError(`Failed to geocode: "${line}"`);
      }
    }

    if (added.length > 0) {
      onChange([...points, ...added]);
    }
    setBulkLoading(false);
    setBulkOpen(false);
    setBulkText('');
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string | undefined> => {
    if (!geocoderRef.current) return undefined;
    return new Promise((resolve) => {
      geocoderRef.current.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status === 'OK' && results?.[0]?.formatted_address) {
          resolve(results[0].formatted_address);
        } else {
          resolve(undefined);
        }
      });
    });
  };

  const metersBetween = (a: LatLng, b: LatLng) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const va = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(va), Math.sqrt(1-va));
    return R * c;
  };

  const samplePath = (path: LatLng[], minMeters = 50) => {
    if (!path || path.length === 0) return [] as LatLng[];
    const sampled: LatLng[] = [path[0]];
    let last = path[0];
    for (let i = 1; i < path.length; i++) {
      const p = path[i];
      const d = metersBetween(last, p);
      if (d >= minMeters) {
        sampled.push(p);
        last = p;
      }
    }
    // always include final point
    const lastPath = path[path.length - 1];
    if (sampled.length === 0 || (sampled[sampled.length - 1].lat !== lastPath.lat || sampled[sampled.length - 1].lng !== lastPath.lng)) sampled.push(lastPath);
    return sampled;
  };

  return (
    <div className="flex flex-col gap-3">
      {hint && (
        <div className="text-xs text-slate-400 leading-relaxed">
          {hint}
        </div>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 outline-none"
        />
        <button
          onClick={(e: any) => { if (e?.shiftKey) setBulkOpen(true); else addPointAtCenter(); }}
          title="Click to add a pin at map center (Shift+click for bulk paste)"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => setMultiAddMode((s) => !s)}
          title={multiAddMode ? 'Exit draw mode' : 'Draw route to add multiple points'}
          className={`absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-lg ${multiAddMode ? 'bg-emerald-600' : 'bg-slate-800'} hover:bg-slate-700 text-white`}
        >
          <MapPin size={14} />
        </button>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950" style={{ height }}>
        {status !== 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900">
            {status === 'error' ? (
              <div className="text-center px-6">
                <div className="text-white font-semibold mb-2">Map could not load</div>
                <div className="text-slate-400 text-sm">{error ?? 'Unknown error'}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <span className="text-slate-500 text-sm">Loading map…</span>
              </div>
            )}
          </div>
        )}
        <div ref={mapDivRef} className="w-full h-full" />
      </div>

      {mode === 'multi' && showOrderedList && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden">
          <div className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 bg-slate-800/40">
            {points.length} pickup {points.length === 1 ? 'point' : 'points'}
          </div>
          {points.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Click on the map or search a place to add a pickup point.
            </div>
          ) : (
            points.map((p, idx) => (
              <div key={idx} className="w-full px-4 py-3 hover:bg-slate-800/40 transition-colors flex items-center gap-3 group">
                <div className="w-7 h-7 rounded-full bg-purple-500/15 text-purple-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </div>
                <button onClick={() => handleListItemClick(idx)} className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium text-white truncate">
                    {p.label ?? p.address ?? `Pickup point ${idx + 1}`}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                    <MapPin size={10} />
                    {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                  </div>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onMovePoint && (
                    <>
                      <button
                        onClick={() => onMovePoint(idx, idx - 1)}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => onMovePoint(idx, idx + 1)}
                        disabled={idx === points.length - 1}
                        className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </>
                  )}
                  {onSelectPoint && (
                    <button
                      onClick={() => handleListItemClick(idx)}
                      className="p-1 rounded text-slate-500 hover:text-purple-300 hover:bg-slate-700"
                      title="Edit name"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  {onRemovePoint && (
                    <button
                      onClick={() => onRemovePoint(idx)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {bulkOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setBulkOpen(false)} />
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-white">Bulk add pickup points</div>
              <div className="text-xs text-slate-400">Paste one per line: "lat,lng" or an address</div>
            </div>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={8}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 outline-none"
              placeholder={`Example:\n12.9715987,77.594566\nMG Road, Bengaluru`}
            />
            {bulkError && <div className="mt-2 text-sm text-red-400">{bulkError}</div>}
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setBulkOpen(false)} className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400">Cancel</button>
              <button onClick={handleBulkAdd} disabled={bulkLoading} className="px-4 py-2 rounded-lg bg-purple-500 text-white">{bulkLoading ? 'Adding…' : 'Add points'}</button>
            </div>
          </div>
        </div>
      )}

      {mode === 'single' && points[0] && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center flex-shrink-0">
            <MapPin size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium truncate">
              {points[0].address ?? 'Pinned location'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {points[0].lat.toFixed(5)}, {points[0].lng.toFixed(5)} — drag the pin or click again to adjust.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
