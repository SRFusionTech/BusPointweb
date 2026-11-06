import { apiRequest } from '@/lib/api';

// ─── Shapes returned by BusPointBackend/src/tracking ────────────────────────────

export type Presence = 'live' | 'away' | 'offline' | 'not_on_trip';
export type StopStatus = 'pending' | 'reached' | 'skipped';
export type StopKind = 'school' | 'stop' | 'end';
export type Direction = 'pickup' | 'drop';
export type EndReason = 'last_stop' | 'manual' | 'auto_timeout';

export interface TripStudent {
  parentId: string;
  parentName: string | null;
  parentPhone: string | null;
  childName: string | null;
  className: string | null;
}

export interface TripStop {
  id: string;
  routeStopId: string | null;
  seq: number;
  name: string;
  address: string | null;
  kind: StopKind;
  lat: number;
  lng: number;
  status: StopStatus;
  arrivedAt: string | null;
  etaAt: string | null;
  distanceM: number | null;
  studentsCount: number;
  students: TripStudent[];
}

export interface TripRoad {
  passed: string | null;
  ahead: string | null;
}

export interface TripSnapshot {
  id: string;
  status: 'in_progress' | 'completed';
  direction: Direction;
  routeId: string;
  routeName: string;
  startedAt: string;
  endedAt: string | null;
  endReason: EndReason | null;
  durationSec: number;
  distanceM: number;
  bus: { id: string; name: string; plateNumber: string } | null;
  driver: { id: string; fullName: string | null; phone: string | null } | null;
  live: { lat: number; lng: number; speedKmh: number | null; heading: number | null; accuracy: number | null; lastPingAt: string | null } | null;
  presence: Presence;
  progress: { total: number; reached: number; skipped: number; pending: number };
  atStopId: string | null;
  nextStopId: string | null;
  /** Road-following line (encoded polylines) split at the bus; null → straight lines between stops. */
  road?: TripRoad | null;
  alerts: {
    gpsLost: { since: string; acknowledgedAt: string | null } | null;
    /** reason = driver's check-in reply (traffic / waiting_student / breakdown / emergency) if any. */
    stationary: { since: string; minutes: number; reason: string | null; acknowledgedAt: string | null } | null;
    /** Driver was asked "Bus stopped — everything OK?". */
    checkIn: { requestedAt: string; response: string | null; respondedAt: string | null } | null;
    sos: { at: string; note: string | null; acknowledgedAt: string | null } | null;
  };
  stops: TripStop[];
}

export interface TripEvent {
  type: 'started' | 'stop_reached' | 'stop_skipped' | 'gps_lost' | 'gps_restored' | 'stationary' | 'check_in_requested' | 'check_in' | 'sos' | 'alert_ack' | 'ended';
  at: string;
  payload: Record<string, unknown>;
}

export interface TripDetail extends TripSnapshot {
  events: TripEvent[];
  trail: { lat: number; lng: number; at: string; speed: number | null; accuracy: number | null }[];
  trailPointsTotal: number;
}

export interface TripSummary {
  id: string;
  status: 'in_progress' | 'completed';
  direction: Direction;
  routeId: string;
  routeName: string;
  startedAt: string;
  endedAt: string | null;
  endReason: EndReason | null;
  durationSec: number;
  distanceM: number;
  bus: { id: string; name: string; plateNumber: string } | null;
  driver: { id: string; fullName: string | null } | null;
  stops: { total: number; reached: number; skipped: number; pending: number };
  alertsCount: number;
}

export interface TrackingSettings {
  liveWithinSec: number;
  offlineAfterSec: number;
  startRadiusM: number;
  stopRadiusM: number;
  schoolRadiusM: number;
}

export interface FleetBus {
  bus: { id: string; name: string; plateNumber: string; capacity: number | null };
  driver: { id: string; fullName: string | null; phone: string | null } | null;
  route: { id: string; name: string } | null;
  returnRoute: { id: string; name: string } | null;
  presence: Presence;
  trip: TripSnapshot | null;
}

export interface Fleet {
  serverTime: string;
  settings: TrackingSettings;
  summary: { totalBuses: number; onTrip: number; live: number; away: number; offline: number; alerts: number; sos: number };
  buses: FleetBus[];
}

export interface TripListParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  busId?: string;
  direction?: Direction;
}

// ─── Calls ──────────────────────────────────────────────────────────────────────

export const tripsApi = {
  fleet: () => apiRequest<Fleet>('/trips/fleet'),
  list: (p: TripListParams = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    return apiRequest<TripSummary[]>(`/trips?${qs.toString()}`) as Promise<{
      success: boolean;
      message: string;
      data: TripSummary[];
      meta?: { page: number; limit: number; total: number; totalPages: number };
    }>;
  },
  get: (id: string) => apiRequest<TripDetail>(`/trips/${id}`),
  /** Acknowledge an SOS or the current alerts of a trip. */
  ack: (id: string, type: 'sos' | 'alerts') =>
    apiRequest<TripSnapshot>(`/trips/${id}/ack`, { method: 'POST', body: JSON.stringify({ type }) }),
};

export const CHECK_IN_LABEL: Record<string, string> = {
  traffic: 'Traffic',
  waiting_student: 'Waiting for a student',
  breakdown: 'Breakdown',
  emergency: 'Emergency',
  no_reply: 'No reply from driver',
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Ages presence on the client: a silent bus sends nothing, so "live" must decay here. */
export function agePresence(lastPingAt: string | null, onTrip: boolean, s: TrackingSettings | null, skewMs: number, now = Date.now()): Presence {
  if (!onTrip) return 'not_on_trip';
  if (!lastPingAt) return 'offline';
  const age = (now + skewMs - Date.parse(lastPingAt)) / 1000;
  if (age <= (s?.liveWithinSec ?? 30)) return 'live';
  if (age < (s?.offlineAfterSec ?? 180)) return 'away';
  return 'offline';
}

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function fmtDistance(m: number | null | undefined): string {
  if (m == null) return '—';
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export function fmtDuration(sec: number | null | undefined): string {
  if (sec == null) return '—';
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

export function fmtAgo(iso: string | null | undefined, skewMs = 0, now = Date.now()): string {
  if (!iso) return '—';
  const s = Math.max(0, Math.round((now + skewMs - Date.parse(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ago`;
}

export const END_REASON_LABEL: Record<EndReason, string> = {
  last_stop: 'Reached last stop',
  manual: 'Ended by driver',
  auto_timeout: 'Auto-closed (no GPS)',
};

export const DIRECTION_LABEL: Record<Direction, string> = { pickup: 'Pickup', drop: 'Drop' };
