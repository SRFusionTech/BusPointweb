'use client';

import { MapPin, LayoutDashboard, Building2, ClipboardList, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const nav = [
  { icon: LayoutDashboard, label: 'Dashboard',      href: '/dashboard' },
  { icon: Building2,       label: 'Schools',         href: '/dashboard/schools' },
  { icon: ClipboardList,   label: 'Access Requests', href: '/dashboard/requests' },
  { icon: Settings,        label: 'Settings',        href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const logout = () => {
    localStorage.removeItem('sa_token');
    router.push('/login');
  };

  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
            <MapPin size={15} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-black text-white">Bus<span className="text-sky-400">Point</span></div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Super Admin</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {nav.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
