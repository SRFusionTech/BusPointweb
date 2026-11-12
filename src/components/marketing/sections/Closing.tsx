import Link from 'next/link';
import { ArrowRight, Buildings, Crosshair, IdentificationBadge, ListChecks, LockKey, Plus, ShieldCheck, UserCircleGear } from '@phosphor-icons/react/dist/ssr';
import { Reveal } from '../Reveal';
import { SITE } from '@/lib/site';

// ── Safety & privacy (navy, brass hairlines) ───────────────────────────────────
const SAFETY = [
  { Icon: IdentificationBadge, title: 'School-issued access', body: 'Nobody can sign up. Every account is created by your school, and can be paused instantly.' },
  { Icon: Buildings, title: 'Each school kept separate', body: 'Your routes, people and journeys are isolated from every other school on the platform.' },
  { Icon: UserCircleGear, title: 'Role-based permissions', body: 'Families see only their own stop and the school. Drivers see their route. Admins see the fleet.' },
  { Icon: LockKey, title: 'Encrypted in transit', body: 'In production, the apps, the console and our servers talk to each other only over HTTPS.' },
  { Icon: Crosshair, title: 'GPS quality filtering', body: 'Low-accuracy GPS readings are filtered out before anyone sees them.' },
  { Icon: ListChecks, title: 'A full audit trail', body: 'Every trip keeps its timeline: departures, stops reached or skipped, alerts and SOS.' },
];

export function Safety() {
  return (
    <section id="safety" className="brand-stage relative isolate overflow-hidden py-24 md:py-32">
      <div className="hairline-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="container-page">
        <Reveal className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-accent-premium">
            <ShieldCheck size={18} weight="fill" /> Safety & privacy
          </p>
          <h2 className="font-display mt-4 text-4xl leading-tight text-fg-on-brand md:text-5xl">Trusted with the most precious passengers.</h2>
          <p className="mt-5 text-lg leading-8 text-fg-on-brand-muted">Location data about children deserves more care than any other data. BusPoint is built that way from the first line of code.</p>
        </Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line-on-brand bg-[var(--bp-border-on-brand)] sm:grid-cols-2 lg:grid-cols-3">
          {SAFETY.map(({ Icon, title, body }, i) => (
            <Reveal key={title} delay={(i % 3) * 0.06} className="bg-brand p-7">
              <Icon size={26} weight="duotone" className="text-accent-premium" />
              <h3 className="mt-4 text-lg font-semibold text-fg-on-brand">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-fg-on-brand-muted">{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How onboarding works ─────────────────────────────────────────────────────
const STEPS = [
  { title: 'Map your routes', body: 'Add your stops and the school; BusPoint draws each route along real roads.' },
  { title: 'Invite drivers & families', body: 'Add people once — each family is linked to their child’s stop.' },
  { title: 'Drivers tap Start', body: 'The app shares the bus live and marks stops automatically.' },
  { title: 'Families follow along', body: 'Parents see arrival times for their own stop, nothing else.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface py-24 md:py-32">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">How it works</p>
          <h2 className="font-display mt-4 text-4xl leading-tight text-fg-primary md:text-5xl">From first call to first route.</h2>
          <p className="mt-5 text-lg leading-8 text-fg-secondary">We set up BusPoint with your transport team. Here’s the path from sign-up to the first live morning.</p>
        </Reveal>
        <ol className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
          <div className="absolute left-[22px] top-0 h-full w-px bg-line-default md:left-0 md:top-[22px] md:h-px md:w-full" aria-hidden="true" />
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.1} className="relative flex gap-5 md:block">
              <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line-default bg-surface font-display text-lg text-fg-brand shadow-e1 tnum">{i + 1}</span>
              <div className="md:mt-6">
                <h3 className="text-lg font-semibold text-fg-primary">{s.title}</h3>
                <p className="mt-2 text-md leading-7 text-fg-muted">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
export const FAQS = [
  { q: 'Which devices does BusPoint work on?', a: 'Families and drivers use the BusPoint app on iPhone and Android. Your transport office uses the web console in any modern browser, on desktop or tablet.' },
  { q: 'Who can see where the bus is?', a: 'Only people your school has added. Families see the bus, their own stop and the school — never other families’ stops or children. Location is shared only while a trip is running.' },
  { q: 'How accurate are the arrival times?', a: 'BusPoint receives the bus position every few seconds and calculates arrival times along the actual road route, updating continuously as the bus moves.' },
  { q: 'What does the driver need to do?', a: 'Tap Start at the first stop. Stops are marked automatically using GPS, so the driver never needs to touch the phone while driving.' },
  { q: 'Can we run several campuses or many routes?', a: 'Yes. Each school runs any number of buses and routes, with separate morning and afternoon directions.' },
  { q: 'How do we get started?', a: `Request a demo and we’ll walk your team through BusPoint on your own routes. We reply ${SITE.responsePromise}.` },
];

export function Faq() {
  return (
    <section id="faq" className="bg-canvas py-24 md:py-32">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <p className="eyebrow">FAQ</p>
          <h2 className="font-display mt-4 text-4xl leading-tight text-fg-primary md:text-5xl">Good questions.</h2>
          <p className="mt-5 text-lg leading-8 text-fg-secondary">
            Something else on your mind?{' '}
            <a href={`mailto:${SITE.email}`} className="font-semibold text-fg-link underline-offset-4 hover:underline">
              Email us
            </a>
            .
          </p>
        </Reveal>
        <div className="divide-y divide-line-default border-y border-line-default">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-2">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-3 text-left text-lg font-semibold text-fg-primary [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus size={20} weight="bold" className="shrink-0 text-fg-muted transition-transform duration-200 group-open:rotate-45" />
              </summary>
              <p className="pb-5 pr-10 text-md leading-7 text-fg-secondary">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final call to action ─────────────────────────────────────────────────────
export function FinalCta() {
  return (
    <section className="bg-canvas pb-24 md:pb-32">
      <div className="container-page">
        <Reveal className="brand-stage relative isolate overflow-hidden rounded-3xl px-8 py-16 text-center md:px-16 md:py-20">
          <div className="hairline-grid pointer-events-none absolute inset-0 -z-10" />
          <h2 className="font-display mx-auto max-w-2xl text-4xl leading-tight text-fg-on-brand md:text-5xl">See BusPoint on your own routes.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-fg-on-brand-muted">A 30-minute walkthrough with your transport team — tailored to your buses, your stops and your families.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/demo" className="btn btn-primary btn-lg">
              Request a demo <ArrowRight size={18} weight="bold" />
            </Link>
            <a href={`mailto:${SITE.email}`} className="btn btn-outline-on-brand btn-lg">
              {SITE.email}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
