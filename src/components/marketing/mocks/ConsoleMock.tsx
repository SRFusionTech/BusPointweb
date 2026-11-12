import { Bus, ChartBar, ClockCounterClockwise, MapTrifold, Path, SquaresFour, Users } from '@phosphor-icons/react/dist/ssr';
import { LogoMark } from '@/components/brand/Logo';

export type ConsoleView = 'live' | 'routes' | 'history' | 'people';

const ROUTES = [
  { name: 'Al Barsha — Morning', bus: 'Bus 04', status: 'On the way', tone: 'live', eta: '7 min' },
  { name: 'Jumeirah Loop — Morning', bus: 'Bus 07', status: 'At school', tone: 'success', eta: '8:02' },
  { name: 'Marina — Morning', bus: 'Bus 11', status: 'On the way', tone: 'live', eta: '12 min' },
  { name: 'Mirdif — Morning', bus: 'Bus 02', status: 'Delayed', tone: 'warning', eta: '+6 min' },
];

const NAV = [
  { Icon: SquaresFour, label: 'Overview' },
  { Icon: MapTrifold, label: 'Live map' },
  { Icon: ClockCounterClockwise, label: 'Trip history' },
  { Icon: Bus, label: 'Buses' },
  { Icon: Path, label: 'Routes' },
  { Icon: Users, label: 'People' },
];

function Chip({ tone, children }: { tone: string; children: string }) {
  const cls =
    tone === 'live' ? 'bg-action-soft text-action-ghost-text' : tone === 'success' ? 'bg-success-bg text-success-text' : tone === 'warning' ? 'bg-warning-bg text-warning-text' : 'bg-neutral-bg text-neutral-text';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {tone === 'live' && <span className="h-1.5 w-1.5 rounded-full bg-live-pulse" />}
      {children}
    </span>
  );
}

/** Stylised live-fleet map: three routes with buses riding along them (CSS offset-path). */
function FleetMap() {
  const paths = [
    'M20 210 C 90 200, 120 150, 170 140 S 260 90, 330 60',
    'M30 60 C 90 80, 120 120, 190 120 S 280 170, 340 200',
    'M60 240 C 110 190, 170 210, 220 170 S 300 120, 350 130',
  ];
  return (
    <div className="relative h-full min-h-[220px] overflow-hidden rounded-xl bg-[var(--bp-map-land)]">
      <svg viewBox="0 0 370 260" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <rect x="210" y="180" width="140" height="70" rx="12" fill="var(--bp-map-park)" />
        <rect x="20" y="100" width="70" height="60" rx="10" fill="var(--bp-map-building)" />
        {[50, 120, 190].map((y) => (
          <line key={y} x1="0" y1={y} x2="370" y2={y - 30} stroke="var(--bp-map-road)" strokeWidth="10" />
        ))}
        {[80, 170, 270].map((x) => (
          <line key={x} x1={x} y1="0" x2={x + 40} y2="260" stroke="var(--bp-map-road)" strokeWidth="10" />
        ))}
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--bp-live-route)" strokeOpacity={i === 0 ? 1 : 0.55} strokeWidth="4" strokeLinecap="round" />
        ))}
        <g transform="translate(330 60)">
          <circle r="9" fill="var(--bp-live-school)" stroke="var(--bp-live-marker-ring)" strokeWidth="2.5" />
        </g>
      </svg>
      {paths.map((d, i) => (
        <span
          key={i}
          className="animate-ride absolute left-0 top-0 grid h-6 w-6 place-items-center rounded-full border-2 border-[var(--bp-live-marker-ring)] bg-live-marker text-live-marker-text shadow-e2"
          style={{ offsetPath: `path('${d}')`, animationDelay: `${-i * 4.5}s`, animationDuration: `${16 + i * 3}s` }}
        >
          <Bus size={12} weight="fill" />
        </span>
      ))}
    </div>
  );
}

