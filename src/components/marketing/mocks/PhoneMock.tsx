import { Bus, Check, Flag, GraduationCap, House } from '@phosphor-icons/react/dist/ssr';
import type { ReactNode } from 'react';

/** Device frame with a dynamic island; content is the real app's layout rendered in HTML. */
export function PhoneFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-[300px] max-w-full ${className}`} aria-hidden="true">
      <div className="rounded-[46px] bg-brand-deep p-[10px] shadow-e3 ring-1 ring-line-strong">
        <div className="relative h-[610px] overflow-hidden rounded-[36px] bg-canvas">
          <div className="absolute left-1/2 top-2.5 z-10 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-brand-deep" />
          <div className="flex items-center justify-between px-7 pt-3.5 text-[11px] font-semibold text-fg-primary tnum">
            <span>7:36</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-3.5 rounded-[2px] border border-current" />
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export type ParentStage = 'started' | 'approaching' | 'picked' | 'arrived';

const STAGES: Record<
  ParentStage,
  { chip: string; live: boolean; eyebrow: string; big?: string; title?: string; sub: string; progress: number; points: ('done' | 'active' | 'pending')[]; times: string[] }
> = {
  started: { chip: 'On the way', live: true, eyebrow: 'Arrives at your stop in', big: '18', sub: '4 stops away · around 7:54', progress: 0.25, points: ['done', 'pending', 'pending'], times: ['7:21', 'About 7:54', 'About 8:12'] },
  approaching: { chip: 'Arriving now', live: true, eyebrow: 'Arrives at your stop in', big: '3', sub: 'Your stop is next · Palm Grove Gate', progress: 0.86, points: ['done', 'active', 'pending'], times: ['7:21', 'About 7:39', 'About 8:06'] },
  picked: { chip: 'Picked up', live: false, eyebrow: '', title: 'Picked up at 7:41', sub: 'Heading to school · arrives around 8:04', progress: 1, points: ['done', 'done', 'pending'], times: ['7:21', 'Picked up 7:41', 'About 8:04'] },
  arrived: { chip: 'At school', live: false, eyebrow: '', title: 'Arrived at school 8:03', sub: 'Picked up at 7:41', progress: 1, points: ['done', 'done', 'done'], times: ['7:21', 'Picked up 7:41', 'Arrived 8:03'] },
};

/** The parent home screen exactly as the app draws it (tokens, type, layout). */
export function ParentScreen({ stage = 'approaching' }: { stage?: ParentStage }) {
  const s = STAGES[stage];
  const liveCard = s.live;
  const pointsMeta = [
    { label: 'Bus started', Icon: Flag },
    { label: 'Your stop', Icon: House, mine: true },
    { label: 'School', Icon: GraduationCap },
  ];
  return (
    <div className="px-4 pt-5">
      <p className="text-[11px] font-medium text-fg-muted">Friday, 7 November</p>
      <div className="mt-0.5 flex items-start justify-between">
        <p className="font-display text-[23px] leading-7 text-fg-primary">Good morning, Sara</p>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-fg-accent ring-2 ring-surface">AM</span>
      </div>

      <div className={`relative mt-4 overflow-hidden rounded-[20px] p-4 shadow-e2 ${liveCard ? 'brand-stage' : 'card'}`}>
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${liveCard ? 'bg-action-soft text-action-ghost-text' : 'bg-success-bg text-success-text'}`}>
            {liveCard ? (
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-live-pulse animate-pulse-ring" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-live-pulse" />
              </span>
            ) : (
              <Check size={10} weight="bold" />
            )}
            {s.chip}
          </span>
          {liveCard && <span className="text-[10px] text-fg-on-brand-muted tnum">Updated just now</span>}
        </div>
        <div className="mt-3 flex items-center gap-2.5">
          <span className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold ${liveCard ? 'bg-accent-soft text-fg-accent' : 'bg-brand text-fg-on-brand'}`}>AM</span>
          <div>
            <p className={`text-[13px] font-semibold ${liveCard ? 'text-fg-on-brand' : 'text-fg-primary'}`}>Aisha Malik</p>
            <p className={`text-[10px] ${liveCard ? 'text-fg-on-brand-muted' : 'text-fg-muted'}`}>Grade 4B · Pickup at Palm Grove Gate</p>
          </div>
        </div>
        {s.big ? (
          <div className="mt-3">
            <p className="text-[10px] text-fg-on-brand-muted">{s.eyebrow}</p>
            <p className="flex items-end gap-1.5 text-fg-on-brand">
              <span className="text-[44px] font-semibold leading-[48px] tnum">{s.big}</span>
              <span className="mb-1.5 text-[16px] text-fg-on-brand-muted">min</span>
            </p>
            <p className="text-[11px] text-fg-on-brand-muted">{s.sub}</p>
            <div className="mt-3 flex items-center gap-2">
              <Bus size={12} weight="fill" className="text-live-pulse" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--bp-text-on-brand)_18%,transparent)]">
                <div className="h-full rounded-full bg-live-pulse transition-[width] duration-700" style={{ width: `${s.progress * 100}%` }} />
              </div>
              <House size={12} weight="fill" className="text-fg-on-brand" />
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <p className="font-display text-[20px] leading-6 text-fg-primary">{s.title}</p>
            <p className="mt-1 text-[11px] text-fg-muted">{s.sub}</p>
          </div>
        )}
      </div>

      <div className="card mt-3 rounded-[18px] p-4">
        <p className="mb-3 text-[13px] font-semibold text-fg-primary">Journey to school</p>
        {pointsMeta.map((p, i) => {
          const st = s.points[i];
          const Icon = st === 'done' ? Check : p.Icon;
          return (
            <div key={p.label}>
              <div className="flex items-center gap-2.5">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full border-2 ${
                    st === 'done' ? 'border-success-solid bg-success-solid text-fg-inverse' : st === 'active' || p.mine ? 'border-action bg-action text-on-action' : 'border-line-strong bg-surface text-fg-muted'
                  }`}
                >
                  <Icon size={11} weight="bold" />
                </span>
                <div className={`flex flex-1 items-center justify-between rounded-lg px-2 py-1.5 ${p.mine ? 'bg-action-soft' : ''}`}>
                  <span className={`text-[12px] font-semibold ${p.mine ? 'text-action-ghost-text' : 'text-fg-primary'}`}>{p.label}</span>
                  <span className={`text-[10px] font-medium tnum ${st === 'done' ? 'text-success-text' : 'text-fg-muted'}`}>{s.times[i]}</span>
                </div>
              </div>
              {i < 2 && <div className={`ml-[11px] h-4 w-0.5 ${s.points[i + 1] !== 'pending' ? 'bg-success-solid' : 'bg-line-default'}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
