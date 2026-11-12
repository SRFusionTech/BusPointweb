import type { ReactNode } from 'react';
import { SiteNav } from './SiteNav';
import { SiteFooter } from './SiteFooter';

/** Long-form text page (privacy, terms) with the site chrome and readable measure. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <SiteNav solid />
      <main className="bg-canvas pb-24 pt-[72px]">
        <article className="container-page max-w-3xl pt-12 md:pt-20">
          <p className="eyebrow">Legal</p>
          <h1 className="font-display mt-4 text-5xl leading-tight text-fg-primary">{title}</h1>
          <p className="mt-3 text-sm text-fg-muted">Last updated {updated}</p>
          <div className="mt-10 flex flex-col gap-6 text-md leading-8 text-fg-secondary [&_h2]:font-display [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:text-fg-primary [&_ul]:list-disc [&_ul]:pl-6">{children}</div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
