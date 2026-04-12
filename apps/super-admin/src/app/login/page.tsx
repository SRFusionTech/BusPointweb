'use client';

import { useState } from 'react';
import { MapPin, Eye, EyeOff, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuperAdminLogin() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      localStorage.setItem('sa_token', data.access_token);
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-sky-500/25 mb-4">
            <MapPin size={22} className="text-white" />
          </div>
          <div className="text-xl font-black text-white mb-1">
            Bus<span className="text-sky-400">Point</span>
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Super Admin</div>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <h1 className="text-xl font-bold text-white mb-6">Sign in to continue</h1>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
              <input
                required type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@buspoint.app"
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  required type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-600 outline-none transition-colors text-sm"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white font-semibold text-sm transition-all mt-2"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={15} />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          Restricted access · BusPoint platform only
        </p>
      </div>
    </div>
  );
}
