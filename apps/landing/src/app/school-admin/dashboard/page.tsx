'use client';

import { useEffect, useState } from 'react';
import { Bus, UserCheck, Users, CreditCard, RefreshCw, Activity, Clock } from 'lucide-react';
import { api, getSchool } from '@/lib/schoolAdminApi';
import { useDashboardAutoRefresh } from '@/components/school-admin/useDashboardAutoRefresh';

const BUS_STATUS_COLOR: Record<string, string> = {
  started:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  at_school: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  returning: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  idle:      'text-slate-400 bg-slate-800 border-slate-700',
  ended:     'text-slate-500 bg-slate-800/50 border-slate-700/50',
  inactive:  'text-red-400 bg-red-500/10 border-red-500/20',
};

const BUS_STATUS_LABEL: Record<string, string> = {
  started:   'On Route',
  at_school: 'At School',
  returning: 'Returning',
  idle:      'Idle',
  ended:     'Trip Ended',
  inactive:  'Inactive',
  maintenance: 'Maintenance',
  gps_lost:  'GPS Lost',
};

export default function SchoolDashboard() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const school = getSchool();

  const load = async () => {
    if (!school?.id) return;
    setLoading(true);
    try { setData(await api.getDashboard(school.id)); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useDashboardAutoRefresh(load);

  const stats = [
    { icon: Bus,        label: 'Total Buses',          value: data?.totalBuses          ?? '—', color: 'sky' },
    { icon: UserCheck,  label: 'Active Drivers',        value: data?.totalDrivers        ?? '—', color: 'green' },
    { icon: Users,      label: 'Parents Enrolled',      value: data?.totalParents        ?? '—', color: 'purple' },
    { icon: CreditCard, label: 'Active Subs',           value: data?.activeSubscriptions ?? '—', color: 'amber' },
  ];

  const iconBg: Record<string, string> = {
    sky:    'from-sky-500 to-sky-600',
    green:  'from-emerald-500 to-green-600',
    purple: 'from-purple-500 to-violet-600',
    amber:  'from-amber-500 to-orange-500',
  };

  const activeBuses = (data?.buses ?? []).filter((b: any) =>
    ['started','at_school','returning'].includes(b.status),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">{school?.name ?? 'School'} · {school?.location ?? ''}</p>
        </div>
        <button onClick={load} disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-sm">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconBg[color]} flex items-center justify-center mb-3 shadow-sm`}>
              <Icon size={16} className="text-white" />
            </div>
            {loading ? (
              <div className="h-7 w-12 bg-slate-800 rounded animate-pulse mb-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</div> 
            )}
            <div className="text-xs sm:text-sm text-slate-500 font-medium">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active buses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Active Buses</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              {activeBuses.length} live
            </span>
          </div>
          <div className="divide-y divide-slate-800">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-6 py-4 animate-pulse flex gap-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-800 rounded w-1/3" />
                    <div className="h-2.5 bg-slate-800 rounded w-1/4" />
                  </div>
                </div>
              ))
            ) : activeBuses.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-500 text-sm">No active trips right now.</div>
            ) : (
              activeBuses.map((b: any) => (
                <div key={b.id} className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bus size={13} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{b.routeName}</div>
                    <div className="text-xs text-slate-500">{b.plateNumber}</div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${BUS_STATUS_COLOR[b.status] ?? 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                    {BUS_STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent notifications */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
            <Clock size={15} className="text-slate-400" />
            <h2 className="text-sm font-bold text-white">Recent Activity</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-4 animate-pulse space-y-2">
                  <div className="h-3 bg-slate-800 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-800 rounded w-1/3" />
                </div>
              ))
            ) : (data?.recentNotifications ?? []).length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-500 text-sm">No recent activity.</div>
            ) : (
              (data.recentNotifications as any[]).slice(0, 8).map((n: any, i: number) => (
                <div key={i} className="px-6 py-3.5">
                  <div className="text-sm text-slate-300">{n.title ?? n.message ?? 'Notification'}</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
