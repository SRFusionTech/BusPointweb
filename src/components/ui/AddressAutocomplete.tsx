'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  onChange: (address: string) => void;
  disabled?: boolean;
  error?: string;
  id?: string;
}

declare global {
  interface Window {
    google: typeof google;
    initGooglePlaces?: () => void;
  }
}

let scriptLoaded = false;
const callbacks: Array<() => void> = [];

function loadGooglePlacesScript(apiKey: string, onLoad: () => void) {
  if (scriptLoaded) { onLoad(); return; }
  callbacks.push(onLoad);
  if (document.querySelector('#google-places-script')) return;

  window.initGooglePlaces = () => {
    scriptLoaded = true;
    callbacks.forEach((cb) => cb());
    callbacks.length = 0;
  };

  const script = document.createElement('script');
  script.id = 'google-places-script';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export function AddressAutocomplete({ value, onChange, disabled, error, id = 'address' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [ready, setReady] = useState(scriptLoaded);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
    if (!key) return;

    loadGooglePlacesScript(key, () => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['formatted_address'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current!.getPlace();
      if (place.formatted_address) {
        onChange(place.formatted_address);
      }
    });
  }, [ready, onChange]);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      autoComplete="off"
      placeholder="Start typing school address…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`input ${error ? 'border-red-400 focus:border-red-400' : ''}`}
    />
  );
}
