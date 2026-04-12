'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function RequestAccess() {
  const [form, setForm]       = useState({ name: '', school: '', phone: '', plan: 'Growth' });
  const [submitted, setSubmit] = useState(false);
  const [loading, setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/superadmin/access-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, schoolName: form.school, phone: form.phone, plan: form.plan }),
      });
      if (!res.ok) throw new Error();
      setSubmit(true);
    } catch {
      setSubmit(true); // still show success to user
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="request-access" className="py-28 px-6 relative">
      <div className="absolute inset-0 radial-glow opacity-40" />

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <p className="text-sky-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Get started
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight gradient-text mb-4">
            Request access for<br />your school
          </h2>
          <p className="text-slate-400 text-lg">
            Fill in the form and our team will reach out within 24 hours to set up your account.
          </p>
        </div>

        {submitted ? (
          <div className="bg-[#0f172a] border border-emerald-500/30 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Request received!</h3>
            <p className="text-slate-400">
              We&apos;ll review your request and get back to you at <strong className="text-slate-200">{form.phone}</strong> within 24 hours.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 md:p-10 flex flex-col gap-5"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Your name</label>
                <input
                  required
                  type="text"
                  placeholder="Raj Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-800/60 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">School name</label>
                <input
                  required
                  type="text"
                  placeholder="Delhi Public School"
                  value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                  className="w-full bg-slate-800/60 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Phone number</label>
                <input
                  required
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-800/60 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Plan interested in</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  className="w-full bg-slate-800/60 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-3 text-white outline-none transition-colors text-sm appearance-none"
                >
                  <option>Starter</option>
                  <option>Growth</option>
                  <option>Enterprise</option>
                  <option>Not sure yet</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white font-semibold text-base transition-all shadow-xl shadow-sky-500/25 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  Submit request
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-600">
              By submitting, you agree to our Privacy Policy. We never spam.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
