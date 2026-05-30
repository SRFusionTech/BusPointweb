'use client';

import { useEffect, useState } from 'react';
import { Building2, Bus, Users, ClipboardList, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/superAdminApi';
import Badge from '@/components/super-admin/ui/badge';

interface Stats { schools: number; users: number; buses: number; pendingRequests: number; }
interface School { id: string; name: string; location: string; adminEmail: string; userCount: number; busCount: number; suspended: boolean; createdAt: string; }

export default function SuperAdminDashboard() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, sc] = await Promise.all([api.getStats(), api.getSchools()]);
      setStats(s);
      setSchools(sc.slice(0, 5));
    } catch { /* token expired → redirect */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const statCards = [
    { icon: Building2,    label: 'Total Schools',    value: stats?.schools      ?? '—', color: 'sky',    href: '/super-admin/dashboard/schools' },
    { icon: Bus,          label: 'Total Buses',       value: stats?.buses        ?? '—', color: 'purple', href: '/super-admin/dashboard/schools' },
    { icon: Users,        label: 'Total Users',       value: stats?.users        ?? '—', color: 'green',  href: '/super-admin/dashboard/schools' },
    { icon: ClipboardList,label: 'Pending Requests',  value: stats?.pendingRequests ?? '—', color: 'amber',  href: '/super-admin/dashboard/requests' },
  ];

  const iconBg: Record<string, string> = {
    sky:    'from-sky-500 to-sky-600',
    purple: 'from-purple-500 to-violet-600',
    green:  'from-emerald-500 to-green-600',
    amber:  'from-amber-500 to-orange-500',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
          <p className="text-slate-400 text-sm mt-1">All schools, users, and requests across BusPoint.</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {statCards.map(({ icon: Icon, label, value, color, href }) => (
          <Link key={label} href={href}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-sm transition-colors group">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBg[color]} flex items-center justify-center mb-4 shadow-lg`}>
              <Icon size={18} className="text-white" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{loading ? '—' : value}</div>
            <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
              {label}
              <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom panels */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Schools */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white">Recent Schools</h2>
            <Link href="/super-admin/dashboard/schools" className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-slate-800" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-800 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : schools.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-500 text-sm">No schools yet. Provision your first school.</div>
            ) : (
              schools.map((s) => (
                <Link key={s.id} href={`/dashboard/schools/${s.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Building2 size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{s.name}</div>
                    <div className="text-xs text-slate-500 truncate">{s.location}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-500">{s.busCount} buses · {s.userCount} users</span>
                    <Badge label={s.suspended ? 'Suspended' : 'Active'} color={s.suspended ? 'red' : 'green'} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white">Quick Actions</h2>
          </div>
          <div className="p-6 flex flex-col gap-3">
            <Link href="/super-admin/dashboard/schools"
              className="flex items-center gap-3 p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/15 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center">
                <Building2 size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">Provision new school</div>
                <div className="text-xs text-slate-400">Create a school and admin account</div>
              </div>
              <ArrowRight size={16} className="text-slate-500 group-hover:text-sky-400 transition-colors" />
            </Link>

            <Link href="/super-admin/dashboard/requests"
              className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <ClipboardList size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">Review access requests</div>
                <div className="text-xs text-slate-400">
                  {stats?.pendingRequests ? `${stats.pendingRequests} pending` : 'No pending requests'}
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
            </Link>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <TrendingUp size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">Platform health</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  All systems operational
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
