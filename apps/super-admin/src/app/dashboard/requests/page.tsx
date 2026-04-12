'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, RefreshCw, Clock, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import Modal from '@/components/ui/modal';
import Badge from '@/components/ui/badge';

interface Request {
  id: string; name: string; schoolName: string; phone: string;
  plan: string; status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string; createdAt: string;
}

const STATUS_FILTER = ['all', 'pending', 'approved', 'rejected'] as const;

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<typeof STATUS_FILTER[number]>('all');
  const [msg,      setMsg]      = useState('');
  const [approving, setApproving] = useState<Request | null>(null);
  const [rejecting, setRejecting] = useState<Request | null>(null);
  const [approveForm, setApproveForm] = useState({ adminEmail: '', adminPassword: '', location: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState('');

  const load = async () => {
    setLoading(true);
    try { setRequests(await api.getRequests(filter === 'all' ? undefined : filter)); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approving) return;
    setFormErr('');
    setSubmitting(true);
    try {
      await api.approveRequest(approving.id, approveForm);
      flash(`"${approving.schoolName}" approved and provisioned successfully.`);
      setApproving(null);
      setApproveForm({ adminEmail: '', adminPassword: '', location: '' });
      await load();
    } catch (err: any) { setFormErr(err.message ?? 'Failed to approve request.'); }
    finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    setSubmitting(true);
    try {
      await api.rejectRequest(rejecting.id, rejectReason);
      flash(`Request from "${rejecting.schoolName}" rejected.`);
      setRejecting(null);
      setRejectReason('');
      await load();
    } catch (err: any) { flash(err.message); }
    finally { setSubmitting(false); }
  };

  const badgeColor = (s: string) =>
    s === 'pending' ? 'yellow' : s === 'approved' ? 'green' : 'red';

  const pending = requests.filter((r) => r.status === 'pending').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Access Requests</h1>
          <p className="text-slate-400 text-sm mt-1">
            {pending > 0 ? <span className="text-amber-400 font-medium">{pending} pending</span> : 'No pending requests'}
            {' · '}schools requesting access to BusPoint
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {msg && <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{msg}</div>}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {STATUS_FILTER.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-800 rounded w-1/3" />
                  <div className="h-3 bg-slate-800 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl py-20 text-center">
          <Filter size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No {filter !== 'all' ? filter : ''} requests found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((r) => (
            <div key={r.id} className={`bg-slate-900 border rounded-2xl p-6 ${
              r.status === 'pending' ? 'border-amber-500/20' : 'border-slate-800'
            }`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">{r.schoolName?.[0] ?? '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-bold text-white">{r.schoolName}</h3>
                    <Badge label={r.status} color={badgeColor(r.status) as any} />
                    {r.plan && <Badge label={r.plan} color="sky" />}
                  </div>
                  <div className="text-sm text-slate-400 mb-1">
                    Contact: <span className="text-slate-300">{r.name}</span> · {r.phone}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <Clock size={11} />
                    {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {r.rejectionReason && (
                    <div className="mt-2 text-xs text-red-400">Rejection reason: {r.rejectionReason}</div>
                  )}
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => { setApproving(r); setFormErr(''); setApproveForm({ adminEmail: '', adminPassword: '', location: '' }); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition-colors">
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => { setRejecting(r); setRejectReason(''); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      <Modal open={!!approving} onClose={() => setApproving(null)} title={`Approve: ${approving?.schoolName}`} width="max-w-lg">
        <p className="text-slate-400 text-sm mb-5">
          Provisioning a school creates the school record and a school admin account. The admin can immediately log into the School Admin panel.
        </p>
        <form onSubmit={handleApprove} className="flex flex-col gap-4">
          {formErr && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{formErr}</div>}
          <input required placeholder="School location (city, state)" value={approveForm.location}
            onChange={(e) => setApproveForm({ ...approveForm, location: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors" />
          <input required type="email" placeholder="Admin email address" value={approveForm.adminEmail}
            onChange={(e) => setApproveForm({ ...approveForm, adminEmail: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors" />
          <input required type="password" placeholder="Temporary admin password" value={approveForm.adminPassword}
            onChange={(e) => setApproveForm({ ...approveForm, adminPassword: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors" />
          <p className="text-xs text-slate-600">Share the email and password with the school admin contact.</p>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setApproving(null)}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
              {submitting ? 'Provisioning…' : 'Approve & provision'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title={`Reject: ${rejecting?.schoolName}`} width="max-w-sm">
        <div className="flex flex-col gap-4">
          <textarea placeholder="Reason for rejection (optional)" value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} rows={3}
            className="w-full bg-slate-800 border border-slate-700 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors resize-none" />
          <div className="flex gap-3">
            <button onClick={() => setRejecting(null)}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-colors">
              Cancel
            </button>
            <button onClick={handleReject} disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
              {submitting ? 'Rejecting…' : 'Reject request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
