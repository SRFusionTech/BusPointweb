'use client';

import { useEffect, useState } from 'react';

type Status = 'idle' | 'loading' | 'ready' | 'error';

let scriptPromise: Promise<void> | null = null;

function loadScript(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('google-maps-js') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps.')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-js';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps.'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function useGoogleMaps(): { status: Status; error: string | null } {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
    if (!apiKey) {
      setStatus('error');
      setError('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.');
      return;
    }

    if ((window as any).google?.maps?.places) {
      setStatus('ready');
      return;
    }

    setStatus('loading');
    loadScript(apiKey)
      .then(() => setStatus('ready'))
      .catch((err) => {
        setStatus('error');
        setError(err?.message ?? 'Failed to load Google Maps.');
      });
  }, []);

  return { status, error };
}
