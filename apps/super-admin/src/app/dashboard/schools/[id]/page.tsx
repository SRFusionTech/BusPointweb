'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Users, Bus, UserCheck, User, PauseCircle, PlayCircle } from 'lucide-react';
import { api } from '@/lib/api';
import Badge from '@/components/ui/badge';

export default function SchoolDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [data,   setData]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]    = useState('');

  const load = async () => {
    setLoading(true);
    try { setData(await api.getSchool(id)); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleSuspend = async () => {
    try { await api.suspendSchool(id); flash('School suspended.'); load(); } catch (e: any) { flash(e.message); }
  };
  const handleReinstate = async () => {
    try { await api.reinstateSchool(id); flash('School reinstated.'); load(); } catch (e: any) { flash(e.message); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 text-slate-500">School not found.</div>
  );

  const { school, admin, stats, recentUsers } = data;
  const isSuspended = stats.activeUsers === 0 && stats.totalUsers > 0;

  const statCards = [
    { icon: Bus,       label: 'Total Buses',   value: stats.totalBuses,  color: 'sky' },
    { icon: UserCheck, label: 'Drivers',        value: stats.drivers,     color: 'green' },
    { icon: Users,     label: 'Parents',        value: stats.parents,     color: 'purple' },
    { icon: User,      label: 'Active Users',   value: stats.activeUsers, color: 'amber' },
  ];
  const iconBg: Record<string, string> = {
    sky: 'from-sky-500 to-sky-600', green: 'from-emerald-500 to-green-600',
    purple: 'from-purple-500 to-violet-600', amber: 'from-amber-500 to-orange-500',
  };

  return (
    <div>
      {/* Back */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to schools
      </button>

      {msg && <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{msg}</div>}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-sky-500/20">
            <Building2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{school.name}</h1>
            <p className="text-slate-400 text-sm">{school.location}</p>
            <div className="mt-1">
              <Badge label={isSuspended ? 'Suspended' : 'Active'} color={isSuspended ? 'red' : 'green'} />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {isSuspended ? (
            <button onClick={handleReinstate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition-colors">
              <PlayCircle size={15} /> Reinstate
            </button>
          ) : (
            <button onClick={handleSuspend}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-sm font-medium transition-colors">
              <PauseCircle size={15} /> Suspend school
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconBg[color]} flex items-center justify-center mb-3`}>
              <Icon size={16} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs text-slate-500 font-medium">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Admin info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-4">School Admin</h2>
          {admin ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{admin.name}</div>
                <div className="text-xs text-slate-400">{admin.email}</div>
                {admin.phone && <div className="text-xs text-slate-500">{admin.phone}</div>}
              </div>
              <Badge label={admin.isActive ? 'Active' : 'Inactive'} color={admin.isActive ? 'green' : 'red'} />
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No admin account found.</p>
          )}
        </div>

        {/* Recent users */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white">Recent Users</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {recentUsers?.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500 text-sm">No users yet.</div>
            ) : (
              recentUsers?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <User size={13} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{u.name}</div>
                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  </div>
                  <Badge label={u.role} color={u.role === 'admin' ? 'sky' : u.role === 'driver' ? 'green' : 'slate'} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
