import { Check, ArrowRight } from 'lucide-react';

const plans = [
  {
    name:     'Starter',
    price:    '₹2,999',
    period:   '/month',
    desc:     'Perfect for small schools just getting started with bus tracking.',
    highlight: false,
    badge:    null,
    features: [
      'Up to 5 buses',
      'Up to 100 parents',
      '2 drivers',
      'Live GPS tracking',
      'Push notifications',
      'Basic dashboard',
      'Email support',
    ],
    cta: 'Get started',
  },
  {
    name:     'Growth',
    price:    '₹7,499',
    period:   '/month',
    desc:     'For growing schools with multiple buses and an active parent community.',
    highlight: true,
    badge:    'Most popular',
    features: [
      'Up to 20 buses',
      'Up to 500 parents',
      'Unlimited drivers',
      'Live GPS tracking',
      'Push & SMS notifications',
      'Advanced admin dashboard',
      'Subscription management',
      'Priority support',
      'Analytics & reports',
    ],
    cta: 'Get started',
  },
  {
    name:     'Enterprise',
    price:    'Custom',
    period:   '',
    desc:     'Multi-school networks, districts, and operators with custom requirements.',
    highlight: false,
    badge:    null,
    features: [
      'Unlimited buses & schools',
      'Unlimited parents',
      'White-label option',
      'Custom integrations',
      'SLA guarantee',
      'Dedicated account manager',
      'On-premise deployment option',
      '24/7 phone support',
    ],
    cta: 'Contact us',
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-28 px-6 bg-[#080f1e] relative">
      <div className="absolute inset-0 grid-bg opacity-30" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <div className="text-center mb-20">
          <p className="text-sky-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Transparent pricing
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight gradient-text mb-4">
            Simple plans for<br />every school size
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            No hidden fees. No long-term contracts. Cancel anytime.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border p-8 flex flex-col ${
                plan.highlight
                  ? 'bg-gradient-to-b from-sky-500/10 to-[#0f172a] border-sky-500/40 shadow-2xl shadow-sky-500/10'
                  : 'bg-[#0f172a] border-slate-800'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/30">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  {plan.period && <span className="text-slate-500 text-sm">{plan.period}</span>}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{plan.desc}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <Check size={15} className={plan.highlight ? 'text-sky-400' : 'text-slate-500'} strokeWidth={2.5} />
                    <span className="text-sm text-slate-300">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#request-access"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm transition-all ${
                  plan.highlight
                    ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/30'
                    : 'border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white'
                }`}
              >
                {plan.cta}
                <ArrowRight size={15} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
