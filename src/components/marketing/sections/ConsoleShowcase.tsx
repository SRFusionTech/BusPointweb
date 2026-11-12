'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ClockCounterClockwise, MapTrifold, Path, Users } from '@phosphor-icons/react';
import { ConsoleMock, type ConsoleView } from '../mocks/ConsoleMock';
import { Reveal } from '../Reveal';

const TABS: { key: ConsoleView; label: string; Icon: typeof Path; body: string }[] = [
  { key: 'live', label: 'Live fleet', Icon: MapTrifold, body: 'Every bus on one map, with who’s on the way, who’s at school and who needs attention.' },
  { key: 'routes', label: 'Routes & stops', Icon: Path, body: 'Draw routes along real roads, order stops, and assign drivers and buses in minutes.' },
  { key: 'history', label: 'Trip history', Icon: ClockCounterClockwise, body: 'Every journey keeps its timeline: departures, stops reached or skipped, and alerts.' },
  { key: 'people', label: 'People & classes', Icon: Users, body: 'Families, drivers and classes in one directory, each linked to the right stop.' },
];

export function ConsoleShowcase() {
  const [i, setI] = useState(0);
  const tab = TABS[i];
  return (
    <section id="schools" className="bg-canvas py-24 md:py-32">
      <div className="container-page">
        <div className="grid items-end gap-6 md:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <p className="eyebrow">For schools</p>
            <h2 className="font-display mt-4 text-4xl leading-tight text-fg-primary md:text-5xl">A transport office that runs itself.</h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-lg leading-8 text-fg-secondary">The BusPoint console gives your transport team a calm, complete view of every route — and the tools to set them up properly once.</p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[300px_1fr]">
          <div role="tablist" aria-label="Console features" aria-orientation="vertical" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {TABS.map((x, idx) => (
              <button
                key={x.key}
                role="tab"
                aria-selected={idx === i}
                onClick={() => setI(idx)}
                className={`min-w-[220px] rounded-xl border p-4 text-left transition-all lg:min-w-0 ${
                  idx === i ? 'border-action bg-surface shadow-e2' : 'border-line-subtle bg-transparent hover:bg-surface'
                }`}
              >
                <span className={`flex items-center gap-2 text-sm font-semibold ${idx === i ? 'text-fg-link' : 'text-fg-primary'}`}>
                  <x.Icon size={18} weight={idx === i ? 'fill' : 'regular'} />
                  {x.label}
                </span>
                <span className="mt-1.5 block text-sm leading-6 text-fg-muted">{x.body}</span>
              </button>
            ))}
          </div>
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={tab.key} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}>
                <ConsoleMock view={tab.key} />
              </motion.div>
            </AnimatePresence>
            <p className="mt-3 text-center text-xs text-fg-muted">Illustrative data</p>
          </div>
        </div>
      </div>
    </section>
  );
}
