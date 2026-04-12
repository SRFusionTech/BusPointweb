'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Bus, MapPin, Navigation } from 'lucide-react';
import { api, getSchool } from '@/lib/api';

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
  const leaflet = useRef<any>(null);
  const mapInst = useRef<any>(null);
  const markers = useRef<any[]>([]);

  const [buses,     setBuses]     = useState<any[]>([]);
  const [selected,  setSelected]  = useState<any | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [mapReady,  setMapReady]  = useState(false);

  /* ── Load Leaflet from CDN once ── */
  useEffect(() => {
    // If Leaflet JS is already available (e.g. StrictMode double-invoke), just signal ready.
    if ((window as any).L) { setMapReady(true); return; }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id   = 'leaflet-css';
      link.rel  = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id  = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapReady(true);
      document.head.appendChild(script);
    }
  }, []);

  /* ── Initialize map once Leaflet is ready ── */
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInst.current) return;
    const L = (window as any).L;
    leaflet.current = L;
    mapInst.current = L.map(mapRef.current, { zoomControl: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapInst.current);
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

  /* ── Place / update markers whenever buses or map changes ── */
  useEffect(() => {
    if (!mapInst.current || !leaflet.current || !Array.isArray(buses)) return;
    const L = leaflet.current;

    // Remove old markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    const withGps = buses.filter(b => b.lastLat && b.lastLng);
    withGps.forEach(b => {
      const color = ['started','at_school','returning'].includes(b.status) ? '#10b981' : '#64748b';
      const icon = L.divIcon({
        html: `<div style="background:${color};width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        iconSize: [28, 28], iconAnchor: [14, 28], className: '',
      });
      const m = L.marker([b.lastLat, b.lastLng], { icon })
        .addTo(mapInst.current)
        .bindPopup(`<b>${b.routeName}</b><br>${b.plateNumber}<br>Status: ${STATUS_LABEL[b.status] ?? b.status}`);
      markers.current.push(m);
    });

    if (withGps.length > 0) {
      const group = L.featureGroup(markers.current);
      mapInst.current.fitBounds(group.getBounds().pad(0.3));
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
                      mapInst.current.setView([b.lastLat, b.lastLng], 14);
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
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <span className="text-slate-500 text-sm">Loading map…</span>
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
