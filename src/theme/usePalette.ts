'use client';

import { useComputedColorScheme } from '@mantine/core';
import { palettes } from './tokens.generated';
import { mapStyles } from './mapStyle.generated';

/**
 * Resolved semantic colors for the current console scheme — for APIs that need real color
 * strings instead of CSS variables (Google Maps markers/polylines, canvas, charts).
 */
export function usePalette() {
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  return { scheme, colors: palettes[scheme], mapStyle: mapStyles[scheme] };
}
