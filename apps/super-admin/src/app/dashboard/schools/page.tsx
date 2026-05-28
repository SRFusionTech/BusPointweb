'use client';

import { useEffect, useState } from 'react';
import { Building2, Plus, Search, MoreVertical, RefreshCw, Eye, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Modal from '@/components/ui/modal';
import Badge from '@/components/ui/badge';

interface School {
  id: string; name: string; location: string;
  adminEmail: string | null; adminName: string | null;
  userCount: number; busCount: number;
  suspended: boolean; createdAt: string;
}

const EMPTY_FORM = { schoolName: '', location: '', adminEmail: '', adminName: '', adminPassword: '' };

export default function SchoolsPage() {
  const [schools,    setSchools]    = useState<School[]>([]);
  const [filtered,   setFiltered]   = useState<School[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErr,    setFormErr]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openMenu,   setOpenMenu]   = useState<string | null>(null);
  const [actionMsg,  setActionMsg]  = useState('');
  const [showDelete, setShowDelete] = useState<School | null>(null);
  const [deleting,   setDeleting]   = useState(false);
  const [actioning,  setActioning]  = useState<string | null>(null);
  const [loadError,  setLoadError]  = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try { const data = await api.getSchools(); setSchools(data); setFiltered(data); }
    catch (err: any) { setLoadError(err?.message ?? 'Failed to load schools.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(schools.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      (s.adminEmail ?? '').toLowerCase().includes(q),
    ));
  }, [search, schools]);

  const flash = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    setSubmitting(true);
    try {
      await api.provisionSchool(form);
      setShowModal(false);
      setForm(EMPTY_FORM);
      flash('School provisioned successfully.');
      await load();
    } catch (err: any) { setFormErr(err.message ?? 'Failed to provision school.'); }
    finally { setSubmitting(false); }
  };

  const handleSuspend = async (s: School) => {
    setOpenMenu(null);
    setActioning(s.id);
    try { await api.suspendSchool(s.id); flash(`"${s.name}" suspended.`); await load(); }
    catch (err: any) { flash(err.message); }
    finally { setActioning(null); }
  };

  const handleReinstate = async (s: School) => {
    setOpenMenu(null);
    setActioning(s.id);
    try { await api.reinstateSchool(s.id); flash(`"${s.name}" reinstated.`); await load(); }
    catch (err: any) { flash(err.message); }
    finally { setActioning(null); }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setDeleting(true);
    try { await api.deleteSchool(showDelete.id); setShowDelete(null); flash(`"${showDelete.name}" deleted.`); await load(); }
    catch (err: any) { flash(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Schools</h1>
          <p className="text-slate-400 text-sm mt-1">{schools.length} school{schools.length !== 1 ? 's' : ''} on the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setShowModal(true); setFormErr(''); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-colors shadow-lg shadow-sky-500/20">
            <Plus size={16} /> Provision school
          </button>
        </div>
      </div>

      {/* Flash message */}
      {actionMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{actionMsg}</div>
      )}
      {loadError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{loadError}</div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by school name, location, or admin email…"
          className="w-full bg-slate-900 border border-slate-800 focus:border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors" />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider rounded-tl-2xl">School</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Buses</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Users</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Added</th>
              <th className="px-6 py-3.5 rounded-tr-2xl" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                {search ? 'No schools match your search.' : 'No schools yet. Provision your first school above.'}
              </td></tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className={`hover:bg-slate-800/40 transition-colors ${actioning === s.id ? 'opacity-50 pointer-events-none' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Building2 size={13} className="text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-300">{s.adminName ?? '—'}</div>
                    <div className="text-xs text-slate-500">{s.adminEmail ?? '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-medium">{s.busCount}</td>
                  <td className="px-6 py-4 text-slate-300 font-medium">{s.userCount}</td>
                  <td className="px-6 py-4">
                    <Badge label={s.suspended ? 'Suspended' : 'Active'} color={s.suspended ? 'red' : 'green'} />
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative flex justify-end">
                      <button onClick={() => setOpenMenu(openMenu === s.id ? null : s.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors">
                        <MoreVertical size={15} />
                      </button>
                      {openMenu === s.id && (
                        <div className="absolute right-0 top-8 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-xl min-w-[160px] py-1">
                          <Link href={`/dashboard/schools/${s.id}`} onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                            <Eye size={14} /> View details
                          </Link>
                          {s.suspended ? (
                            <button onClick={() => handleReinstate(s)}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-emerald-400 hover:bg-slate-700 transition-colors">
                              <PlayCircle size={14} /> Reinstate
                            </button>
                          ) : (
                            <button onClick={() => handleSuspend(s)}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-amber-400 hover:bg-slate-700 transition-colors">
                              <PauseCircle size={14} /> Suspend
                            </button>
                          )}
                          <div className="border-t border-slate-700 my-1" />
                          <button onClick={() => { setOpenMenu(null); setShowDelete(s); }}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors">
                            <Trash2 size={14} /> Delete
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

      {/* Provision School Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Provision new school" width="max-w-xl">
        <form onSubmit={handleProvision} className="flex flex-col gap-4">
          {formErr && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{formErr}</div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">School Details</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input required placeholder="School name" value={form.schoolName}
                  onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors" />
              </div>
              <div className="col-span-2">
                <input required placeholder="Location (e.g. Mumbai, Maharashtra)" value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Admin Account</label>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Admin full name" value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                className="bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors" />
              <input required type="email" placeholder="Admin email" value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                className="bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors" />
              <div className="col-span-2">
                <input required type="password" placeholder="Temporary password for admin" value={form.adminPassword}
                  onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors" />
                <p className="text-xs text-slate-600 mt-1.5">Share this password with the school admin. They should change it after first login.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
              {submitting ? 'Provisioning…' : 'Provision school'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!showDelete} onClose={() => setShowDelete(null)} title="Delete school" width="max-w-sm">
        <p className="text-slate-400 text-sm mb-6">
          This will permanently delete <strong className="text-white">{showDelete?.name}</strong> and all associated users and buses. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setShowDelete(null)}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </Modal>

      {/* Click outside to close menu */}
      {openMenu && <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />}
    </div>
  );
}
