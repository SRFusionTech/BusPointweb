'use client';

import { useEffect, useState } from 'react';
import { SITE_LAUNCH_YEAR } from '@/lib/site';

/** Current year, read after mount (Cache Components forbids reading the clock during prerender). */
export function Year() {
  const [year, setYear] = useState<number>(SITE_LAUNCH_YEAR);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <span>{year}</span>;
}
