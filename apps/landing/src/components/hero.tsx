import { ArrowRight, ShieldCheck, Zap, Users } from 'lucide-react';

const chips = [
  { icon: ShieldCheck, label: 'Safe & Verified' },
  { icon: Zap, label: 'Real-Time GPS' },
  { icon: Users, label: 'Multi-Role Access' },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 pb-24 px-6 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute inset-0 radial-glow" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-semibold tracking-wide uppercase mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          Now available for schools across India
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)_minmax(0,1fr)]">
          {/* Left text block */}
          <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.02] mb-6">
              <span className="gradient-text">Know where your</span>
              <br />
              <span className="gradient-brand">child&apos;s bus is.</span>
              <br />
              <span className="gradient-text">Always.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
              BusPoint gives schools, drivers, and parents a real-time view of every
              bus, every route, every day — from one unified platform.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              {chips.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/70 border border-slate-700/60 text-sm text-slate-300 font-medium"
                >
                  <Icon size={14} className="text-sky-400" />
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="#request-access"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-base transition-all shadow-xl shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-0.5"
              >
                Request access for your school
                <ArrowRight size={18} />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold text-base transition-all"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Center phone simulation */}
          <div className="relative mx-auto w-full max-w-[420px] flex items-center justify-center py-8 lg:py-0">
            <div className="absolute inset-x-0 top-10 h-24 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-[320px] sm:max-w-[340px]">
              {/* floating tabs */}
              <div className="absolute -left-6 top-16 z-20 bg-[#0f172a] border border-slate-700/60 rounded-2xl px-3 py-2 shadow-xl text-xs text-slate-300 font-medium whitespace-nowrap">
                <span className="text-sky-400 font-bold">12</span> buses live
              </div>
              <div className="absolute -right-6 top-28 z-20 bg-[#0f172a] border border-slate-700/60 rounded-2xl px-3 py-2 shadow-xl text-xs text-slate-300 font-medium whitespace-nowrap">
                <span className="text-emerald-400 font-bold">247</span> parents tracking
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-8 z-20 bg-[#0f172a] border border-slate-700/60 rounded-2xl px-3 py-2 shadow-xl text-xs text-slate-300 font-medium whitespace-nowrap">
                <span className="text-sky-400 font-bold">40%</span> faster alerts
              </div>

              {/* base platform under the phone */}
              <div className="absolute left-1/2 bottom-[-28px] h-28 w-[115%] -translate-x-1/2 rounded-[999px] bg-gradient-to-b from-slate-900/80 via-slate-950 to-black border border-slate-700/70 shadow-[0_30px_90px_rgba(0,0,0,0.55)]" />
              <div className="absolute left-1/2 bottom-[-10px] h-16 w-[82%] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-2xl" />

              <div className="relative mx-auto w-full rounded-[36px] bg-[#0f172a] border-2 border-slate-700/80 shadow-2xl shadow-black/60 overflow-hidden">
                {/* Phone notch */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-24 h-5 rounded-full bg-slate-800" />
                </div>

                {/* Map mockup */}
                <div className="mx-3 rounded-2xl overflow-hidden h-52 bg-gradient-to-br from-slate-900 to-[#0d1b2a] relative border border-slate-700/40">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(14,165,233,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.08) 1px, transparent 1px)',
                      backgroundSize: '28px 28px',
                    }}
                  />
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-700/60" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-700/60" />
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-slate-700/40" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative">
                      <div className="absolute inset-0 w-10 h-10 -m-1 rounded-full bg-sky-500/20 animate-ping-slow" />
                      <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/40">
                        <span className="text-white text-xs font-black">🚌</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-1/4 right-1/4">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Status card */}
                <div className="mx-3 my-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400">En route · ETA 4 min</span>
                  </div>
                  <div className="text-xs text-slate-400">MH01AB1234 · Route A North</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center">
                      <span className="text-[10px]">👨‍✈️</span>
                    </div>
                    <span className="text-xs text-slate-300 font-medium">Ramesh Kumar</span>
                    <div className="ml-auto w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-[9px]">📞</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pb-3 pt-1">
                  <div className="w-28 h-1 rounded-full bg-slate-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Right text block */}
          <div className="text-center lg:text-right max-w-xl mx-auto lg:ml-auto">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-sky-400/80 mb-4">
              Built for child safety
            </p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.03]">
              <span className="gradient-text">Fast-track</span>
              <br />
              <span className="gradient-text">alerts that </span>
              <span className="gradient-brand italic">parents</span>
              <br />
              <span className="gradient-text">can trust</span>
            </h2>
            <p className="mt-6 text-lg md:text-xl text-slate-400 leading-relaxed">
              Live ETAs, safe pickup visibility, and fast incident alerts keep families informed at every stop.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
