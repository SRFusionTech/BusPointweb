import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { SITE } from '@/lib/site';
import { Year } from './Year';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/#families', label: 'For families' },
      { href: '/#schools', label: 'For schools' },
      { href: '/#safety', label: 'Safety & privacy' },
      { href: '/#how-it-works', label: 'How it works' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/demo', label: 'Request a demo' },
      { href: `mailto:${SITE.email}`, label: 'Contact' },
      { href: SITE.companyUrl, label: 'SRFusion' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy policy' },
      { href: '/terms', label: 'Terms of service' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line-subtle bg-surface">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <span className="text-fg-brand">
            <Logo size={30} />
          </span>
          <p className="mt-4 max-w-xs text-sm leading-6 text-fg-muted">Live school bus tracking for international schools.</p>
          <Link href="/login" className="mt-6 inline-flex text-sm font-semibold text-fg-link underline-offset-4 hover:underline">
            Sign in to the console →
          </Link>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-semibold text-fg-primary">{c.title}</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {c.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-fg-muted transition-colors hover:text-fg-primary">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line-subtle">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <Year /> {SITE.company}. All rights reserved.
          </p>
          <p>BusPoint is a product of {SITE.company}.</p>
        </div>
      </div>
    </footer>
  );
}
