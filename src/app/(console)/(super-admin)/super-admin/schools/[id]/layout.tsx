import type { ReactNode } from 'react';
import { StaticIdGate } from '@/components/console/StaticIdGate';
import { STATIC_ID_PLACEHOLDER } from '@/lib/staticId';

// Static export: prerender one placeholder page; the backend serves it for every real id.
export function generateStaticParams() {
  return [{ id: STATIC_ID_PLACEHOLDER }];
}

export default function IdLayout({ children }: { children: ReactNode }) {
  return <StaticIdGate segmentIndex={3}>{children}</StaticIdGate>;
}
