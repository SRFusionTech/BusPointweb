export default function Home() {
  return (
    <main className="min-h-dvh bg-[var(--color-surface)]">
      {/* Nav */}
      <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
        <div className="container-page flex h-16 items-center justify-between">
          <span className="text-xl font-bold text-[var(--color-primary-600)]">
            BusPoint
          </span>
          <div className="flex items-center gap-3">
            <a href="/login" className="btn btn-ghost btn-sm">
              Sign in
            </a>
            <a href="/login" className="btn btn-primary btn-sm">
              Get started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container-page py-24 text-center">
        <span className="badge badge-blue mb-6">Live tracking · Real-time</span>
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Know exactly where
          <br />
          your school bus is
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg text-[var(--color-text-secondary)]">
          BusPoint gives parents live bus location, stop-by-stop updates, and
          arrival alerts — all in real time.
        </p>
        <div className="flex justify-center gap-4">
          <a href="/login" className="btn btn-primary btn-lg">
            Start free trial
          </a>
          <a href="#features" className="btn btn-secondary btn-lg">
            See how it works
          </a>
        </div>
      </section>

      {/* Stats row */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
        <div className="container-page grid grid-cols-2 gap-px py-0 sm:grid-cols-4">
          {[
            { label: "Schools", value: "200+" },
            { label: "Buses tracked", value: "1,800+" },
            { label: "Parents", value: "50K+" },
            { label: "Uptime", value: "99.9%" },
          ].map((s) => (
            <div key={s.label} className="px-6 py-8 text-center">
              <div className="text-3xl font-bold text-[var(--color-primary-600)]">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container-page py-24">
        <h2 className="mb-12 text-center text-3xl font-bold text-[var(--color-text-primary)]">
          Everything you need
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: "📍",
              title: "Live GPS tracking",
              desc: "Driver location pushed every 5 seconds via WebSocket — no polling, no lag.",
            },
            {
              icon: "🛑",
              title: "Stop-by-stop updates",
              desc: "Parents see exactly which stop the bus just passed and which one is next.",
            },
            {
              icon: "🔔",
              title: "Push notifications",
              desc: "Instant alert when the bus is 1 stop away from your child's pickup.",
            },
            {
              icon: "🏫",
              title: "Multi-school support",
              desc: "Each school is fully isolated — no data leaks between tenants.",
            },
            {
              icon: "📱",
              title: "Driver & parent app",
              desc: "One Expo app, two roles. Drivers start trips; parents track them.",
            },
            {
              icon: "⚡",
              title: "Built for scale",
              desc: "NestJS + Postgres + Redis. Stateless API, horizontal scaling ready.",
            },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <div className="mb-4 text-3xl">{f.icon}</div>
              <h3 className="mb-2 font-semibold text-[var(--color-text-primary)]">
                {f.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--color-primary-600)]">
        <div className="container-page py-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="mb-8 text-primary-100 text-[var(--color-primary-100)]">
            Set up your school in minutes. No credit card required.
          </p>
          <a
            href="/login"
            className="btn btn-lg inline-flex bg-white text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)]"
          >
            Request access
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)]">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <span className="font-semibold text-[var(--color-primary-600)]">
            BusPoint
          </span>
          <p className="text-sm text-[var(--color-text-muted)]">
            © 2026 BusPoint. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
