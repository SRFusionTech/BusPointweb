'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Bus, MapPin, Navigation } from 'lucide-react';
import { api, getSchool } from '@/lib/api';
import { useDashboardAutoRefresh } from '@/components/useDashboardAutoRefresh';

const STATUS_COLOR: Record<string, string> = {
  started:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  at_school: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  returning: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  idle:      'text-slate-400 bg-slate-800 border-slate-700',
  ended:     'text-slate-500 bg-slate-800/50 border-slate-700/50',
  inactive:  'text-red-400 bg-red-500/10 border-red-500/20',
  maintenance: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};
const STATUS_LABEL: Record<string, string> = {
  started: 'On Route', at_school: 'At School', returning: 'Returning',
  idle: 'Idle', ended: 'Trip Ended', inactive: 'Inactive',
  maintenance: 'Maintenance', gps_lost: 'GPS Lost',
};

export default function MapPage() {
  const school  = getSchool();
  const mapRef  = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const infoWindow = useRef<any>(null);

  const [buses,     setBuses]     = useState<any[]>([]);
  const [selected,  setSelected]  = useState<any | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [mapReady,  setMapReady]  = useState(false);
  const [mapError,  setMapError]  = useState('');

  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  const createBusIcon = (color: string) => {
    const g = (window as any).google;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42" fill="none">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
          </filter>
        </defs>
        <g filter="url(#shadow)">
          <rect x="10" y="7" width="22" height="26" rx="6" fill="${color}"/>
          <rect x="13" y="11" width="16" height="9" rx="2" fill="#ffffff" fill-opacity="0.88"/>
          <rect x="13" y="22" width="5" height="4" rx="1" fill="#ffffff" fill-opacity="0.82"/>
          <rect x="20.5" y="22" width="5" height="4" rx="1" fill="#ffffff" fill-opacity="0.82"/>
          <rect x="28" y="22" width="1" height="4" rx="0.5" fill="#ffffff" fill-opacity="0.82"/>
          <circle cx="15" cy="32" r="3" fill="#1e293b"/>
          <circle cx="27" cy="32" r="3" fill="#1e293b"/>
        </g>
      </svg>
    `.trim();
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new g.maps.Size(34, 34),
      anchor: new g.maps.Point(17, 17),
    };
  };

  /* ── Load Google Maps JS once ── */
  useEffect(() => {
    if ((window as any).google?.maps) {
      setMapReady(true);
      return;
    }

    if (!googleMapsKey) {
      setMapError('Missing Google Maps API key.');
      return;
    }

    if (document.getElementById('google-maps-js')) return;

    const script = document.createElement('script');
    script.id = 'google-maps-js';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&v=weekly`;
    script.onload = () => setMapReady(true);
    script.onerror = () => setMapError('Failed to load Google Maps.');
    document.head.appendChild(script);
  }, []);

  /* ── Initialize map once Google Maps is ready ── */
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInst.current) return;

    const google = (window as any).google;
    if (!google?.maps) return;

    mapInst.current = new google.maps.Map(mapRef.current, {
      center: { lat: 20.5937, lng: 78.9629 },
      zoom: 5,
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

    infoWindow.current = new google.maps.InfoWindow();
  }, [mapReady]);

  /* ── Fetch bus data ── */
  const load = async () => {
    if (!school?.id) return;
    setLoading(true);
    try {
      const result = await api.getBuses(school.id);
      setBuses(Array.isArray(result) ? result : []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useDashboardAutoRefresh(load);

  /* ── Place / update markers whenever buses or map changes ── */
  useEffect(() => {
    if (!mapInst.current || !(window as any).google?.maps || !Array.isArray(buses)) return;
    const google = (window as any).google;

    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];

    const withGps = buses.filter(b => b.lastLat && b.lastLng);
    withGps.forEach(b => {
      const color = ['started','at_school','returning'].includes(b.status) ? '#10b981' : '#64748b';
      const marker = new google.maps.Marker({
        position: { lat: b.lastLat, lng: b.lastLng },
        map: mapInst.current,
        icon: createBusIcon(color),
        title: b.routeName,
      });

      marker.addListener('click', () => {
        setSelected(b);
        if (infoWindow.current) {
          infoWindow.current.setContent(`
            <div style="font-family:system-ui,sans-serif;min-width:160px">
              <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px">${b.routeName}</div>
              <div style="font-size:12px;color:#475569;margin-bottom:6px">${b.plateNumber}</div>
              <div style="font-size:12px;font-weight:600;color:#22c55e">${STATUS_LABEL[b.status] ?? b.status}</div>
            </div>
          `);
          infoWindow.current.open({ map: mapInst.current, anchor: marker });
        }
      });

      markers.current.push(marker);
    });

    if (withGps.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      withGps.forEach((b) => bounds.extend({ lat: b.lastLat, lng: b.lastLng }));
      mapInst.current.fitBounds(bounds, 48);
    }
  }, [buses, mapReady]);

  const activeBuses = (buses ?? []).filter(b => ['started','at_school','returning'].includes(b.status));

  return (
    <div className="flex flex-col h-full gap-4" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Map</h1>
          <p className="text-slate-400 text-sm mt-1">
            {activeBuses.length} bus{activeBuses.length !== 1 ? 'es' : ''} active · {buses.filter(b => b.lastLat).length} with GPS
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Bus list panel */}
        <div className="w-72 flex-shrink-0 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Fleet Status
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3.5 animate-pulse flex gap-3">
                  <div className="w-7 h-7 bg-slate-800 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-800 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : buses.length === 0 ? (
              <div className="px-4 py-10 text-center text-slate-600 text-xs">No buses found.</div>
            ) : (
              (buses ?? []).map(b => (
                <button key={b.id}
                  onClick={() => {
                    setSelected(b);
                    if (b.lastLat && b.lastLng && mapInst.current) {
                      mapInst.current.panTo({ lat: b.lastLat, lng: b.lastLng });
                      mapInst.current.setZoom(14);
                    }
                  }}
                  className={`w-full text-left px-4 py-3.5 hover:bg-slate-800/60 transition-colors ${selected?.id === b.id ? 'bg-slate-800/60' : ''}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      ['started','at_school','returning'].includes(b.status) ? 'bg-emerald-500/20' : 'bg-slate-800'
                    }`}>
                      <Bus size={12} className={['started','at_school','returning'].includes(b.status) ? 'text-emerald-400' : 'text-slate-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{b.routeName}</div>
                      <div className="text-[11px] text-slate-500">{b.plateNumber}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_COLOR[b.status] ?? STATUS_COLOR.idle}`}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                    {b.lastLat ? (
                      <span className="text-[11px] text-emerald-500 flex items-center gap-0.5"><Navigation size={9} /> GPS</span>
                    ) : (
                      <span className="text-[11px] text-slate-700">No GPS</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative">
          {!mapReady && !mapError && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <span className="text-slate-500 text-sm">Loading map…</span>
              </div>
            </div>
          )}
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900">
              <div className="text-center px-6">
                <div className="text-white font-semibold mb-2">Google Maps could not load</div>
                <div className="text-slate-400 text-sm">{mapError}</div>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />

          {/* Selected bus overlay */}
          {selected && (
            <div className="absolute bottom-4 left-4 right-4 z-[400] bg-slate-900/95 border border-slate-700 rounded-xl p-4 backdrop-blur-sm shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bus size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{selected.routeName}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLOR[selected.status] ?? STATUS_COLOR.idle}`}>
                      {STATUS_LABEL[selected.status] ?? selected.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{selected.plateNumber}</div>
                  {selected.lastLat && (
                    <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                      <MapPin size={10} />
                      {selected.lastLat.toFixed(5)}, {selected.lastLng.toFixed(5)}
                      {selected.lastUpdated && ` · ${new Date(selected.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-lg leading-none">✕</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
