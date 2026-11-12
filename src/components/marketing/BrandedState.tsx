import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoMark } from '@/components/brand/Logo';

/** Full-page brand state (404 / error) on the navy stage — used by the public site. */
export function BrandedState({ code, title, body, actions }: { code?: string; title: string; body: string; actions?: ReactNode }) {
  return (
    <main className="brand-stage relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-6 py-24 text-center">
      <div className="hairline-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="max-w-xl">
        <Link href="/" aria-label="BusPoint home" className="inline-flex text-fg-on-brand">
          <LogoMark size={56} />
        </Link>
        {code && <p className="mt-8 text-sm font-semibold tracking-widest text-accent-premium tnum">{code}</p>}
        <h1 className="font-display mt-3 text-[clamp(2.25rem,6vw,3.5rem)] leading-tight text-fg-on-brand">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-8 text-fg-on-brand-muted">{body}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">{actions}</div>
      </div>
    </main>
  );
}
