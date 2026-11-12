/** Public site facts used in metadata, JSON-LD, footer and the demo form. Edit here only. */
export const SITE = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://buspoint.srfusiontech.com',
  name: 'BusPoint',
  company: 'SRFusion',
  companyUrl: 'https://srfusiontech.com',
  description:
    'Live school bus tracking built for international schools — calm, accurate arrival times for parents and effortless control for transport teams.',
  /** Public contact for demo follow-ups. */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@srfusiontech.com',
  /** Promise shown after a demo request — keep it true. */
  responsePromise: 'within one business day',
} as const;

/** Fallback year rendered before the client reads the clock. */
export const SITE_LAUNCH_YEAR = 2026;
