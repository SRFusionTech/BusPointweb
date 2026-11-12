import type { MetadataRoute } from 'next';
import { brandAssets, palettes } from '@/theme/tokens.generated';

/** PWA manifest — colors from design tokens, icons from the brand generator. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BusPoint — School bus tracking',
    short_name: 'BusPoint',
    description: 'Live school bus tracking for international schools.',
    start_url: '/login',
    display: 'standalone',
    background_color: palettes.light.bg.canvas,
    theme_color: brandAssets.themeColorLight,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}


// Static export: emit this file at build time.
export const dynamic = 'force-static';
