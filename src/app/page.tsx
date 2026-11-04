import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function Home() {
  return (
    <main className="min-h-dvh bg-[var(--color-surface)] flex flex-col">
      <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
        <div className="container-page flex h-16 items-center justify-between">
          <span className="text-xl font-bold text-[var(--color-primary-600)]">BusPoint</span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a href="/login" className="btn btn-primary btn-sm">Sign in</a>
          </div>
        </div>
      </nav>

      <section className="flex flex-1 flex-col items-center justify-center text-center px-6 py-24">
        <span className="badge badge-blue mb-4">By SRFusion</span>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
          Real-time school bus tracking
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-md mb-8">
          Schools manage buses and routes. Drivers track live. Parents see exactly when the bus is arriving.
        </p>
        <a href="/login" className="btn btn-primary btn-lg">Request access</a>
      </section>

      <footer className="border-t border-[var(--color-border)] py-6 text-center text-sm text-[var(--color-text-muted)]">
        © 2026 BusPoint · <a href="https://srfusiontech.com" className="hover:underline">SRFusion</a>
      </footer>
    </main>
  );
}
