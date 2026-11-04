'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

type FieldError = { current?: string; next?: string; confirm?: string; form?: string };

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const e: FieldError = {};
    if (!current) e.current = 'Current password is required';
    if (!next) e.next = 'New password is required';
    else if (next.length < 8) e.next = 'Must be at least 8 characters';
    else if (!/[A-Z]/.test(next)) e.next = 'Must contain at least one uppercase letter';
    else if (!/[0-9]/.test(next)) e.next = 'Must contain at least one number';
    if (next !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    setSuccess(false);

    try {
      await api.auth.changePassword(current, next);
      setSuccess(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Change Password</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)] mb-6">
        Choose a strong password you don&apos;t use elsewhere.
      </p>

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Password changed successfully.
        </div>
      )}

      {errors.form && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="card p-6 flex flex-col gap-5">
        <div>
          <label className="label" htmlFor="current">Current password</label>
          <input
            id="current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => { setCurrent(e.target.value); setErrors((p) => ({ ...p, current: undefined })); }}
            className={`input ${errors.current ? 'border-red-400' : ''}`}
            disabled={loading}
          />
          {errors.current && <p className="mt-1 text-xs text-red-500">{errors.current}</p>}
        </div>

        <div>
          <label className="label" htmlFor="next">New password</label>
          <input
            id="next"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => { setNext(e.target.value); setErrors((p) => ({ ...p, next: undefined })); }}
            className={`input ${errors.next ? 'border-red-400' : ''}`}
            disabled={loading}
          />
          {errors.next
            ? <p className="mt-1 text-xs text-red-500">{errors.next}</p>
            : <p className="mt-1 text-xs text-[var(--color-text-muted)]">Min 8 characters, one uppercase, one number.</p>
          }
        </div>

        <div>
          <label className="label" htmlFor="confirm">Confirm new password</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })); }}
            className={`input ${errors.confirm ? 'border-red-400' : ''}`}
            disabled={loading}
          />
          {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm}</p>}
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
