import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { COLOR_SCHEME_STORAGE_KEY } from "@/theme/mantine-theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "BusPoint by SRFusion", template: "%s | BusPoint" },
  description:
    "Real-time school bus tracking for parents and schools — by SRFusion.",
  keywords: ["school bus", "live tracking", "parent app", "srfusion", "buspoint"],
  authors: [{ name: "SRFusion", url: "https://srfusiontech.com" }],
};

// Landing page (Tailwind) theme: runs before hydration to avoid a flash.
// The console's Mantine theme is handled by <ColorSchemeScript> using the same key.
const noFlashScript = `
  (function() {
    try {
      var t = localStorage.getItem('${COLOR_SCHEME_STORAGE_KEY}');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    } catch(e) {}
  })();
`;

/**
 * Styling is split by route group:
 *   (marketing) → Tailwind   — public website
 *   (console)   → Mantine    — login + admin panels
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" localStorageKey={COLOR_SCHEME_STORAGE_KEY} />
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
