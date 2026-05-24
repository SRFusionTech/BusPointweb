'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, MapPin } from 'lucide-react';
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
}: Props) {
  const { status, error } = useGoogleMaps();
  const mapDivRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const referenceMarkerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  const [searchValue, setSearchValue] = useState('');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
  }, [points, status, mode, pinColor, referencePin]);

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
              <button
                key={idx}
                onClick={() => onSelectPoint?.(idx)}
                className="w-full text-left px-4 py-3 hover:bg-slate-800/40 transition-colors flex items-center gap-3 group"
              >
                <div className="w-7 h-7 rounded-full bg-purple-500/15 text-purple-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {p.label ?? p.address ?? `Pickup point ${idx + 1}`}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                    <MapPin size={10} />
                    {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                  </div>
                </div>
                {onRemovePoint && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePoint(idx);
                    }}
                    className="text-xs text-slate-600 hover:text-red-400 px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Remove
                  </span>
                )}
              </button>
            ))
          )}
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