/** The school-admin console in a browser frame (sidebar, KPIs, live map, routes). */
export function ConsoleMock({ view = 'live' }: { view?: ConsoleView }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line-default bg-surface shadow-e3" aria-hidden="true">
      <div className="flex items-center gap-2 border-b border-line-subtle bg-surface-alt px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="ml-3 hidden flex-1 truncate rounded-md bg-surface px-3 py-1 text-[11px] text-fg-muted sm:block">app.buspoint.school/{view === 'live' ? 'live' : view}</span>
      </div>
      <div className="flex min-h-[340px]">
        <aside className="hidden w-[168px] shrink-0 flex-col gap-1 bg-brand p-3 md:flex">
          <div className="mb-3 flex items-center gap-2 px-1.5 text-fg-on-brand">
            <LogoMark size={20} />
            <span className="text-[13px] font-semibold">BusPoint</span>
          </div>
          {NAV.map(({ Icon, label }, i) => {
            const active = (view === 'live' && i === 1) || (view === 'history' && i === 2) || (view === 'routes' && i === 4) || (view === 'people' && i === 5);
            return (
              <span key={label} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${active ? 'bg-brand-deep font-semibold text-fg-on-brand' : 'text-fg-on-brand-muted'}`}>
                <Icon size={14} />
                {label}
              </span>
            );
          })}
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-fg-muted">Thursday · Morning run</p>
              <p className="font-display text-[18px] leading-6 text-fg-primary">
                {view === 'live' ? 'Live fleet' : view === 'routes' ? 'Routes & stops' : view === 'history' ? 'Trip history' : 'People & classes'}
              </p>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full bg-action-soft px-2.5 py-1 text-[10px] font-semibold text-action-ghost-text sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-live-pulse" /> 3 buses live
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['On the way', '3'],
              ['At school', '1'],
              ['Stops reached', '98%'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-line-subtle bg-surface-alt px-2.5 py-2">
                <p className="truncate text-[9px] text-fg-muted">{k}</p>
                <p className="text-[16px] font-semibold text-fg-primary tnum">{v}</p>
              </div>
            ))}
          </div>
          {view === 'live' && (
            <div className="grid flex-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
              <FleetMap />
              <div className="flex flex-col gap-1.5">
                {ROUTES.map((r) => (
                  <div key={r.name} className="flex items-center justify-between gap-2 rounded-lg border border-line-subtle px-2.5 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-fg-primary">{r.name}</p>
                      <p className="text-[9px] text-fg-muted">{r.bus}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <Chip tone={r.tone}>{r.status}</Chip>
                      <span className="text-[9px] text-fg-muted tnum">{r.eta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {view === 'routes' && (
            <div className="grid flex-1 gap-3 lg:grid-cols-[1fr_1.2fr]">
              <div className="flex flex-col gap-1">
                {['School gate', 'Palm Grove Gate', 'Al Wasl Park', 'Marina Walk', 'Lakeside Villas'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2 rounded-lg border border-line-subtle px-2.5 py-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-soft text-[9px] font-semibold text-fg-brand tnum">{i + 1}</span>
                    <span className="flex-1 truncate text-[11px] font-medium text-fg-primary">{s}</span>
                    <span className="text-[9px] text-fg-muted tnum">{[0, 6, 9, 4, 7][i]} students</span>
                  </div>
                ))}
              </div>
              <FleetMap />
            </div>
          )}
          {view === 'history' && (
            <div className="flex flex-1 flex-col gap-1.5">
              {[
                ['Al Barsha — Morning', '7:02 – 8:04', 'All stops reached', 'success'],
                ['Jumeirah Loop — Morning', '6:58 – 7:59', 'All stops reached', 'success'],
                ['Mirdif — Afternoon', '14:31 – 15:40', '1 stop skipped', 'warning'],
                ['Marina — Afternoon', '14:35 – 15:22', 'All stops reached', 'success'],
              ].map(([n, t, s, tone]) => (
                <div key={n} className="flex items-center justify-between gap-2 rounded-lg border border-line-subtle px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-fg-primary">{n}</p>
                    <p className="text-[9px] text-fg-muted tnum">{t}</p>
                  </div>
                  <Chip tone={tone}>{s}</Chip>
                </div>
              ))}
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-fg-muted">
                <ChartBar size={12} /> Every journey keeps its full timeline and event log.
              </div>
            </div>
          )}
          {view === 'people' && (
            <div className="grid flex-1 gap-1.5 sm:grid-cols-2">
              {[
                ['Aisha Malik', 'Grade 4B · Palm Grove Gate'],
                ['Omar Haddad', 'Grade 7A · Marina Walk'],
                ['Lina Costa', 'Grade 2C · Al Wasl Park'],
                ['Ravi Menon', 'Driver · Bus 04'],
                ['Hannah Weber', 'Grade 9A · Lakeside Villas'],
                ['Samir Aziz', 'Driver · Bus 07'],
              ].map(([n, d]) => (
                <div key={n} className="flex items-center gap-2 rounded-lg border border-line-subtle px-2.5 py-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-[9px] font-semibold text-fg-on-brand">
                    {n
                      .split(' ')
                      .map((p) => p[0])
                      .join('')}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-fg-primary">{n}</p>
                    <p className="truncate text-[9px] text-fg-muted">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
