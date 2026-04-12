import { ClipboardCheck, UserPlus, Radio } from 'lucide-react';

const steps = [
  {
    icon:  ClipboardCheck,
    color: 'sky',
    step:  '01',
    title: 'School requests access',
    desc:  'A school administrator fills in a simple request form. Our team reviews and provisions a dedicated school account within 24 hours — no self-signup, no unverified access.',
  },
  {
    icon:  UserPlus,
    color: 'purple',
    step:  '02',
    title: 'Admin sets up buses & invites users',
    desc:  'The school admin logs into the web dashboard, adds buses, assigns drivers, and invites parents via phone number. Each person gets an SMS with a download link — ready in minutes.',
  },
  {
    icon:  Radio,
    color: 'green',
    step:  '03',
    title: 'Everyone tracks live',
    desc:  "Drivers start their route from the mobile app. Parents see their child's bus moving on the map in real-time, with instant push notifications for arrivals, delays, and emergencies.",
  },
];

const colorMap: Record<string, string> = {
  sky:    'from-sky-500 to-sky-600 shadow-sky-500/30',
  purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
  green:  'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
};
const borderMap: Record<string, string> = {
  sky:    'border-sky-500/20 group-hover:border-sky-500/40',
  purple: 'border-purple-500/20 group-hover:border-purple-500/40',
  green:  'border-emerald-500/20 group-hover:border-emerald-500/40',
};
const stepNumMap: Record<string, string> = {
  sky:    'text-sky-500/20',
  purple: 'text-purple-500/20',
  green:  'text-emerald-500/20',
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-6 relative">
      <div className="absolute inset-0 radial-glow opacity-30" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <div className="text-center mb-20">
          <p className="text-sky-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Simple by design
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight gradient-text mb-4">
            How BusPoint works
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            From school approval to live tracking — up and running in under a day.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className={`group relative bg-[#0f172a] rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1 ${borderMap[s.color]}`}
              >
                {/* Step number watermark */}
                <div className={`absolute top-6 right-6 text-6xl font-black select-none ${stepNumMap[s.color]}`}>
                  {s.step}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorMap[s.color]} shadow-lg flex items-center justify-center mb-6`}>
                  <Icon size={22} className="text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>

                {/* Connector line (except last) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-slate-700 z-10" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
