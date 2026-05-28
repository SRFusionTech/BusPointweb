'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bus, Plus, RefreshCw, MoreVertical, Pencil, Trash2, UserCheck, UserX, MapPin } from 'lucide-react';
import { api, getSchool } from '@/lib/api';
import { useDashboardAutoRefresh } from '@/components/useDashboardAutoRefresh';

interface BusRow {
  id: string; plateNumber: string; routeName: string; routeId: string | null;
  status: string; capacity: number | null;
  make: string | null; model: string | null; year: number | null; color: string | null;
  driverId: string | null; notes: string | null;
}
interface Driver { id: string; name: string; phone: string | null; }
interface RouteOpt { id: string; name: string; stops: any[] }

const EMPTY_FORM = { plateNumber: '', routeId: '', routeName: '', capacity: '', make: '', model: '', year: '', color: '', notes: '' };

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

export default function BusesPage() {
  const school = getSchool();
  const [buses,      setBuses]      = useState<BusRow[]>([]);
  const [drivers,    setDrivers]    = useState<Driver[]>([]);
  const [routes,     setRoutes]     = useState<RouteOpt[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editBus,    setEditBus]    = useState<BusRow | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErr,    setFormErr]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openMenu,   setOpenMenu]   = useState<string | null>(null);
  const [flash,      setFlash]      = useState('');
  const [showDelete, setShowDelete] = useState<BusRow | null>(null);
  const [deleting,   setDeleting]   = useState(false);
  // driver assignment modal
  const [assignModal, setAssignModal] = useState<BusRow | null>(null);
  const [assignDriver, setAssignDriver] = useState('');
  const [assigning,    setAssigning]   = useState(false);

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3000); };

  const load = async () => {
    if (!school?.id) return;
    setLoading(true);
    try {
      const [b, d, r] = await Promise.all([
        api.getBuses(school.id),
        api.getDrivers(school.id),
        api.getRoutes(school.id),
      ]);
      setBuses(Array.isArray(b) ? b : []);
      setDrivers(Array.isArray(d) ? d : []);
      setRoutes(Array.isArray(r) ? r : []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useDashboardAutoRefresh(load);

  const openAdd = () => { setEditBus(null); setForm(EMPTY_FORM); setFormErr(''); setShowModal(true); };
  const openEdit = (b: BusRow) => {
    setEditBus(b);
    setForm({
      plateNumber: b.plateNumber,
      routeId: b.routeId ?? '',
      routeName: b.routeName,
      capacity: b.capacity?.toString() ?? '',
      make: b.make ?? '', model: b.model ?? '',
      year: b.year?.toString() ?? '', color: b.color ?? '', notes: b.notes ?? '',
    });
    setFormErr(''); setShowModal(true); setOpenMenu(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErr(''); setSubmitting(true);
    try {
      // When a structured route is selected, sync routeName from it so list views stay consistent.
      const selectedRoute = form.routeId ? routes.find(r => r.id === form.routeId) : null;
      const effectiveRouteName = (selectedRoute?.name ?? form.routeName)?.trim() || null;

      // Fields common to both create and update.
      const common: any = {
        plateNumber: form.plateNumber,
        routeName: effectiveRouteName,
        routeId: form.routeId || null,
        ...(form.capacity ? { capacity: Number(form.capacity) } : {}),
        ...(form.make ? { make: form.make } : {}),
        ...(form.model ? { model: form.model } : {}),
        ...(form.year ? { year: Number(form.year) } : {}),
        ...(form.color ? { color: form.color } : {}),
        ...(form.notes ? { notes: form.notes } : {}),
      };

      if (editBus) {
        // UpdateBusDto omits schoolId on purpose — sending it trips
        // forbidNonWhitelisted in the validator.
        await api.updateBus(editBus.id, common);
        showFlash('Bus updated.');
      } else {
        await api.createBus({ ...common, schoolId: school!.id });
        showFlash('Bus added.');
      }
      setShowModal(false); await load();
    } catch (err: any) { setFormErr(err.message ?? 'Failed to save bus.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setDeleting(true);
    try { await api.deleteBus(showDelete.id); setShowDelete(null); showFlash(`Bus "${showDelete.plateNumber}" deleted.`); await load(); }
    catch (err: any) { showFlash(err.message); }
    finally { setDeleting(false); }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal) return;
    setAssigning(true);
    try {
      if (!assignDriver) {
        // User selected "None" — unassign current driver
        await api.unassignDriver(assignModal.id);
        showFlash('Driver unassigned.');
      } else {
        // Assign (backend now auto-unassigns previous driver if any)
        await api.assignDriver({ busId: assignModal.id, driverId: assignDriver });
        showFlash(assignModal.driverId ? 'Driver changed.' : 'Driver assigned.');
      }
      setAssignModal(null); await load();
    } catch (err: any) { showFlash(err.message); }
    finally { setAssigning(false); }
  };

  const driverName = (id: string | null) => drivers.find(d => d.id === id)?.name ?? null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Buses</h1>
          <p className="text-slate-400 text-sm mt-1">{buses.length} bus{buses.length !== 1 ? 'es' : ''} in fleet</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm transition-colors shadow-lg shadow-purple-500/20">
            <Plus size={16} /> Add bus
          </button>
        </div>
      </div>

      {flash && <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{flash}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider rounded-tl-2xl">Bus / Route</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Driver</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3.5 rounded-tr-2xl" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : buses.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500">No buses yet. Add your first bus above.</td></tr>
            ) : (
              buses.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Bus size={13} className="text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {b.routeName || <span className="text-slate-500 italic font-normal">No route</span>}
                          {b.routeId ? (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/20 rounded px-1.5 py-0.5">
                              Mapped
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
                              No route
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{b.plateNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLOR[b.status] ?? 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {b.driverId ? (
                      <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                        <UserCheck size={13} className="text-emerald-400" />
                        {driverName(b.driverId) ?? 'Assigned'}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {[b.color, b.make, b.model, b.year].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative flex justify-end">
                      <button onClick={() => setOpenMenu(openMenu === b.id ? null : b.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors">
                        <MoreVertical size={15} />
                      </button>
                      {openMenu === b.id && (
                        <div className="absolute right-0 top-8 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-xl min-w-[180px] py-1">
                          <button onClick={() => openEdit(b)}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                            <Pencil size={13} /> Edit bus
                          </button>
                          <button onClick={() => { setAssignModal(b); setAssignDriver(b.driverId ?? ''); setOpenMenu(null); }}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-sky-400 hover:bg-slate-700 transition-colors">
                            {b.driverId ? <UserX size={13} /> : <UserCheck size={13} />}
                            {b.driverId ? 'Change driver' : 'Assign driver'}
                          </button>
                          <div className="border-t border-slate-700 my-1" />
                          <button onClick={() => { setShowDelete(b); setOpenMenu(null); }}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors">
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Bus Modal */}
      {showModal && (
        <ModalWrap title={editBus ? 'Edit bus' : 'Add new bus'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {formErr && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{formErr}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Plate Number *</label>
                <input required value={form.plateNumber} onChange={e => setForm({...form, plateNumber: e.target.value})}
                  placeholder="e.g. MH-12-AB-1234"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Route</label>
                  <Link href="/dashboard/routes" target="_blank" className="text-[11px] font-semibold text-purple-400 hover:text-purple-300">
                    + Create a new route
                  </Link>
                </div>
                {routes.length > 0 ? (
                  <select
                    value={form.routeId}
                    onChange={e => {
                      const id = e.target.value;
                      const r = routes.find(r => r.id === id);
                      setForm({ ...form, routeId: id, routeName: r?.name ?? form.routeName });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none">
                    <option value="">— Pick a configured route —</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.name} · {r.stops?.length ?? 0} stops</option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-3 rounded-xl border border-dashed border-slate-700 text-xs text-slate-500 flex items-center gap-2">
                    <MapPin size={13} />
                    No routes configured yet. <Link href="/dashboard/routes" className="text-purple-400 hover:text-purple-300 font-semibold">Create one →</Link>
                  </div>
                )}

                <div className="mt-2">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Or label</label>
                  <input
                    value={form.routeName}
                    onChange={e => setForm({...form, routeName: e.target.value})}
                    placeholder={form.routeId ? 'Inherited from route' : 'e.g. Morning Route A'}
                    disabled={!!form.routeId}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none disabled:opacity-60" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Capacity</label>
                <input type="number" min={1} value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}
                  placeholder="40"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Color</label>
                <input value={form.color} onChange={e => setForm({...form, color: e.target.value})}
                  placeholder="Yellow"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Make</label>
                <input value={form.make} onChange={e => setForm({...form, make: e.target.value})}
                  placeholder="Tata"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Model</label>
                <input value={form.model} onChange={e => setForm({...form, model: e.target.value})}
                  placeholder="Starbus"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Notes</label>
                <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  placeholder="Optional notes"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
                {submitting ? 'Saving…' : editBus ? 'Update bus' : 'Add bus'}
              </button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* Assign Driver Modal */}
      {assignModal && (
        <ModalWrap title={assignModal.driverId ? `Change driver — ${assignModal.routeName ?? assignModal.plateNumber}` : `Assign driver — ${assignModal.routeName ?? assignModal.plateNumber}`} onClose={() => setAssignModal(null)}>
          <form onSubmit={handleAssign} className="flex flex-col gap-4">
            {assignModal.driverId && (
              <div className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-400">
                Current driver: <span className="text-white font-semibold">{driverName(assignModal.driverId) ?? 'Unknown'}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                {assignModal.driverId ? 'Change to' : 'Select Driver'}
              </label>
              <select value={assignDriver} onChange={e => setAssignDriver(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none">
                <option value="">— None (unassign) —</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}{d.phone ? ` · ${d.phone}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setAssignModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={assigning}
                className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
                {assigning ? 'Saving…' : assignModal.driverId ? 'Change' : 'Assign'}
              </button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <ModalWrap title="Delete bus" onClose={() => setShowDelete(null)} width="max-w-sm">
          <p className="text-slate-400 text-sm mb-6">
            Permanently delete <strong className="text-white">{showDelete.plateNumber}</strong> ({showDelete.routeName})?
            All driver assignments will also be removed.
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
        </ModalWrap>
      )}

      {openMenu && <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />}
    </div>
  );
}

function ModalWrap({ title, onClose, children, width = 'max-w-lg' }: {
  title: string; onClose: () => void; children: React.ReactNode; width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
