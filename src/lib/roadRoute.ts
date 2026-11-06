import { loadGoogleMaps } from '@/components/console/AddressAutocomplete';
import { decodePolyline } from '@/lib/polyline';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RoadRoute {
  path: LatLng[];
  meters: number;
  seconds: number;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes';
/** Routes API allows 25 intermediate waypoints per request. */
const MAX_INTERMEDIATES = 25;

const waypoint = (p: LatLng) => ({ location: { latLng: { latitude: p.lat, longitude: p.lng } } });

async function computeLeg(points: LatLng[], decode: (encoded: string) => LatLng[], signal: AbortSignal) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify({
      origin: waypoint(points[0]),
      destination: waypoint(points[points.length - 1]),
      intermediates: points.slice(1, -1).map(waypoint),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
      polylineQuality: 'HIGH_QUALITY',
    }),
  });
  if (!res.ok) throw new Error(`Routes API ${res.status}`);

  const route = (await res.json())?.routes?.[0];
  if (!route?.polyline?.encodedPolyline) throw new Error('No road route between these stops');
  return {
    path: decode(route.polyline.encodedPolyline),
    meters: route.distanceMeters ?? 0,
    seconds: parseInt(route.duration ?? '0', 10) || 0, // "1234s"
  };
}

/** Free OSRM server (OpenStreetMap roads) — allows browser calls (CORS *). */
const OSRM_URL = 'https://router.project-osrm.org';

async function osrmRoute(points: LatLng[], signal: AbortSignal): Promise<RoadRoute> {
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
  const res = await fetch(`${OSRM_URL}/route/v1/driving/${coords}?overview=full&geometries=polyline`, { signal });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const body = await res.json();
  const route = body?.routes?.[0];
  if (body?.code !== 'Ok' || !route?.geometry) throw new Error(`OSRM ${body?.code ?? 'no route'}`);
  return { path: decodePolyline(route.geometry), meters: Math.round(route.distance ?? 0), seconds: Math.round(route.duration ?? 0) };
}

/**
 * Road-following path through the points in the given order (no reordering).
 * OSRM first (free); Google Routes API only if OSRM fails (paid, needs Routes API enabled on the key).
 */
export async function computeRoadRoute(points: LatLng[], signal: AbortSignal): Promise<RoadRoute> {
  try {
    return await osrmRoute(points, signal);
  } catch (err) {
    if (signal.aborted) throw err;
  }
  return googleRoadRoute(points, signal);
}

async function googleRoadRoute(points: LatLng[], signal: AbortSignal): Promise<RoadRoute> {
  if (!API_KEY || !(await loadGoogleMaps())) throw new Error('Maps unavailable');
  const geometry = (await google.maps.importLibrary('geometry')) as google.maps.GeometryLibrary;
  const decode = (encoded: string) =>
    geometry.encoding.decodePath(encoded).map((ll) => ({ lat: ll.lat(), lng: ll.lng() }));

  // Long routes: chunks of origin + 25 + destination, each starting where the last ended
  const chunks: LatLng[][] = [];
  for (let i = 0; i < points.length - 1; i += MAX_INTERMEDIATES + 1) {
    chunks.push(points.slice(i, i + MAX_INTERMEDIATES + 2));
  }
  const legs = await Promise.all(chunks.map((c) => computeLeg(c, decode, signal)));

  return {
    path: legs.flatMap((leg, i) => (i === 0 ? leg.path : leg.path.slice(1))),
    meters: legs.reduce((sum, leg) => sum + leg.meters, 0),
    seconds: legs.reduce((sum, leg) => sum + leg.seconds, 0),
  };
}

export function formatDuration(seconds: number) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}
