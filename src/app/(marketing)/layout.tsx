import './marketing.css';
import { ThemeProvider } from '@/components/marketing/ThemeProvider';

/** Public website. Tailwind only. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
