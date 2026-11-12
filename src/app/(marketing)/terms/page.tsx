import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Terms of service', alternates: { canonical: '/terms' } };

// NOTE: placeholder summary — replace with the agreement your schools sign before launch.
export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="7 November 2026">
      <p>BusPoint is licensed to schools by {SITE.company} under a written agreement. That agreement governs the service; this page summarises how the apps are meant to be used.</p>
      <h2>Using BusPoint</h2>
      <ul>
        <li>Accounts are issued by your school and are personal — please don’t share your password.</li>
        <li>Drivers should start a trip before setting off and never handle the phone while driving.</li>
        <li>Arrival times are estimates based on live GPS and traffic conditions.</li>
      </ul>
      <h2>Contact</h2>
      <p>
        For anything about your account, contact your school. For anything else: <a className="font-semibold text-fg-link" href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </LegalPage>
  );
}
