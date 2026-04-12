import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BusPoint — Real-Time School Bus Tracking',
  description:
    'Give schools, drivers, and parents a real-time view of every bus, every route, every day. Safe, simple, reliable.',
  metadataBase: new URL('https://buspoint.app'),
  openGraph: {
    title: 'BusPoint — Real-Time School Bus Tracking',
    description: 'Safe, simple, reliable school bus tracking for modern schools.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#020817] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
