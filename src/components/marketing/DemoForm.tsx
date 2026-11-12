'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, CalendarCheck, CheckCircle, EnvelopeSimple, SpinnerGap, WarningCircle } from '@phosphor-icons/react';
import { API_BASE } from '@/lib/apiBase';
import { SITE } from '@/lib/site';

const SCHOOL_TYPES = [
  ['ib', 'IB'],
  ['cambridge', 'British / Cambridge'],
  ['american', 'American'],
  ['national', 'National curriculum'],
  ['other', 'Other'],
] as const;
const STUDENTS = [
  ['under_500', 'Under 500'],
  ['500_1000', '500–1,000'],
  ['1000_2500', '1,000–2,500'],
  ['over_2500', '2,500+'],
] as const;
const BUSES = [
  ['1_5', '1–5'],
  ['6_15', '6–15'],
  ['16_40', '16–40'],
  ['over_40', '40+'],
] as const;
const CONTACT = [
  ['email', 'Email'],
  ['phone', 'Phone call'],
  ['whatsapp', 'WhatsApp'],
] as const;
const TIMES = [
  ['morning', 'Morning'],
  ['afternoon', 'Afternoon'],
  ['evening', 'Evening'],
  ['any', 'Any time'],
] as const;
const DIAL_CODES = ['+971', '+966', '+974', '+973', '+968', '+965', '+91', '+65', '+852', '+60', '+66', '+62', '+86', '+81', '+82', '+44', '+41', '+49', '+33', '+31', '+34', '+1', '+61', '+64', '+27', '+254', '+20'];

type Form = {
  schoolName: string;
  city: string;
  country: string;
  schoolType: string;
  studentRange: string;
  busRange: string;
  website: string;
  contactName: string;
  contactRole: string;
  email: string;
  dial: string;
  phone: string;
  preferredContact: string;
  preferredTime: string;
  message: string;
  consent: boolean;
  companyFax: string;
};
type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = {
  schoolName: '',
  city: '',
  country: '',
  schoolType: '',
  studentRange: '',
  busRange: '',
  website: '',
  contactName: '',
  contactRole: '',
  email: '',
  dial: '+971',
  phone: '',
  preferredContact: 'email',
  preferredTime: 'any',
  message: '',
  consent: false,
  companyFax: '',
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(step: number, f: Form): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (f.schoolName.trim().length < 2) e.schoolName = 'Enter your school’s name.';
    if (f.city.trim().length < 2) e.city = 'Enter the city.';
    if (f.country.trim().length < 2) e.country = 'Enter the country.';
  } else {
    if (f.contactName.trim().length < 2) e.contactName = 'Enter your full name.';
    if (f.contactRole.trim().length < 2) e.contactRole = 'Tell us your role.';
    if (!EMAIL.test(f.email.trim())) e.email = 'Enter a valid work email.';
    const digits = f.phone.replace(/\D/g, '');
    if (digits.length < 6 || digits.length > 13) e.phone = 'Enter a valid phone number.';
    if (!f.consent) e.consent = 'Please agree so we can contact you.';
  }
  return e;
}

function Field({ label, error, optional, children, id }: { label: string; error?: string; optional?: boolean; children: ReactNode; id: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-fg-secondary">
        {label}
        {optional && <span className="text-xs font-normal text-fg-muted">Optional</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm text-danger-text" role="alert">
          <WarningCircle size={16} weight="fill" /> {error}
        </p>
      )}
    </div>
  );
}

function Choices({ name, options, value, onChange }: { name: string; options: readonly (readonly [string, string])[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label={name} className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(110px,1fr))]">
      {options.map(([v, label]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(value === v ? '' : v)} className="choice">
          {label}
        </button>
      ))}
    </div>
  );
}

