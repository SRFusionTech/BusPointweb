'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { STATIC_ID_PLACEHOLDER } from '@/lib/staticId';

/**
 * Static export support for `[id]` routes.
 *
 * `next build` (output: 'export') prerenders each `[id]` page once with the placeholder
 * `STATIC_ID_PLACEHOLDER`; the backend serves that HTML for every real id. In the browser the
 * router may still report the placeholder, so this gate takes the real value from
 * `window.location` and renders the page only once it is known — pages never fetch with the
 * placeholder and there is no hydration mismatch.
 */
const IdContext = createContext<string | null>(null);

function segmentAt(path: string, index: number): string | null {
  const seg = path.split('/')[index];
  return seg && seg !== STATIC_ID_PLACEHOLDER ? decodeURIComponent(seg) : null;
}

/** `segmentIndex`: position of the `[id]` segment in the URL, e.g. 2 for `/routes/[id]`. */
export function StaticIdGate({ segmentIndex, children }: { segmentIndex: number; children: ReactNode }) {
  const pathname = usePathname();
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    // `next dev` and soft navigations know the real id; a static-export hard load does not.
    setId(segmentAt(pathname, segmentIndex) ?? segmentAt(window.location.pathname, segmentIndex));
  }, [pathname, segmentIndex]);

  if (!id) return null;
  // key: moving between two ids remounts the page instead of keeping stale state.
  return <IdContext.Provider key={id} value={id}>{children}</IdContext.Provider>;
}

/** The real `[id]` of the current page. Use instead of `useParams().id` under a StaticIdGate. */
export function useIdParam(): string {
  const id = useContext(IdContext);
  if (!id) throw new Error('useIdParam must be used inside <StaticIdGate>');
  return id;
}
