const stats = [
  { value: '50+',   label: 'Schools onboarded' },
  { value: '500+',  label: 'Buses tracked daily' },
  { value: '10k+',  label: 'Parents & guardians' },
  { value: '99.9%', label: 'Platform uptime' },
];

export default function Stats() {
  return (
    <section className="relative py-16 border-y border-slate-800/60 bg-[#0a1120]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl md:text-4xl font-black gradient-brand mb-1">{value}</div>
              <div className="text-sm text-slate-500 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
