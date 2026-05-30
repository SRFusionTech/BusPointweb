'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Menu, X } from 'lucide-react';

const links = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features',     href: '#features' },
  { label: 'Pricing',      href: '#pricing' },
];

export default function Nav() {
  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#020817]/90 backdrop-blur-xl border-b border-slate-800/60 shadow-xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:shadow-sky-500/40 transition-shadow">
            <MapPin size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-800 font-black tracking-tight text-white">
            Bus<span className="text-sky-400">Point</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <a
            href="#request-access"
            className="text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-sky-500/20"
          >
            Request access
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-slate-400 hover:text-white transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0f172a] border-b border-slate-800 px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <a
            href="#request-access"
            onClick={() => setMenuOpen(false)}
            className="text-sm font-semibold bg-sky-500 text-white px-4 py-2.5 rounded-xl text-center"
          >
            Request access
          </a>
        </div>
      )}
    </header>
  );
}
