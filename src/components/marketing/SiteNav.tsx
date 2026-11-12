'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { List, X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from './ThemeToggle';

const LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#families', label: 'For families' },
  { href: '/#schools', label: 'For schools' },
  { href: '/#safety', label: 'Safety' },
  { href: '/#faq', label: 'FAQ' },
];

/**
 * Transparent over the navy hero, frosted surface once you scroll.
 * `solid` = always the surface style (inner pages).
 */
export function SiteNav({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const onSurface = solid || scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-200 ${
        onSurface ? 'glass border-b border-line-subtle shadow-e1' : 'border-b border-transparent'
      }`}
    >
      <nav className="container-page flex h-[72px] items-center justify-between gap-6" aria-label="Main">
        <Link href="/" className={`shrink-0 ${onSurface ? 'text-fg-brand' : 'text-fg-on-brand'}`} aria-label="BusPoint home">
          <Logo size={30} />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  onSurface ? 'text-fg-secondary hover:text-fg-primary' : 'text-fg-on-brand-muted hover:text-fg-on-brand'
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <div className={onSurface ? 'text-fg-secondary' : 'text-fg-on-brand-muted'}>
            <ThemeToggle />
          </div>
          <Link href="/login" className={`btn btn-sm hidden sm:inline-flex ${onSurface ? 'btn-ghost' : 'btn-outline-on-brand'}`}>
            Sign in
          </Link>
          <Link href="/demo" className="btn btn-primary btn-sm hidden sm:inline-flex">
            Request a demo
          </Link>
          <button
            type="button"
            className={`grid h-11 w-11 place-items-center rounded-md lg:hidden ${onSurface ? 'text-fg-primary' : 'text-fg-on-brand'}`}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[72px] bottom-0 overflow-y-auto bg-surface lg:hidden"
          >
            <div className="container-page flex flex-col gap-1 py-6">
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-4 text-lg font-medium text-fg-primary hover:bg-surface-alt">
                  {l.label}
                </a>
              ))}
              <div className="mt-6 grid gap-3">
                <Link href="/demo" onClick={() => setOpen(false)} className="btn btn-primary btn-lg">
                  Request a demo
                </Link>
                <Link href="/login" onClick={() => setOpen(false)} className="btn btn-secondary btn-lg">
                  Sign in
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