export function DemoForm() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const startedAt = useRef(0);
  const utm = useRef<Record<string, string>>({});
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    const p = new URLSearchParams(window.location.search);
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      const v = p.get(k);
      if (v) utm.current[k] = v.slice(0, 120);
    }
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function next() {
    const e = validate(0, form);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep(1);
    topRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (step === 0) return next();
    const e = validate(1, form);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStatus('sending');
    setServerError(null);
    try {
      const res = await fetch(`${API_BASE}/api/demo-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: form.schoolName,
          city: form.city,
          country: form.country,
          schoolType: form.schoolType || undefined,
          studentRange: form.studentRange || undefined,
          busRange: form.busRange || undefined,
          website: form.website || undefined,
          contactName: form.contactName,
          contactRole: form.contactRole,
          email: form.email,
          phone: `${form.dial}${form.phone.replace(/\D/g, '')}`,
          preferredContact: form.preferredContact || undefined,
          preferredTime: form.preferredTime || undefined,
          message: form.message || undefined,
          consent: form.consent,
          companyFax: form.companyFax || undefined,
          elapsedMs: Date.now() - startedAt.current,
          source: typeof document !== 'undefined' ? document.referrer.slice(0, 255) || 'direct' : undefined,
          utm: Object.keys(utm.current).length ? utm.current : undefined,
        }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
      if (!res.ok) {
        const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
        throw new Error(res.status === 429 ? 'We’ve received several requests from your network. Please email us instead.' : msg || 'Something went wrong. Please try again.');
      }
      setStatus('done');
      topRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    } catch (err) {
      setStatus('error');
      setServerError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : 'We couldn’t reach BusPoint. Check your connection, or email us directly.');
    }
  }

  if (status === 'done') {
    return (
      <div ref={topRef} className="card scroll-mt-28 p-8 text-center md:p-12" role="status" aria-live="polite">
        <motion.span
          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 180 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-bg text-success-icon"
        >
          <CheckCircle size={36} weight="fill" />
        </motion.span>
        <h2 className="font-display mt-6 text-3xl text-fg-primary">Thank you, {form.contactName.split(' ')[0]}.</h2>
        <p className="mx-auto mt-3 max-w-md text-md leading-7 text-fg-secondary">
          We’ve received your request for <strong className="font-semibold text-fg-primary">{form.schoolName}</strong>. Someone from our team will reach out {SITE.responsePromise}.
        </p>
        <ol className="mx-auto mt-8 grid max-w-md gap-3 text-left">
          {[
            { Icon: EnvelopeSimple, t: `We’ll contact you by ${form.preferredContact === 'whatsapp' ? 'WhatsApp' : form.preferredContact === 'phone' ? 'phone' : 'email'}` },
            { Icon: CalendarCheck, t: 'We agree a 30-minute walkthrough that suits your team' },
            { Icon: CheckCircle, t: 'We show BusPoint on your own routes and answer every question' },
          ].map(({ Icon, t }) => (
            <li key={t} className="flex items-center gap-3 rounded-xl bg-surface-alt px-4 py-3 text-sm text-fg-secondary">
              <Icon size={20} weight="duotone" className="shrink-0 text-fg-link" /> {t}
            </li>
          ))}
        </ol>
        <Link href="/" className="btn btn-secondary mt-8">
          Back to the homepage
        </Link>
      </div>
    );
  }

  const inputProps = (k: keyof Form, id = k) => ({
    id,
    value: form[k] as string,
    onChange: (e: { target: { value: string } }) => set(k, e.target.value as never),
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `${id}-error` : undefined,
    className: 'field',
  });

  return (
    <form ref={topRef as never} onSubmit={submit} noValidate className="card scroll-mt-28 p-6 md:p-10">
      <div className="flex items-center gap-3" aria-label={`Step ${step + 1} of 2`}>
        {['Your school', 'Your details'].map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-2">
            <div className={`h-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-action' : 'bg-sunken'}`} />
            <span className={`text-xs font-semibold ${i === step ? 'text-fg-primary' : 'text-fg-muted'}`}>
              {i + 1}. {label}
            </span>
          </div>
        ))}
      </div>

      {/* Honeypot — hidden from people and assistive tech; bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="companyFax">Company fax</label>
        <input id="companyFax" tabIndex={-1} autoComplete="off" value={form.companyFax} onChange={(e) => set('companyFax', e.target.value)} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, x: step ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: step ? -24 : 24 }}
          transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-8 grid gap-6"
        >
          {step === 0 ? (
            <>
              <Field id="schoolName" label="School name" error={errors.schoolName}>
                <input {...inputProps('schoolName')} autoComplete="organization" placeholder="e.g. Greenfield International School" />
              </Field>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field id="city" label="City" error={errors.city}>
                  <input {...inputProps('city')} autoComplete="address-level2" placeholder="e.g. Dubai" />
                </Field>
                <Field id="country" label="Country" error={errors.country}>
                  <input {...inputProps('country')} autoComplete="country-name" placeholder="e.g. United Arab Emirates" />
                </Field>
              </div>
              <Field id="schoolType" label="Curriculum" optional>
                <Choices name="Curriculum" options={SCHOOL_TYPES} value={form.schoolType} onChange={(v) => set('schoolType', v)} />
              </Field>
              <div className="grid gap-6 md:grid-cols-2">
                <Field id="studentRange" label="Students" optional>
                  <Choices name="Students" options={STUDENTS} value={form.studentRange} onChange={(v) => set('studentRange', v)} />
                </Field>
                <Field id="busRange" label="School buses" optional>
                  <Choices name="School buses" options={BUSES} value={form.busRange} onChange={(v) => set('busRange', v)} />
                </Field>
              </div>
              <Field id="website" label="School website" optional>
                <input {...inputProps('website')} type="url" inputMode="url" autoComplete="url" placeholder="www.yourschool.edu" />
              </Field>
            </>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field id="contactName" label="Full name" error={errors.contactName}>
                  <input {...inputProps('contactName')} autoComplete="name" placeholder="Your name" />
                </Field>
                <Field id="contactRole" label="Role" error={errors.contactRole}>
                  <input {...inputProps('contactRole')} autoComplete="organization-title" placeholder="e.g. Head of Operations" />
                </Field>
              </div>
              <Field id="email" label="Work email" error={errors.email}>
                <input {...inputProps('email')} type="email" inputMode="email" autoComplete="email" placeholder="you@yourschool.edu" />
              </Field>
              <Field id="phone" label="Phone" error={errors.phone}>
                <div className="flex gap-2">
                  <select aria-label="Country code" value={form.dial} onChange={(e) => set('dial', e.target.value)} className="field w-[104px] shrink-0 tnum">
                    {DIAL_CODES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input {...inputProps('phone')} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="50 123 4567" />
                </div>
              </Field>
              <div className="grid gap-6 md:grid-cols-2">
                <Field id="preferredContact" label="Best way to reach you" optional>
                  <Choices name="Best way to reach you" options={CONTACT} value={form.preferredContact} onChange={(v) => set('preferredContact', v)} />
                </Field>
                <Field id="preferredTime" label="Best time" optional>
                  <Choices name="Best time" options={TIMES} value={form.preferredTime} onChange={(v) => set('preferredTime', v)} />
                </Field>
              </div>
              <Field id="message" label="Anything we should know?" optional>
                <textarea {...inputProps('message')} rows={4} className="field resize-y" placeholder="Number of campuses, current tracking setup, timelines…" />
              </Field>
              <div>
                <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-fg-secondary">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => set('consent', e.target.checked)}
                    aria-invalid={errors.consent ? true : undefined}
                    className="mt-1 h-5 w-5 shrink-0 accent-[var(--bp-action-primary-bg)]"
                  />
                  <span>
                    I agree that {SITE.company} may contact me about BusPoint, as described in the{' '}
                    <Link href="/privacy" className="font-semibold text-fg-link underline-offset-4 hover:underline">
                      privacy policy
                    </Link>
                    .
                  </span>
                </label>
                {errors.consent && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-danger-text" role="alert">
                    <WarningCircle size={16} weight="fill" /> {errors.consent}
                  </p>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {status === 'error' && serverError && (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-danger-border bg-danger-bg p-4 text-sm text-danger-text">
          <WarningCircle size={20} weight="fill" className="shrink-0" />
          <span>
            {serverError}{' '}
            <a href={`mailto:${SITE.email}`} className="font-semibold underline">
              {SITE.email}
            </a>
          </span>
        </div>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step === 1 ? (
          <button type="button" onClick={() => setStep(0)} className="btn btn-ghost">
            <ArrowLeft size={18} weight="bold" /> Back
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="btn btn-primary btn-lg" disabled={status === 'sending'}>
          {status === 'sending' ? (
            <>
              <SpinnerGap size={20} className="animate-spin" /> Sending…
            </>
          ) : step === 0 ? (
            <>
              Continue <ArrowRight size={18} weight="bold" />
            </>
          ) : (
            'Request my demo'
          )}
        </button>
      </div>
    </form>
  );
}
