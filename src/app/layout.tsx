import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import { COLOR_SCHEME_STORAGE_KEY } from '@/theme/mantine-theme';
import { brandAssets } from '@/theme/tokens.generated';
import { SITE } from '@/lib/site';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], display: 'swap', axes: ['opsz'] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'BusPoint — Live school bus tracking for international schools', template: '%s · BusPoint' },
  description: SITE.description,
  applicationName: 'BusPoint',
  keywords: ['school bus tracking', 'international school transport', 'live bus tracking', 'parent app', 'school transport software', 'BusPoint', 'SRFusion'],
  authors: [{ name: 'SRFusion', url: 'https://srfusiontech.com' }],
  creator: 'SRFusion',
  openGraph: {
    type: 'website',
    siteName: 'BusPoint',
    title: 'BusPoint — The school run, in perfect view.',
    description: SITE.description,
    url: SITE.url,
  },
  twitter: { card: 'summary_large_image', title: 'BusPoint — The school run, in perfect view.', description: SITE.description },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: brandAssets.themeColorLight },
    { media: '(prefers-color-scheme: dark)', color: brandAssets.themeColorDark },
  ],
  width: 'device-width',
  initialScale: 1,
};

// Marketing theme (data-theme) runs before hydration to avoid a flash; the console's Mantine
// scheme is restored by <ColorSchemeScript> from the same storage key.
const noFlashScript = `
  (function() {
    try {
      var t = localStorage.getItem('${COLOR_SCHEME_STORAGE_KEY}');
      if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
    } catch(e) {}
    try {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
        document.documentElement.classList.add('reveal-on');
      }
    } catch(e) {}
  })();
`;

/**
 * Styling is split by route group, sharing ONE token source (src/theme/tokens.generated.css):
 *   (marketing) → Tailwind 4 with semantic utilities only
 *   (console)   → Mantine with a generated theme
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" localStorageKey={COLOR_SCHEME_STORAGE_KEY} />
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
