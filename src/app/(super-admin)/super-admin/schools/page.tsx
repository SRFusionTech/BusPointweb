'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type SchoolSummary } from '@/lib/api';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';

// ─── Password generator ───────────────────────────────────────────────────────
function generatePassword(): string {
  const words = ['School', 'Admin', 'BusPoint', 'Access', 'Portal'];
  const word = words[Math.floor(Math.random() * words.length)];
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  const symbols = ['@', '#', '!', '$'];
  return word + digits + symbols[Math.floor(Math.random() * symbols.length)];
}

// ─── Form state ───────────────────────────────────────────────────────────────
interface FormState {
  name: string;
  address: string;
  logoUrl: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  adminPhone: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  address: '',
  logoUrl: '',
  adminEmail: '',
  adminPassword: '',
  adminName: '',
  adminPhone: '',
};

type FieldErrors = Partial<Record<keyof FormState | 'form', string>>;

// ─── Reset password modal ─────────────────────────────────────────────────────
function ResetPasswordModal({
  school,
  onClose,
}: {
  school: SchoolSummary;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleReset() {
    setLoading(true);
    setError('');
    try {
      const res = await api.schools.resetAdminPassword(school.id);
      setResult(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-[var(--color-surface-primary)] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Reset Admin Password</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          A new temporary password will be generated for <strong>{school.name}</strong>.
        </p>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {result ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Share this password with the school admin. It won&apos;t be shown again.
            </p>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Admin email</p>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{result.email}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-3 mb-1">Temporary password</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-base font-mono font-bold text-[var(--color-primary-700)]">
                  {result.tempPassword}
                </code>
                <button
                  onClick={() => copy(result.tempPassword)}
                  className="btn btn-secondary text-xs px-3 py-1.5"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-primary w-full mt-2">Done</button>
          </div>
        ) : (
          <div className="mt-5 flex gap-3">
            <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button onClick={handleReset} className="btn btn-primary flex-1" disabled={loading}>
              {loading ? 'Generating…' : 'Reset password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetTarget, setResetTarget] = useState<SchoolSummary | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const loadSchools = useCallback(async () => {
    try {
      const res = await api.schools.list();
      setSchools(res.data);
    } catch {
      // silent — list stays empty
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadSchools(); }, [loadSchools]);

  useEffect(() => {
    if (drawerOpen) setTimeout(() => firstInputRef.current?.focus(), 100);
  }, [drawerOpen]);

  function set<K extends keyof FormState>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function copyPassword(pw: string) {
    navigator.clipboard.writeText(pw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function validate(): boolean {
    const e: FieldErrors = {};
    if (!form.name.trim()) e.name = 'School name is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.adminEmail.trim()) e.adminEmail = 'Admin email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) e.adminEmail = 'Invalid email';
    if (!form.adminPassword) e.adminPassword = 'Generate a password first';
    if (!form.adminName.trim()) e.adminName = 'Admin name is required';
    if (!form.adminPhone.trim()) e.adminPhone = 'Phone number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});

    try {
      await api.schools.create({
        name: form.name.trim(),
        address: form.address.trim(),
        logoUrl: form.logoUrl.trim() || undefined,
        adminEmail: form.adminEmail.trim().toLowerCase(),
        adminPassword: form.adminPassword,
        adminName: form.adminName.trim(),
        adminPhone: form.adminPhone.trim(),
      });
      setDrawerOpen(false);
      setForm(EMPTY_FORM);
      loadSchools();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Failed to create school' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Schools</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {schools.length} school{schools.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setDrawerOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline -mt-0.5 mr-1.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add School
        </button>
      </div>

      {/* List */}
      {loadingList ? (
        <div className="flex justify-center py-16">
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--color-primary-100)]" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--color-primary-600)]" />
          </div>
        </div>
      ) : schools.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] py-20 text-center">
          <p className="text-[var(--color-text-muted)] text-sm">No schools yet. Add your first one.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {schools.map((s) => (
            <div key={s.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                {s.logoUrl ? (
                  <img src={s.logoUrl} alt={s.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-100)] shrink-0 text-[var(--color-primary-700)] font-bold text-lg">
                    {s.name[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)] truncate">{s.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{s.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-1 border-t border-[var(--color-border)]">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => setResetTarget(s)}
                  className="ml-auto text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary-600)] transition-colors"
                >
                  Reset password
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-full max-w-md bg-[var(--color-surface-primary)] h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Add School</h2>
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1.5 hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex-1 px-6 py-5 space-y-5">
              {errors.form && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errors.form}
                </div>
              )}

              {/* School details */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">School Details</p>
                <div className="space-y-4">
                  <div>
                    <label className="label" htmlFor="school-name">School name <span className="text-red-500">*</span></label>
                    <input
                      ref={firstInputRef}
                      id="school-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      className={`input ${errors.name ? 'border-red-400' : ''}`}
                      placeholder="Sunrise Public School"
                      disabled={submitting}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="label" htmlFor="address">Address <span className="text-red-500">*</span></label>
                    <AddressAutocomplete
                      id="address"
                      value={form.address}
                      onChange={(v) => set('address', v)}
                      disabled={submitting}
                      error={errors.address}
                    />
                    {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                  </div>

                  <div>
                    <label className="label" htmlFor="logo-url">School logo URL <span className="text-[var(--color-text-muted)] font-normal">(optional)</span></label>
                    <input
                      id="logo-url"
                      type="url"
                      value={form.logoUrl}
                      onChange={(e) => set('logoUrl', e.target.value)}
                      className="input"
                      placeholder="https://school.com/logo.png"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--color-border)]" />

              {/* Admin account */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Admin Account</p>
                <div className="space-y-4">
                  <div>
                    <label className="label" htmlFor="admin-name">Admin name <span className="text-red-500">*</span></label>
                    <input
                      id="admin-name"
                      type="text"
                      value={form.adminName}
                      onChange={(e) => set('adminName', e.target.value)}
                      className={`input ${errors.adminName ? 'border-red-400' : ''}`}
                      placeholder="Ravi Kumar"
                      disabled={submitting}
                    />
                    {errors.adminName && <p className="mt-1 text-xs text-red-500">{errors.adminName}</p>}
                  </div>

                  <div>
                    <label className="label" htmlFor="admin-phone">Phone number <span className="text-red-500">*</span></label>
                    <input
                      id="admin-phone"
                      type="tel"
                      value={form.adminPhone}
                      onChange={(e) => set('adminPhone', e.target.value)}
                      className={`input ${errors.adminPhone ? 'border-red-400' : ''}`}
                      placeholder="+91 98765 43210"
                      disabled={submitting}
                    />
                    {errors.adminPhone && <p className="mt-1 text-xs text-red-500">{errors.adminPhone}</p>}
                  </div>

                  <div>
                    <label className="label" htmlFor="admin-email">Email address <span className="text-red-500">*</span></label>
                    <input
                      id="admin-email"
                      type="email"
                      value={form.adminEmail}
                      onChange={(e) => set('adminEmail', e.target.value)}
                      className={`input ${errors.adminEmail ? 'border-red-400' : ''}`}
                      placeholder="admin@school.com"
                      disabled={submitting}
                    />
                    {errors.adminEmail && <p className="mt-1 text-xs text-red-500">{errors.adminEmail}</p>}
                  </div>

                  <div>
                    <label className="label" htmlFor="admin-password">Password <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          id="admin-password"
                          type="text"
                          readOnly
                          value={form.adminPassword}
                          className={`input font-mono pr-10 bg-[var(--color-surface-secondary)] ${errors.adminPassword ? 'border-red-400' : ''}`}
                          placeholder="Click Generate →"
                        />
                        {form.adminPassword && (
                          <button
                            type="button"
                            onClick={() => copyPassword(form.adminPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-primary-600)]"
                            title="Copy password"
                          >
                            {copied ? (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => { const pw = generatePassword(); set('adminPassword', pw); copyPassword(pw); }}
                        className="btn btn-secondary whitespace-nowrap"
                        disabled={submitting}
                      >
                        Generate &amp; Copy
                      </button>
                    </div>
                    {errors.adminPassword
                      ? <p className="mt-1 text-xs text-red-500">{errors.adminPassword}</p>
                      : form.adminPassword && <p className="mt-1 text-xs text-[var(--color-text-muted)]">Password copied to clipboard. Share it with the admin now.</p>
                    }
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-[var(--color-border)] pt-5 flex gap-3 pb-6">
                <button type="button" onClick={() => setDrawerOpen(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create School'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <ResetPasswordModal
          school={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}
