import { MapPin, Bell, Users, Bus, Building2, BarChart3 } from 'lucide-react';

const features = [
  {
    icon:  MapPin,
    color: 'sky',
    title: 'Live GPS Tracking',
    desc:  "See every bus moving on an interactive map. Location updates every 5 seconds. Parents see only their child's assigned bus.",
  },
  {
    icon:  Bell,
    color: 'amber',
    title: 'Instant Push Alerts',
    desc:  'Automated notifications when a bus starts its route, is approaching a stop, running late, or has reached school.',
  },
  {
    icon:  Users,
    color: 'green',
    title: 'Parent & Driver Portal',
    desc:  "Drivers get a streamlined mobile app to start trips and broadcast location. Parents get a simple tracking view — no clutter.",
  },
  {
    icon:  Bus,
    color: 'purple',
    title: 'Fleet Management',
    desc:  'Manage buses, routes, driver assignments, and vehicle details from a single admin dashboard.',
  },
  {
    icon:  Building2,
    color: 'indigo',
    title: 'Multi-School Support',
    desc:  'One platform handles multiple schools. Each school is fully isolated — admins only see their own data.',
  },
  {
    icon:  BarChart3,
    color: 'rose',
    title: 'Subscription Management',
    desc:  'Flexible per-parent subscription plans. Admins can activate, pause, or revoke access with a single click.',
  },
];

const iconBg: Record<string, string> = {
  sky:    'from-sky-500 to-sky-600',
  amber:  'from-amber-500 to-orange-500',
  green:  'from-emerald-500 to-green-600',
  purple: 'from-purple-500 to-violet-600',
  indigo: 'from-indigo-500 to-blue-600',
  rose:   'from-rose-500 to-pink-600',
};
const hoverBorder: Record<string, string> = {
  sky:    'hover:border-sky-500/30',
  amber:  'hover:border-amber-500/30',
  green:  'hover:border-emerald-500/30',
  purple: 'hover:border-purple-500/30',
  indigo: 'hover:border-indigo-500/30',
  rose:   'hover:border-rose-500/30',
};

export default function Features() {
  return (
    <section id="features" className="py-28 px-6 bg-[#080f1e] relative">
      <div className="absolute inset-0 grid-bg opacity-40" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <div className="text-center mb-20">
          <p className="text-sky-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Everything you need
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight gradient-text mb-4">
            Built for real schools,<br />real roads, real families
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            No unnecessary complexity. Every feature exists because schools asked for it.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`group bg-[#0f172a] border border-slate-800 rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 ${hoverBorder[f.color]}`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconBg[f.color]} flex items-center justify-center mb-5 shadow-lg`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
