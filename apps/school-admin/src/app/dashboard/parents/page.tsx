'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, RefreshCw, MoreVertical, Pencil, Trash2, CreditCard, Search } from 'lucide-react';
import { api, getSchool } from '@/lib/api';

interface Parent { id: string; name: string; email: string; phone: string | null; childName: string | null; busId: string | null; subStatus: string | null; subExpiry: string | null; isActive: boolean; }
interface BusRow { id: string; routeName: string; plateNumber: string; }

const EMPTY_FORM = { firstName: '', lastName: '', phone: '', email: '', childName: '', busId: '' };

export default function ParentsPage() {
  const school = getSchool();
  const [parents,    setParents]    = useState<Parent[]>([]);
  const [buses,      setBuses]      = useState<BusRow[]>([]);
  const [filtered,   setFiltered]   = useState<Parent[]>([]);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editParent, setEditParent] = useState<Parent | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErr,    setFormErr]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openMenu,   setOpenMenu]   = useState<string | null>(null);
  const [flash,      setFlash]      = useState('');
  const [flashErr,   setFlashErr]   = useState('');
  const [showDelete, setShowDelete] = useState<Parent | null>(null);
  const [deleting,   setDeleting]   = useState(false);
  const [actioning,  setActioning]  = useState<string | null>(null);

  const showFlash = (msg: string, err = false) => {
    if (err) { setFlashErr(msg); setTimeout(() => setFlashErr(''), 3500); }
    else     { setFlash(msg);    setTimeout(() => setFlash(''), 3000); }
  };

  const load = async () => {
    if (!school?.id) return;
    setLoading(true);
    try {
      const [p, b] = await Promise.all([api.getParents(school.id), api.getBuses(school.id)]);
      const parents = Array.isArray(p) ? p : [];
      setParents(parents); setFiltered(parents); setBuses(Array.isArray(b) ? b : []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(parents.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      (p.phone ?? '').includes(q) ||
      (p.childName ?? '').toLowerCase().includes(q),
    ));
  }, [search, parents]);

  const openAdd = () => { setEditParent(null); setForm(EMPTY_FORM); setFormErr(''); setShowModal(true); };
  const openEdit = (p: Parent) => {
    setEditParent(p);
    const [firstName, ...rest] = (p.name ?? '').split(' ');
    setForm({ firstName, lastName: rest.join(' '), phone: p.phone ?? '', email: p.email, childName: p.childName ?? '', busId: p.busId ?? '' });
    setFormErr(''); setShowModal(true); setOpenMenu(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErr(''); setSubmitting(true);
    try {
      const name = `${form.firstName} ${form.lastName}`.trim();
      if (editParent) {
        await api.updateUser(editParent.id, {
          firstName: form.firstName, lastName: form.lastName || 'Parent',
          name, phone: form.phone || null, email: form.email,
          childName: form.childName || null, busId: form.busId || null,
        });
        showFlash('Parent updated.');
      } else {
        await api.createUser({
          firstName: form.firstName, lastName: form.lastName || 'Parent',
          name, phone: form.phone,
          email: form.email || `${form.phone}@buspoint.app`,
          role: 'parent', schoolId: school!.id,
          childName: form.childName || null,
          busId: form.busId || null,
        });
        showFlash('Parent added.');
      }
      setShowModal(false); await load();
    } catch (err: any) { setFormErr(err.message ?? 'Failed to save.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setDeleting(true);
    try { await api.deleteUser(showDelete.id); setShowDelete(null); showFlash(`"${showDelete.name}" removed.`); await load(); }
    catch (err: any) { showFlash(err.message, true); }
    finally { setDeleting(false); }
  };

  const handleActivate = async (p: Parent) => {
    setOpenMenu(null); setActioning(p.id);
    try { await api.activateSubscription(p.id, school!.id); showFlash(`Subscription activated for ${p.name}.`); await load(); }
    catch (err: any) { showFlash(err.message, true); }
    finally { setActioning(null); }
  };

  const handleRevoke = async (p: Parent) => {
    setOpenMenu(null); setActioning(p.id);
    try { await api.revokeSubscription(p.id); showFlash(`Subscription revoked for ${p.name}.`); await load(); }
    catch (err: any) { showFlash(err.message, true); }
    finally { setActioning(null); }
  };

  const busName = (id: string | null) => { const b = buses.find(b => b.id === id); return b ? `${b.routeName} · ${b.plateNumber}` : null; };
  const subActive = (p: Parent) => p.subStatus === 'active' && (!p.subExpiry || new Date(p.subExpiry) > new Date());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Parents</h1>
          <p className="text-slate-400 text-sm mt-1">{parents.length} parent{parents.length !== 1 ? 's' : ''} enrolled</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm transition-colors shadow-lg shadow-purple-500/20">
            <Plus size={16} /> Add parent
          </button>
        </div>
      </div>

      {flash    && <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{flash}</div>}
      {flashErr && <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{flashErr}</div>}

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, or child name…"
          className="w-full bg-slate-900 border border-slate-800 focus:border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider rounded-tl-2xl">Parent</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Child / Bus</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subscription</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
              <th className="px-6 py-3.5 rounded-tr-2xl" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                {search ? 'No parents match your search.' : 'No parents yet. Add your first parent above.'}
              </td></tr>
            ) : (
              filtered.map((p) => {
                const active = subActive(p);
                return (
                  <tr key={p.id} className={`hover:bg-slate-800/40 transition-colors ${actioning === p.id ? 'opacity-50 pointer-events-none' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                          <Users size={13} className="text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.phone ?? p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300 text-sm">{p.childName ?? '—'}</div>
                      {p.busId && <div className="text-xs text-slate-500">{busName(p.busId) ?? 'Bus assigned'}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${active ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-500 bg-slate-800 border-slate-700'}`}>
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {p.subExpiry ? new Date(p.subExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative flex justify-end">
                        <button onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors">
                          <MoreVertical size={15} />
                        </button>
                        {openMenu === p.id && (
                          <div className="absolute right-0 top-8 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-xl min-w-[180px] py-1">
                            <button onClick={() => openEdit(p)}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                              <Pencil size={13} /> Edit
                            </button>
                            {active ? (
                              <button onClick={() => handleRevoke(p)}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-amber-400 hover:bg-slate-700 transition-colors">
                                <CreditCard size={13} /> Revoke subscription
                              </button>
                            ) : (
                              <button onClick={() => handleActivate(p)}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-emerald-400 hover:bg-slate-700 transition-colors">
                                <CreditCard size={13} /> Activate subscription
                              </button>
                            )}
                            <div className="border-t border-slate-700 my-1" />
                            <button onClick={() => { setShowDelete(p); setOpenMenu(null); }}
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
        <ModalWrap title={editParent ? 'Edit parent' : 'Add parent'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {formErr && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{formErr}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">First Name *</label>
                <input required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})}
                  placeholder="Priya"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Last Name</label>
                <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})}
                  placeholder="Sharma"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Phone *</label>
                <input required={!editParent} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="9876543210"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="Auto-generated if blank"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Child Name</label>
                <input value={form.childName} onChange={e => setForm({...form, childName: e.target.value})}
                  placeholder="Arjun Sharma"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Assign Bus</label>
                <select value={form.busId} onChange={e => setForm({...form, busId: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none">
                  <option value="">— None —</option>
                  {buses.map(b => <option key={b.id} value={b.id}>{b.routeName} · {b.plateNumber}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
                {submitting ? 'Saving…' : editParent ? 'Update' : 'Add parent'}
              </button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <ModalWrap title="Remove parent" onClose={() => setShowDelete(null)} width="max-w-sm">
          <p className="text-slate-400 text-sm mb-6">
            Remove <strong className="text-white">{showDelete.name}</strong> and their data from the system?
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
