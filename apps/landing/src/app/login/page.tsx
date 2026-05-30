'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

// Tries super-admin first; falls back to school-admin if the super-admin
// endpoint rejects the credentials. Returns the destination + token bundle.
async function attemptLogin(email: string, password: string): Promise<
  | { kind: 'super'; token: string }
  | { kind: 'school'; token: string; school: unknown }
  | { kind: 'error'; message: string }
> {
  // 1) try super-admin endpoint
  try {
    const res = await fetch(`${API_BASE}/superadmin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.access_token) return { kind: 'super', token: data.access_token };
    }
  } catch {
    /* network issue — try the school endpoint before giving up */
  }

  // 2) fall back to school-admin endpoint
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.access_token && data?.school) {
        return { kind: 'school', token: data.access_token, school: data.school };
      }
      return { kind: 'error', message: 'Account is not linked to a school yet.' };
    }
  } catch {
    return { kind: 'error', message: 'Cannot reach the BusPoint API.' };
  }

  return { kind: 'error', message: 'Invalid email or password.' };
}

export default function UnifiedLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await attemptLogin(email, password);

    if (result.kind === 'error') {
      setError(result.message);
      setLoading(false);
      return;
    }

    // Same origin now (everything lives under one Next.js app), so we store
    // the token directly in localStorage and use the router instead of a
    // cross-origin redirect dance. Keys are namespaced per role so a super
    // admin and a school admin can't accidentally clobber each other's
    // session in the same browser.
    if (result.kind === 'super') {
      localStorage.setItem('super_admin_token', result.token);
      router.push('/super-admin/dashboard');
      return;
    }

    localStorage.setItem('school_admin_token', result.token);
    localStorage.setItem('school_admin_school', JSON.stringify(result.school));
    router.push('/school-admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background ornaments to match landing aesthetic */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-sky-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[24rem] h-[24rem] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Back to home
        </Link>

        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-sky-500/25 mb-4">
            <MapPin size={22} className="text-white" />
          </div>
          <div className="text-xl font-black text-white mb-1">
            Bus<span className="text-sky-400">Point</span>
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Sign in
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-8">
          <h1 className="text-xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-sm text-slate-400 mb-6">
            One sign-in for school admins and super admins. We&apos;ll send you to the right dashboard.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourschool.edu"
                disabled={loading}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition-colors text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-600 outline-none transition-colors text-sm disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white font-semibold text-sm transition-all mt-2 shadow-lg shadow-sky-500/20"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Lock size={15} />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-6">
            Not on BusPoint yet?{' '}
            <Link href="/#request-access" className="text-sky-400 hover:text-sky-300 font-semibold">
              Request access
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          Parents and drivers sign in from the BusPoint mobile app.
        </p>
      </div>
    </div>
  );
}
