import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { PageLoader } from "@/components/ui/PageLoader";
import "./globals.css";

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

// Runs before React hydrates — prevents flash of wrong theme
const noFlashScript = `
  (function() {
    try {
      var t = localStorage.getItem('buspoint-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>
        <ThemeProvider>
          <PageLoader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
