import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Privacy policy', alternates: { canonical: '/privacy' } };

// NOTE: plain-language summary of how the product works today. Have it reviewed by counsel before launch.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="7 November 2026">
      <p>BusPoint is provided by {SITE.company} to schools. This page explains, in plain language, what information BusPoint handles and why.</p>
      <h2>Who we work for</h2>
      <p>Schools are our customers. Each school decides who gets an account — families, drivers and staff cannot sign themselves up. The school controls its own data.</p>
      <h2>What we handle</h2>
      <ul>
        <li>Account details your school provides: names, mobile numbers, email addresses, a child’s name and class, and the family’s pickup stop.</li>
        <li>The bus’s location, collected from the driver’s phone only while a trip is running.</li>
        <li>Trip records: start and end times, stops reached or skipped, and safety alerts.</li>
      </ul>
      <h2>Who can see what</h2>
      <p>Families see the bus, their own stop and the school — never other families’ stops or children. Drivers see their route and the students on it. School administrators see their own school only.</p>
      <h2>Demo requests</h2>
      <p>When you request a demo, we use the details you send only to contact you about BusPoint. We don’t sell your information.</p>
      <h2>Contact</h2>
      <p>
        Questions about privacy: <a className="font-semibold text-fg-link" href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </LegalPage>
  );
}
