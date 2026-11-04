'use client';

import { useState } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

type Step = 'credentials' | 'loading';
type FieldError = { email?: string; password?: string; form?: string };

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<Step>('credentials');
  const [errors, setErrors] = useState<FieldError>({});

  function validate(): boolean {
    const e: FieldError = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStep('loading');
    setErrors({});

    try {
      // TODO: replace with real API call
      // const res = await api.post('/auth/login', { email, password });
      // const { role, token } = res.data;
      // if (role === 'super_admin') router.push('/super-admin/dashboard');
      // else router.push('/dashboard');

      // Placeholder: simulate network delay
      await new Promise((r) => setTimeout(r, 1200));
      setErrors({ form: 'API not connected yet — backend coming next.' });
      setStep('credentials');
    } catch {
      setErrors({ form: 'Invalid email or password.' });
      setStep('credentials');
    }
  }

  return (
    <div className="min-h-dvh bg-[var(--color-surface-secondary)] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <a href="/" className="text-lg font-bold text-[var(--color-primary-600)]">
          BusPoint
        </a>
        <ThemeToggle />
      </header>

      {/* Card */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="card w-full max-w-sm p-8">
          {/* Logo mark */}
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary-600)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <path d="M16 8h4l3 3v5h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              Welcome back
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Sign in to your BusPoint account
            </p>
          </div>

          {/* Form error */}
          {errors.form && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@school.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                className={`input ${errors.email ? 'border-red-400 focus:border-red-400' : ''}`}
                disabled={step === 'loading'}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label className="label" htmlFor="password">Password</label>
                <a href="/forgot-password" className="text-xs text-[var(--color-primary-600)] hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  className={`input pr-10 ${errors.password ? 'border-red-400 focus:border-red-400' : ''}`}
                  disabled={step === 'loading'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={step === 'loading'}
            >
              {step === 'loading' ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
            Need access?{' '}
            <a href="/#request" className="text-[var(--color-primary-600)] hover:underline">
              Request from your school admin
            </a>
          </p>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[var(--color-text-muted)]">
        © 2026 BusPoint · SRFusion ·{' '}
        <a href="https://srfusiontech.com" className="hover:underline">srfusiontech.com</a>
      </footer>
    </div>
  );
}
