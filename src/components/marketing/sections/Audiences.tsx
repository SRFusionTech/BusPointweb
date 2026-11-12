'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, House, SteeringWheel, Buildings } from '@phosphor-icons/react';
import { Reveal } from '../Reveal';

const AUDIENCES = [
  {
    key: 'families',
    label: 'Families',
    Icon: House,
    headline: 'Peace of mind, without the noise.',
    points: ['Live arrival time for your own stop', 'See the bus on the map, start to school gate', 'Every pickup and drop-off kept on record', 'Only your child’s journey — never anyone else’s'],
  },
  {
    key: 'drivers',
    label: 'Drivers',
    Icon: SteeringWheel,
    headline: 'One tap to start. Eyes on the road.',
    points: ['Start the trip once — stops mark themselves', 'Next stop, distance and students always on top', 'Large, glanceable controls built for the dashboard', 'Calls from families pause while the bus is moving'],
  },
  {
    key: 'schools',
    label: 'Transport teams',
    Icon: Buildings,
    headline: 'Every route, one quiet control room.',
    points: ['Live fleet map with status for every bus', 'Routes, stops, drivers, families and classes in one place', 'Full timeline and event log for every journey', 'Alerts when a bus stops unexpectedly or loses GPS'],
  },
];

export function Audiences() {
  const [tab, setTab] = useState(0);
  const a = AUDIENCES[tab];
  return (
    <section className="border-y border-line-subtle bg-surface py-24 md:py-28">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">Everyone on the route</p>
          <h2 className="font-display mt-4 text-4xl leading-tight text-fg-primary md:text-5xl">Designed for each person on the journey.</h2>
        </Reveal>

        <div role="tablist" aria-label="Who BusPoint is for" className="mx-auto mt-12 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line-default bg-surface-alt p-1">
          {AUDIENCES.map((x, i) => (
            <button
              key={x.key}
              role="tab"
              aria-selected={i === tab}
              aria-controls={`aud-${x.key}`}
              id={`aud-tab-${x.key}`}
              onClick={() => setTab(i)}
              className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-colors ${
                i === tab ? 'bg-surface text-fg-primary shadow-e1' : 'text-fg-muted hover:text-fg-primary'
              }`}
            >
              <x.Icon size={18} weight={i === tab ? 'fill' : 'regular'} />
              {x.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={a.key}
            id={`aud-${a.key}`}
            role="tabpanel"
            aria-labelledby={`aud-tab-${a.key}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            className="card mx-auto mt-10 grid max-w-4xl gap-8 p-8 md:grid-cols-[1fr_1.1fr] md:p-12"
          >
            <div>
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-fg-brand">
                <a.Icon size={28} weight="duotone" />
              </span>
              <h3 className="font-display mt-6 text-3xl leading-tight text-fg-primary">{a.headline}</h3>
            </div>
            <ul className="flex flex-col gap-4">
              {a.points.map((p) => (
                <li key={p} className="flex gap-3 text-md leading-7 text-fg-secondary">
                  <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-fg-link" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
