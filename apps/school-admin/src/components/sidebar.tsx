'use client';

import { MapPin, LayoutDashboard, Bus, Users, UserCheck, CreditCard, Map, Route as RouteIcon, LogOut, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSchool } from '@/lib/api';
import { useState, useEffect } from 'react';

const nav = [
  { icon: LayoutDashboard, label: 'Dashboard',     href: '/dashboard' },
  { icon: Bus,             label: 'Buses',          href: '/dashboard/buses' },
  { icon: RouteIcon,       label: 'Routes',         href: '/dashboard/routes' },
  { icon: UserCheck,       label: 'Drivers',        href: '/dashboard/drivers' },
  { icon: Users,           label: 'Parents',        href: '/dashboard/parents' },
  { icon: CreditCard,      label: 'Subscriptions',  href: '/dashboard/subscriptions' },
  { icon: Map,             label: 'Live Map',       href: '/dashboard/map' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [school, setSchool] = useState<{name: string} | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('sa_token');
    if (!token) { router.replace('/login'); return; }
    setSchool(getSchool());
  }, []);

  const logout = () => {
    localStorage.removeItem('sa_token');
    localStorage.removeItem('school');
    router.push('/login');
  };

  const closeSidebar = () => setIsOpen(false);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 shadow-lg hover:bg-slate-800 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-40
        flex flex-col bg-[#0c0e1a] border-r border-slate-800/60
        transition-all duration-300 ease-in-out flex-shrink-0
        shadow-2xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-[80px]' : 'w-[280px]'}
      `}>
        
        {/* Desktop Collapse Toggle (Half outside) */}
        <button 
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="hidden lg:flex absolute top-7 -right-4 z-50 items-center justify-center w-8 h-8 rounded-full bg-[#0c0e1a] border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 shadow-sm transition-all duration-200"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Header */}
        <div className="h-20 flex items-center px-4 md:px-6 border-b border-slate-800/60 flex-shrink-0">
          <div className={`flex items-center h-full w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30 flex items-center justify-center flex-shrink-0 border border-white/10">
                <MapPin size={18} className="text-white" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 transition-opacity duration-300">
                  <div className="text-base font-black text-white truncate tracking-tight">{school?.name ?? 'BusPoint'}</div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-400 mt-0.5">School Admin</div>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            {!isCollapsed && (
              <button 
                onClick={closeSidebar}
                className="lg:hidden p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <div className={`pt-6 pb-2 transition-all duration-300 ${isCollapsed ? 'px-0 text-center opacity-0 h-0 hidden' : 'px-6 opacity-100 h-auto'}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Main Navigation</span>
        </div>

        {/* Sidebar Nav Links */}
        <nav className={`flex-1 px-4 pb-4 ${isCollapsed ? 'pt-4' : 'pt-0'} overflow-y-auto flex flex-col gap-1.5 custom-scrollbar`}>
          {nav.map(({ icon: Icon, label, href }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} onClick={() => { if (!isCollapsed) closeSidebar(); }}
                title={isCollapsed ? label : undefined}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3.5 px-4'} py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 ${
                  active 
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20 shadow-sm shadow-purple-500/5' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}>
                <Icon size={18} className={active ? "text-purple-400 flex-shrink-0" : "text-slate-500 flex-shrink-0"} />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-800/60 bg-[#0c0e1a]">
          <button onClick={logout}
            title={isCollapsed ? 'Sign out' : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center w-full px-0' : 'gap-3.5 w-full px-4'} py-3 rounded-xl text-[14px] font-semibold text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200`}>
            <LogOut size={18} className="flex-shrink-0" />
            {!isCollapsed && <span className="truncate">Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
