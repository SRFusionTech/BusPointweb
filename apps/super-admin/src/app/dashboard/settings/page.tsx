'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Copy, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [form,   setForm]    = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw]  = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{ newHash?: string; message?: string } | null>(null);
  const [error,   setError]   = useState('');
  const [copied,  setCopied]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match.'); return; }
    if (form.newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res = await api.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setResult(res);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) { setError(err.message ?? 'Failed to change password.'); }
    finally { setLoading(false); }
  };

  const copyHash = () => {
    if (!result?.newHash) return;
    navigator.clipboard.writeText(result.newHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggle = (field: 'current' | 'new' | 'confirm') =>
    setShowPw((p) => ({ ...p, [field]: !p[field] }));

  const inputClass = 'w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-600 outline-none transition-colors text-sm';

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your super admin account.</p>
      </div>

      {/* Account info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Super Administrator</div>
            <div className="text-xs text-slate-500">superadmin@buspoint.app</div>
            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs text-sky-400 font-semibold">
              Full platform access
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Lock size={16} className="text-slate-400" />
          <h2 className="text-sm font-bold text-white">Change Password</h2>
        </div>

        {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

        {result && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-emerald-400 text-sm font-medium mb-3">{result.message}</p>
            {result.newHash && (
              <>
                <p className="text-xs text-slate-400 mb-2">Copy this hash and update <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">SUPER_ADMIN_PASSWORD_HASH</code> in your backend <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">.env</code> file:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-slate-300 break-all">{result.newHash}</code>
                  <button onClick={copyHash} className="flex-shrink-0 p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
                    {copied ? <CheckCheck size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Current password */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Current password</label>
            <div className="relative">
              <input required type={showPw.current ? 'text' : 'password'}
                value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="••••••••" className={inputClass} />
              <button type="button" onClick={() => toggle('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPw.current ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {/* New password */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">New password</label>
            <div className="relative">
              <input required type={showPw.new ? 'text' : 'password'}
                value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="At least 8 characters" className={inputClass} />
              <button type="button" onClick={() => toggle('new')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPw.new ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {/* Confirm password */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm new password</label>
            <div className="relative">
              <input required type={showPw.confirm ? 'text' : 'password'}
                value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Repeat new password" className={inputClass} />
              <button type="button" onClick={() => toggle('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPw.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white font-semibold text-sm transition-colors mt-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={15} />}
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
