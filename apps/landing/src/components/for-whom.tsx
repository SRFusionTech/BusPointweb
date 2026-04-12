import { Shield, Navigation, Heart } from 'lucide-react';

const personas = [
  {
    icon:     Shield,
    role:     'School Admin',
    tagline:  'Full control, zero chaos',
    color:    'purple',
    gradient: 'from-purple-500/10 to-violet-500/5',
    border:   'border-purple-500/20',
    iconBg:   'from-purple-500 to-violet-600',
    points: [
      'Add buses, drivers, and parents in minutes',
      'Real-time map of all buses in motion',
      'Manage subscriptions and access centrally',
      'Get alerts when GPS signal is lost',
    ],
  },
  {
    icon:     Navigation,
    role:     'Driver',
    tagline:  'Focus on the road, not paperwork',
    color:    'green',
    gradient: 'from-emerald-500/10 to-green-500/5',
    border:   'border-emerald-500/20',
    iconBg:   'from-emerald-500 to-green-600',
    points: [
      'One-tap trip start from the mobile app',
      'Automatic GPS broadcast — no manual steps',
      'See your route and assigned stops',
      'Status updates keep parents informed automatically',
    ],
  },
  {
    icon:     Heart,
    role:     'Parent',
    tagline:  "Peace of mind, every school day",
    color:    'sky',
    gradient: 'from-sky-500/10 to-blue-500/5',
    border:   'border-sky-500/20',
    iconBg:   'from-sky-500 to-blue-600',
    points: [
      "Live map showing your child's bus in real time",
      'Push alerts when the bus is 5 minutes away',
      'Driver name and contact always visible',
      'Works on any phone, no technical skills needed',
    ],
  },
];

const checkColor: Record<string, string> = {
  purple: 'text-purple-400',
  green:  'text-emerald-400',
  sky:    'text-sky-400',
};

export default function ForWhom() {
  return (
    <section className="py-28 px-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-20">
          <p className="text-sky-400 text-sm font-semibold uppercase tracking-widest mb-3">
            One platform, three roles
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight gradient-text mb-4">
            Designed for everyone<br />in the school ecosystem
          </h2>
        </div>

        {/* Persona cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.role}
                className={`rounded-3xl border ${p.border} bg-gradient-to-b ${p.gradient} p-8`}
              >
                {/* Icon + role */}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.iconBg} flex items-center justify-center mb-5 shadow-lg`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{p.role}</div>
                <h3 className="text-xl font-bold text-white mb-6">{p.tagline}</h3>

                {/* Points */}
                <ul className="space-y-3">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-3">
                      <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${checkColor[p.color]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-300 leading-relaxed">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
