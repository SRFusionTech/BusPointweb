'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, MoreVertical, Pencil, Trash2, MapPin, Flag, Route as RouteIcon } from 'lucide-react';
import { api, getSchool } from '@/lib/api';
import { useDashboardAutoRefresh } from '@/components/useDashboardAutoRefresh';
import RouteWizard from '@/components/RouteWizard';

interface RouteRow {
  id: string;
  name: string;
  startLat: number;
  startLng: number;
  startAddress: string | null;
  notes: string | null;
  stops: Array<{ id: string; name: string; lat: number; lng: number; stopOrder: number }>;
  createdAt: string;
}

export default function RoutesPage() {
  const school = getSchool();
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState<RouteRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [flash, setFlash] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editRouteId, setEditRouteId] = useState<string | null>(null);

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3000); };

  const load = async () => {
    if (!school?.id) return;
    setLoading(true);
    try {
      const r = await api.getRoutes(school.id);
      setRoutes(Array.isArray(r) ? r : []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useDashboardAutoRefresh(load);

  const openAdd = () => { setEditRouteId(null); setWizardOpen(true); };
  const openEdit = (r: RouteRow) => { setEditRouteId(r.id); setWizardOpen(true); setOpenMenu(null); };

  const handleDelete = async () => {
    if (!showDelete) return;
    setDeleting(true);
    try {
      await api.deleteRoute(showDelete.id);
      showFlash(`Route "${showDelete.name}" deleted.`);
      setShowDelete(null);
      await load();
    } catch (err: any) { showFlash(err?.message ?? 'Failed to delete route.'); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Routes</h1>
          <p className="text-slate-400 text-sm mt-1">
            {routes.length} route{routes.length !== 1 ? 's' : ''} configured for {school?.name ?? 'your school'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm transition-colors shadow-lg shadow-purple-500/20">
            <Plus size={16} /> Create route
          </button>
        </div>
      </div>

      {flash && <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{flash}</div>}

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-6 py-5 border-b border-slate-800 last:border-0 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-800 rounded w-1/3" />
                <div className="h-2.5 bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : routes.length === 0 ? (
        <EmptyState onAdd={openAdd} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {routes.map((r) => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <RouteIcon size={18} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold truncate">{r.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Created {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <div className="relative">
                  <button onClick={() => setOpenMenu(openMenu === r.id ? null : r.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
                    <MoreVertical size={15} />
                  </button>
                  {openMenu === r.id && (
                    <div className="absolute right-0 top-8 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-xl min-w-[160px] py-1">
                      <button onClick={() => openEdit(r)}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                        <Pencil size={13} /> Edit route
                      </button>
                      <div className="border-t border-slate-700 my-1" />
                      <button onClick={() => { setShowDelete(r); setOpenMenu(null); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-400 mb-3">
                <Flag size={13} className="flex-shrink-0 mt-0.5 text-purple-400" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">Start</div>
                  <div className="truncate text-slate-300">{r.startAddress ?? `${r.startLat.toFixed(4)}, ${r.startLng.toFixed(4)}`}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin size={13} className="text-emerald-400" />
                  <span className="font-semibold text-white">{r.stops?.length ?? 0}</span> stops
                </div>
                {r.notes && (
                  <div className="text-[11px] text-slate-500 truncate flex-1 italic">"{r.notes}"</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDelete(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Delete route</h2>
            </div>
            <div className="px-6 py-5">
              <p className="text-slate-400 text-sm mb-6">
                Permanently delete <strong className="text-white">{showDelete.name}</strong>?
                All {showDelete.stops?.length ?? 0} pickup point{showDelete.stops?.length === 1 ? '' : 's'} will be removed too.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {openMenu && <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />}

      <RouteWizard
        open={wizardOpen}
        editRouteId={editRouteId}
        onClose={() => setWizardOpen(false)}
        onCreated={() => { showFlash(editRouteId ? 'Route updated.' : 'Route created.'); load(); }}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl px-6 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
        <RouteIcon size={22} className="text-purple-400" />
      </div>
      <h3 className="text-white font-bold text-lg mb-1.5">No routes yet</h3>
      <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
        Create your first route in three steps: confirm the school location, set the starting point, and add every pickup spot where students board.
      </p>
      <button onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm transition-colors shadow-lg shadow-purple-500/20">
        <Plus size={16} /> Create your first route
      </button>
    </div>
  );
}
