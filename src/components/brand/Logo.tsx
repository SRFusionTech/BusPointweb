import { useId } from 'react';
import { MARK, WORDMARK } from './logoGeometry.generated';

type Props = {
  /** Rendered height in px. */
  size?: number;
  className?: string;
  /** Pin + wordmark color (defaults to currentColor so it follows text color). */
  color?: string;
  /** Live-dot color (defaults to the live token). */
  dotColor?: string;
  title?: string;
};

/**
 * Waypoint mark — same geometry as the app icon, favicon and splash
 * (design/brand/geometry.mjs → logoGeometry.generated.ts). Colors come from CSS variables.
 */
export function LogoMark({ size = 32, className, color = 'currentColor', dotColor = 'var(--bp-live-pulse)', title = 'BusPoint' }: Props) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <defs>
        <mask id={`bp-m-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="white" />
          <path d={MARK.route} fill="none" stroke="black" strokeWidth={MARK.routeWidth} strokeLinecap="round" />
          <circle cx={MARK.origin.cx} cy={MARK.origin.cy} r={MARK.origin.r} fill="black" />
          <circle cx={MARK.dot.cx} cy={MARK.dot.cy} r={MARK.dot.r + MARK.dotGap} fill="black" />
        </mask>
      </defs>
      <path d={MARK.pin} fill={color} mask={`url(#bp-m-${id})`} />
      <circle cx={MARK.dot.cx} cy={MARK.dot.cy} r={MARK.dot.r} fill={dotColor} />
    </svg>
  );
}

/** Horizontal lockup (mark + outlined "BusPoint" wordmark). */
export function Logo({ size = 28, className, color = 'currentColor', dotColor, title = 'BusPoint' }: Props) {
  const markSize = WORDMARK.capHeight * 1.62;
  const gap = markSize * 0.22;
  const w = markSize + gap + WORDMARK.width;
  const textY = (markSize + WORDMARK.capHeight) / 2;
  const scale = size / markSize;
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', height: size }} role="img" aria-label={title}>
      <LogoMark size={size} color={color} dotColor={dotColor} title={title} />
      <svg width={(w - markSize) * scale} height={size} viewBox={`${markSize} 0 ${w - markSize} ${markSize}`} aria-hidden="true">
        <path transform={`translate(${markSize + gap} ${textY})`} d={WORDMARK.d} fill={color} />
      </svg>
    </span>
  );
}
