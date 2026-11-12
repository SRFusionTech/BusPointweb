'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { BrandedState } from '@/components/marketing/BrandedState';

export default function MarketingError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <BrandedState
      title="Something went wrong."
      body="We hit an unexpected problem loading this page. Please try again in a moment."
      actions={
        <>
          <button type="button" onClick={() => retry()} className="btn btn-primary btn-lg">
            Try again
          </button>
          <Link href="/" className="btn btn-outline-on-brand btn-lg">
            Back to the homepage
          </Link>
        </>
      }
    />
  );
}
