import type { Metadata } from 'next';
import { Clock, MapTrifold, UsersThree } from '@phosphor-icons/react/dist/ssr';
import { SiteNav } from '@/components/marketing/SiteNav';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { DemoForm } from '@/components/marketing/DemoForm';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Request a demo',
  description: 'See BusPoint on your own routes — a 30-minute walkthrough for your school’s transport team.',
  alternates: { canonical: '/demo' },
};

export default function DemoPage() {
  return (
    <>
      <SiteNav solid />
      <main className="bg-canvas pb-24 pt-[72px]">
        <div className="container-page grid gap-12 pt-12 md:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">Request a demo</p>
            <h1 className="font-display mt-4 text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.08] text-fg-primary">See BusPoint on your own routes.</h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-fg-secondary">Tell us a little about your school. We’ll tailor a walkthrough to your buses, stops and families — and reply {SITE.responsePromise}.</p>
            <ul className="mt-10 grid max-w-md gap-5">
              {[
                { Icon: Clock, t: '30 minutes, on a call or in person', d: 'Scheduled at a time that suits your team.' },
                { Icon: MapTrifold, t: 'Your routes, live', d: 'We set up a sample route from your school so you see the real thing.' },
                { Icon: UsersThree, t: 'For your whole team', d: 'Transport, operations and IT — bring every question.' },
              ].map(({ Icon, t, d }) => (
                <li key={t} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-action-soft text-fg-link">
                    <Icon size={22} weight="duotone" />
                  </span>
                  <div>
                    <p className="font-semibold text-fg-primary">{t}</p>
                    <p className="mt-0.5 text-sm leading-6 text-fg-muted">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-10 text-sm text-fg-muted">
              Prefer email?{' '}
              <a href={`mailto:${SITE.email}`} className="font-semibold text-fg-link underline-offset-4 hover:underline">
                {SITE.email}
              </a>
            </p>
          </div>
          <DemoForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
