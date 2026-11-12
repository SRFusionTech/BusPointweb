'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * Fade + 16px rise when scrolled into view (once).
 * Progressive enhancement: content is visible in the server HTML; it is only pre-hidden when
 * the root layout's inline script has set `html.reveal-on` (JS running, motion allowed).
 */
export function Reveal({ children, delay = 0, className = '', as = 'div' }: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'section' }) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Comp = as;
  const style: CSSProperties | undefined = delay ? { transitionDelay: `${Math.round(delay * 1000)}ms` } : undefined;
  return (
    <Comp ref={ref as never} className={`reveal ${className}`} data-in={shown ? '' : undefined} style={style}>
      {children}
    </Comp>
  );
}
