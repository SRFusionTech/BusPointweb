'use client';

import { useEffect, useState } from 'react';
import { UserCheck, Plus, RefreshCw, MoreVertical, Pencil, Trash2, Bus } from 'lucide-react';
import { api, getSchool } from '@/lib/api';
import { useDashboardAutoRefresh } from '@/components/useDashboardAutoRefresh';

interface Driver { id: string; name: string; email: string; phone: string | null; busId: string | null; isActive: boolean; }
interface BusRow  { id: string; routeName: string; plateNumber: string; driverId: string | null; }

const EMPTY_FORM = { firstName: '', lastName: '', phone: '', email: '' };

export default function DriversPage() {
  const school = getSchool();
  const [drivers,    setDrivers]    = useState<Driver[]>([]);
  const [buses,      setBuses]      = useState<BusRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErr,    setFormErr]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openMenu,   setOpenMenu]   = useState<string | null>(null);
  const [flash,      setFlash]      = useState('');
  const [showDelete, setShowDelete] = useState<Driver | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3000); };

  const load = async () => {
    if (!school?.id) return;
    setLoading(true);
    try {
      const [d, b] = await Promise.all([api.getDrivers(school.id), api.getBuses(school.id)]);
      setDrivers(Array.isArray(d) ? d : []); setBuses(Array.isArray(b) ? b : []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useDashboardAutoRefresh(load);

  const openAdd = () => { setEditDriver(null); setForm(EMPTY_FORM); setFormErr(''); setShowModal(true); };
  const openEdit = (d: Driver) => {
    setEditDriver(d);
    const [firstName, ...rest] = (d.name ?? '').split(' ');
    setForm({ firstName, lastName: rest.join(' '), phone: d.phone ?? '', email: d.email });
    setFormErr(''); setShowModal(true); setOpenMenu(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErr(''); setSubmitting(true);
    try {
      if (editDriver) {
        await api.updateUser(editDriver.id, {
          firstName: form.firstName, lastName: form.lastName || 'Driver',
          name: `${form.firstName} ${form.lastName}`.trim(),
          phone: form.phone || null, email: form.email,
        });
        showFlash('Driver updated.');
      } else {
        await api.createUser({
          firstName: form.firstName, lastName: form.lastName || 'Driver',
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email || `${form.phone}@buspoint.app`,
          phone: form.phone,
          role: 'driver', schoolId: school!.id,
        });
        showFlash('Driver added.');
      }
      setShowModal(false); await load();
    } catch (err: any) { setFormErr(err.message ?? 'Failed to save driver.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setDeleting(true);
    try { await api.deleteUser(showDelete.id); setShowDelete(null); showFlash(`Driver "${showDelete.name}" removed.`); await load(); }
    catch (err: any) { showFlash(err.message); }
    finally { setDeleting(false); }
  };

  const busForDriver = (driverId: string) => buses.find(b => b.driverId === driverId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Drivers</h1>
          <p className="text-slate-400 text-sm mt-1">{drivers.length} driver{drivers.length !== 1 ? 's' : ''} registered</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm transition-colors shadow-lg shadow-purple-500/20">
            <Plus size={16} /> Add driver
          </button>
        </div>
      </div>

      {flash && <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{flash}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider rounded-tl-2xl">Driver</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Bus</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
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
            ) : drivers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500">No drivers yet. Add your first driver above.</td></tr>
            ) : (
              drivers.map((d) => {
                const assignedBus = busForDriver(d.id);
                return (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
                          <UserCheck size={13} className="text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{d.name}</div>
                          <div className="text-xs text-slate-500">{d.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{d.phone ?? '—'}</td>
                    <td className="px-6 py-4">
                      {assignedBus ? (
                        <div className="flex items-center gap-1.5">
                          <Bus size={13} className="text-sky-400" />
                          <span className="text-slate-300 text-sm">{assignedBus.routeName}</span>
                          <span className="text-slate-600 text-xs">· {assignedBus.plateNumber}</span>
                        </div>
                      ) : <span className="text-slate-600 text-xs">Not assigned</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${d.isActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-500 bg-slate-800 border-slate-700'}`}>
                        {d.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative flex justify-end">
                        <button onClick={() => setOpenMenu(openMenu === d.id ? null : d.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors">
                          <MoreVertical size={15} />
                        </button>
                        {openMenu === d.id && (
                          <div className="absolute right-0 top-8 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-xl min-w-[160px] py-1">
                            <button onClick={() => openEdit(d)}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                              <Pencil size={13} /> Edit
                            </button>
                            <div className="border-t border-slate-700 my-1" />
                            <button onClick={() => { setShowDelete(d); setOpenMenu(null); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors">
                              <Trash2 size={13} /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <ModalWrap title={editDriver ? 'Edit driver' : 'Add driver'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {formErr && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{formErr}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">First Name *</label>
                <input required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})}
                  placeholder="Ravi"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Last Name</label>
                <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})}
                  placeholder="Kumar"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Phone *</label>
                <input required={!editDriver} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="9876543210"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="Auto-generated if blank"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
            </div>
            {!editDriver && <p className="text-xs text-slate-600">Driver logs in via the mobile app using their phone number (OTP).</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
                {submitting ? 'Saving…' : editDriver ? 'Update' : 'Add driver'}
              </button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <ModalWrap title="Remove driver" onClose={() => setShowDelete(null)} width="max-w-sm">
          <p className="text-slate-400 text-sm mb-6">
            Remove <strong className="text-white">{showDelete.name}</strong> from the system?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDelete(null)}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
              {deleting ? 'Removing…' : 'Remove'}
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
