import Link from 'next/link';
import { ArrowRight, Bus, CheckCircle, ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import { PhoneFrame, ParentScreen } from '../mocks/PhoneMock';
import { Reveal } from '../Reveal';

const ROUTE = 'M -40 712 C 220 700, 420 650, 600 655 S 860 560, 960 450 S 1120 240, 1320 190';

/** Navy brand stage: editorial headline left, the live parent screen right, a route drawing itself behind. */
export function Hero() {
  return (
    <section className="brand-stage relative isolate overflow-hidden pt-[72px]">
      <div className="hairline-grid pointer-events-none absolute inset-0 -z-10" />
      <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d={ROUTE} fill="none" stroke="var(--bp-live-pulse)" strokeOpacity="0.12" strokeWidth="18" strokeLinecap="round" />
        <path d={ROUTE} fill="none" stroke="var(--bp-live-pulse)" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 12" className="animate-route-draw" style={{ ['--route-length' as string]: '1800' }} />
        <g transform="translate(960 450)">
          <circle r="7" fill="var(--bp-live-pulse)" />
          <circle r="7" fill="var(--bp-live-pulse)" className="animate-pulse-ring" />
        </g>
      </svg>
      <span
        className="animate-ride pointer-events-none absolute left-0 top-0 -z-10 hidden h-9 w-9 place-items-center rounded-full border-[3px] border-[var(--bp-live-marker-ring)] bg-live-marker text-live-marker-text shadow-e3 md:grid"
        style={{ offsetPath: `path('${ROUTE}')`, animationDuration: '22s' }}
        aria-hidden="true"
      >
        <Bus size={16} weight="fill" />
      </span>

      <div className="container-page grid items-center gap-14 pb-20 pt-14 md:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pb-28">
        <div className="max-w-2xl">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-line-on-brand px-3.5 py-1.5 text-sm font-medium text-fg-on-brand-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-premium" />
              Built for international schools
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="font-display mt-6 text-[clamp(2.6rem,6vw,4.25rem)] leading-[1.04] text-fg-on-brand">The school run, in perfect view.</h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 max-w-xl text-lg leading-8 text-fg-on-brand-muted md:text-xl">
              Live bus tracking that gives families calm, accurate arrival times — and gives your transport team one quiet place to run every route.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo" className="btn btn-primary btn-lg">
                Request a demo <ArrowRight size={18} weight="bold" />
              </Link>
              <a href="#how-it-works" className="btn btn-outline-on-brand btn-lg">
                See how it works
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.24}>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-fg-on-brand-muted">
              <li className="flex items-center gap-2">
                <CheckCircle size={18} weight="fill" className="text-live-pulse" /> iOS, Android & web
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={18} weight="fill" className="text-live-pulse" /> School-issued access only
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={18} weight="fill" className="text-live-pulse" /> Light & dark mode
              </li>
            </ul>
          </Reveal>
        </div>

        <div className="relative mx-auto w-full max-w-[420px]">
          <Reveal delay={0.1}>
            <PhoneFrame className="animate-float">
              <ParentScreen stage="approaching" />
            </PhoneFrame>
          </Reveal>
          <Reveal delay={0.5} className="absolute -left-4 top-16 hidden sm:block lg:-left-44">
            <div className="glass w-56 rounded-2xl p-3.5 shadow-e3">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-fg-primary">
                <span className="relative inline-flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-live-pulse animate-pulse-ring" />
                  <span className="relative h-2 w-2 rounded-full bg-live-pulse" />
                </span>
                Bus is 3 stops away
              </p>
              <p className="mt-1 text-xs text-fg-muted tnum">Arrives at Palm Grove Gate · 7:39</p>
            </div>
          </Reveal>
          <Reveal delay={0.8} className="absolute -right-4 bottom-10 hidden sm:block lg:-right-24">
            <div className="glass w-52 rounded-2xl p-3.5 shadow-e3">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-fg-primary">
                <CheckCircle size={16} weight="fill" className="text-success-icon" /> Arrived at school
              </p>
              <p className="mt-1 text-xs text-fg-muted tnum">8:03 · Morning pickup</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
