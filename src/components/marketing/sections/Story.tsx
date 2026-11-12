'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Bus, CheckCircle, House, GraduationCap } from '@phosphor-icons/react';
import { PhoneFrame, ParentScreen, type ParentStage } from '../mocks/PhoneMock';

const STEPS: { stage: ParentStage; Icon: typeof Bus; time: string; title: string; body: string }[] = [
  { stage: 'started', Icon: Bus, time: '7:21', title: 'The bus sets off', body: 'The driver taps Start once. From that moment every family on the route sees the bus move, live.' },
  { stage: 'approaching', Icon: House, time: '7:36', title: 'Your stop is next', body: 'Arrival times count down for your own stop — so you step out at the right minute, not ten minutes early.' },
  { stage: 'picked', Icon: CheckCircle, time: '7:41', title: 'Picked up', body: 'The stop is confirmed automatically by GPS. No tapping, no messages, no guesswork for the driver.' },
  { stage: 'arrived', Icon: GraduationCap, time: '8:03', title: 'Safely at school', body: 'The journey is complete and kept on record, ready whenever you or the school need it.' },
];

/**
 * Scroll story: the phone stays pinned while four moments of a real morning scroll past.
 * Below 1024px it becomes a simple vertical sequence (no sticky, no scroll-jacking).
 */
export function Story() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="families" className="bg-canvas py-24 md:py-32">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="eyebrow">For families</p>
          <h2 className="font-display mt-4 text-4xl leading-tight text-fg-primary md:text-5xl">One calm morning, minute by minute.</h2>
          <p className="mt-5 text-lg leading-8 text-fg-secondary">Parents don’t want a dashboard. They want to know one thing: when to step out of the door. BusPoint answers it — quietly and precisely.</p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-20">
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <PhoneFrame>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={STEPS[active].stage}
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <ParentScreen stage={STEPS[active].stage} />
                  </motion.div>
                </AnimatePresence>
              </PhoneFrame>
            </div>
          </div>

          <ol className="relative">
            <div className="absolute bottom-6 left-[19px] top-6 w-0.5 bg-line-default" aria-hidden="true" />
            <motion.div
              className="absolute left-[19px] top-6 w-0.5 origin-top bg-action"
              style={{ height: 'calc(100% - 48px)' }}
              animate={{ scaleY: (active + 1) / STEPS.length }}
              transition={{ duration: reduce ? 0 : 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              aria-hidden="true"
            />
            {STEPS.map(({ Icon, time, title, body, stage }, i) => (
              <li
                key={stage}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                data-index={i}
                className="relative flex gap-6 pb-16 last:pb-0 lg:min-h-[52vh] lg:pb-0"
              >
                <span
                  className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition-colors duration-300 ${
                    i <= active ? 'border-action bg-action text-on-action' : 'border-line-strong bg-surface text-fg-muted'
                  }`}
                >
                  <Icon size={18} weight="bold" />
                </span>
                <div className={`transition-opacity duration-300 lg:pt-1 ${i === active ? 'opacity-100' : 'lg:opacity-55'}`}>
                  <p className="text-sm font-semibold text-fg-link tnum">{time}</p>
                  <h3 className="font-display mt-1 text-3xl text-fg-primary">{title}</h3>
                  <p className="mt-3 max-w-md text-lg leading-8 text-fg-secondary">{body}</p>
                  <div className="mt-8 lg:hidden">
                    <PhoneFrame>
                      <ParentScreen stage={stage} />
                    </PhoneFrame>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
