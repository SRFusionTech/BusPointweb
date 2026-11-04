'use client';

import { useEffect, useRef, useState } from 'react';
import { Autocomplete, Loader } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';

interface Props {
  value: string;
  onChange: (address: string) => void;
  label?: string;
  withAsterisk?: boolean;
  disabled?: boolean;
  error?: string;
  id?: string;
}

declare global {
  interface Window {
    initGooglePlaces?: () => void;
    gm_authFailure?: () => void;
  }
}

type Status = 'no-key' | 'loading' | 'ready' | 'failed';

// ─── Script loader (module-level, shared by all instances) ───────────────────
let scriptState: 'idle' | 'loading' | 'ready' | 'failed' = 'idle';
const waiters: Array<(ok: boolean) => void> = [];

function loadGoogleMapsScript(apiKey: string, cb: (ok: boolean) => void) {
  if (scriptState === 'ready') { cb(true); return; }
  if (scriptState === 'failed') { cb(false); return; }

  waiters.push(cb);
  if (scriptState === 'loading') return;
  scriptState = 'loading';

  const settle = (ok: boolean) => {
    scriptState = ok ? 'ready' : 'failed';
    waiters.forEach((w) => w(ok));
    waiters.length = 0;
  };

  window.initGooglePlaces = () => settle(true);
  // Fires on an invalid key, billing problem or disabled API
  window.gm_authFailure = () => settle(false);

  const script = document.createElement('script');
  script.id = 'google-maps-script';
  // loading=async + importLibrary() is the Places API (New) pattern
  script.src =
    'https://maps.googleapis.com/maps/api/js' +
    `?key=${encodeURIComponent(apiKey)}&loading=async&callback=initGooglePlaces`;
  script.async = true;
  script.onerror = () => settle(false);
  document.head.appendChild(script);
}

let placesLib: google.maps.PlacesLibrary | null = null;
async function getPlacesLib() {
  placesLib ??= (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary;
  return placesLib;
}

// Inlined at build time by Next
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const MESSAGES: Record<'no-key' | 'failed', string> = {
  'no-key': 'Address search unavailable: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Add it to .env.local and restart the dev server.',
  failed: 'Address search unavailable. Check the API key is valid and that "Maps JavaScript API" and "Places API (New)" are enabled.',
};

/** Google Places (New) address search as a Mantine Autocomplete. */
export function AddressAutocomplete({ value, onChange, label, withAsterisk, disabled, error, id = 'address' }: Props) {
  const [status, setStatus] = useState<Status>(API_KEY ? 'loading' : 'no-key');
  const [options, setOptions] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);

  const suggestionsRef = useRef(new Map<string, google.maps.places.PlacePrediction>());
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!API_KEY) return;
    loadGoogleMapsScript(API_KEY, (ok) => setStatus(ok ? 'ready' : 'failed'));
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  async function fetchSuggestions(input: string) {
    const requestId = ++requestIdRef.current;
    if (input.trim().length < 3) { setOptions([]); return; }

    setFetching(true);
    try {
      const lib = await getPlacesLib();
      sessionTokenRef.current ??= new lib.AutocompleteSessionToken();
      const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        sessionToken: sessionTokenRef.current,
      });
      if (requestId !== requestIdRef.current) return; // a newer keystroke won

      const map = new Map<string, google.maps.places.PlacePrediction>();
      for (const s of suggestions) {
        if (s.placePrediction) map.set(s.placePrediction.text.toString(), s.placePrediction);
      }
      suggestionsRef.current = map;
      setOptions([...map.keys()]);
    } catch {
      // A rejected request means the key/API isn't usable — surface it, don't fail silently
      if (requestId === requestIdRef.current) { setOptions([]); setStatus('failed'); }
    } finally {
      if (requestId === requestIdRef.current) setFetching(false);
    }
  }

  function handleChange(next: string) {
    onChange(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Selecting an option also fires onChange with its text — don't search again
    if (status !== 'ready' || suggestionsRef.current.has(next)) return;
    debounceRef.current = setTimeout(() => fetchSuggestions(next), 300);
  }

  async function handleSelect(text: string) {
    const prediction = suggestionsRef.current.get(text);
    if (!prediction) return;
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ['formattedAddress'] }); // closes the billing session
      if (place.formattedAddress) onChange(place.formattedAddress);
    } catch {
      // keep the prediction text that's already in the field
    } finally {
      sessionTokenRef.current = null;
      setOptions([]);
    }
  }

  const unavailable = status === 'no-key' || status === 'failed';

  return (
    <Autocomplete
      id={id}
      label={label}
      withAsterisk={withAsterisk}
      placeholder={unavailable ? 'Address search unavailable' : status === 'loading' ? 'Loading maps…' : 'Start typing the school address…'}
      value={value}
      onChange={handleChange}
      onOptionSubmit={handleSelect}
      data={options}
      filter={({ options: opts }) => opts} // Google already filtered
      limit={8}
      leftSection={<IconMapPin size={16} />}
      rightSection={fetching ? <Loader size={14} /> : null}
      disabled={disabled || unavailable || status === 'loading'}
      error={unavailable ? MESSAGES[status] : error}
      autoComplete="off"
    />
  );
}
