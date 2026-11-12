import Link from 'next/link';
import type { Metadata } from 'next';
import './(marketing)/marketing.css';
import { BrandedState } from '@/components/marketing/BrandedState';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <BrandedState
      code="404"
      title="This stop isn’t on the route."
      body="The page you’re looking for has moved or never existed. Let’s get you back on track."
      actions={
        <>
          <Link href="/" className="btn btn-primary btn-lg">
            Back to the homepage
          </Link>
          <Link href="/login" className="btn btn-outline-on-brand btn-lg">
            Sign in to the console
          </Link>
        </>
      }
    />
  );
}
