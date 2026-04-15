'use client';

import { useEffect, useState } from 'react';
import { CreditCard, RefreshCw, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { api, getSchool } from '@/lib/api';
import { useDashboardAutoRefresh } from '@/components/useDashboardAutoRefresh';

type StatusFilter = 'all' | 'active' | 'expired' | 'cancelled';

interface Sub {
  id: string;
  parentId: string;
  schoolId: string;
  status: string;
  startDate: string;
  expiryDate: string;
  createdAt: string;
  parent?: { id: string; name: string; phone: string | null; email: string; childName: string | null; };
}

const STATUS_FILTERS: StatusFilter[] = ['all', 'active', 'expired', 'cancelled'];

export default function SubscriptionsPage() {
  const school = getSchool();
  const [subs,       setSubs]       = useState<Sub[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<StatusFilter>('all');
  const [flash,      setFlash]      = useState('');
  const [flashErr,   setFlashErr]   = useState('');
  const [actioning,  setActioning]  = useState<string | null>(null);

  const showFlash = (msg: string, err = false) => {
    if (err) { setFlashErr(msg); setTimeout(() => setFlashErr(''), 3500); }
    else     { setFlash(msg);    setTimeout(() => setFlash(''), 3000); }
  };

  const load = async () => {
    if (!school?.id) return;
    setLoading(true);
    try {
      const raw = await api.getSubscriptions(school.id);
      setSubs((Array.isArray(raw) ? raw : []).map(s => ({
        ...s,
        parent: s.parent ?? null,
      })));
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useDashboardAutoRefresh(load);

  const displayed = filter === 'all' ? subs : subs.filter(s => s.status === filter);

  const handleActivate = async (s: Sub) => {
    const parentId = s.parentId;
    setActioning(s.id);
    try { await api.activateSubscription(parentId, school!.id); showFlash('Subscription renewed for 30 days.'); await load(); }
    catch (err: any) { showFlash(err.message, true); }
    finally { setActioning(null); }
  };

  const handleRevoke = async (s: Sub) => {
    setActioning(s.id);
    try { await api.revokeSubscription(s.parentId); showFlash('Subscription revoked.'); await load(); }
    catch (err: any) { showFlash(err.message, true); }
    finally { setActioning(null); }
  };

  const activeCount   = subs.filter(s => s.status === 'active').length;
  const expiredCount  = subs.filter(s => s.status === 'expired').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-slate-400 text-sm mt-1">
            <span className="text-emerald-400 font-medium">{activeCount} active</span>
            {expiredCount > 0 && <> · <span className="text-slate-500">{expiredCount} expired</span></>}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {flash    && <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{flash}</div>}
      {flashErr && <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{flashErr}</div>}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {STATUS_FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse flex gap-4">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-800 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl py-20 text-center">
          <Filter size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No {filter !== 'all' ? filter : ''} subscriptions found.</p>
          <p className="text-slate-600 text-xs mt-1">Activate subscriptions from the Parents page.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {displayed.map(s => {
            const isActive  = s.status === 'active';
            const isExpired = s.status === 'expired';
            const expiry    = new Date(s.expiryDate);
            const daysLeft  = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
            const expiringSoon = isActive && daysLeft <= 7;

            return (
              <div key={s.id} className={`bg-slate-900 border rounded-2xl p-5 ${actioning === s.id ? 'opacity-50 pointer-events-none' : ''} ${
                expiringSoon ? 'border-amber-500/20' : isActive ? 'border-slate-800' : 'border-slate-800/50'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-slate-800'
                  }`}>
                    <CreditCard size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-white">{s.parent?.name ?? 'Unknown Parent'}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        isActive  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                        isExpired ? 'text-slate-500 bg-slate-800 border-slate-700' :
                                    'text-red-400 bg-red-500/10 border-red-500/20'
                      }`}>{s.status}</span>
                      {expiringSoon && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full border text-amber-400 bg-amber-500/10 border-amber-500/20">
                          Expires in {daysLeft}d
                        </span>
                      )}
                    </div>
                    {s.parent?.childName && (
                      <div className="text-xs text-slate-400">Child: {s.parent.childName}</div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                      <span className="flex items-center gap-1"><Clock size={10} /> Started {new Date(s.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>·</span>
                      <span>Expires {expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {isActive ? (
                      <>
                        <button onClick={() => handleActivate(s)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 text-xs font-medium transition-colors">
                          <CheckCircle size={13} /> Renew
                        </button>
                        <button onClick={() => handleRevoke(s)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors">
                          <XCircle size={13} /> Revoke
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleActivate(s)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors">
                        <CheckCircle size={13} /> Activate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
