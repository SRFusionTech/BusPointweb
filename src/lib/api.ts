/**
 * Typed API client with silent refresh.
 *
 * Strategy:
 * 1. Before every request: check stored accessTokenExpiresAt. If it expires
 *    within PROACTIVE_REFRESH_BUFFER_MS, proactively call /auth/refresh first.
 * 2. If a request returns 401: call /auth/refresh once, then retry.
 * 3. If /auth/refresh itself fails: clear the auth store and redirect to /login.
 *
 * A single in-flight refresh promise is shared across concurrent calls so we
 * never fire multiple parallel refresh requests.
 */

import { useAuthStore } from '@/stores/auth.store';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// Refresh if the access token expires within the next 60 seconds
const PROACTIVE_REFRESH_BUFFER_MS = 60_000;

export interface ApiResult<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Refresh mutex ────────────────────────────────────────────────────────────
let refreshingPromise: Promise<void> | null = null;

async function ensureRefreshed(): Promise<void> {
  if (!refreshingPromise) {
    refreshingPromise = doRefresh().finally(() => {
      refreshingPromise = null;
    });
  }
  return refreshingPromise;
}

async function doRefresh(): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    // Refresh token expired or invalid — force logout
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  const json = (await res.json()) as ApiResult<{ accessTokenExpiresAt: number }>;
  if (json.data?.accessTokenExpiresAt) {
    useAuthStore.getState().setAccessTokenExpiresAt(json.data.accessTokenExpiresAt);
  }
}

function isTokenExpiringSoon(): boolean {
  const expiresAt = useAuthStore.getState().accessTokenExpiresAt;
  if (!expiresAt) return false;
  return Date.now() >= expiresAt - PROACTIVE_REFRESH_BUFFER_MS;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  // Proactive refresh before the request if token is about to expire
  if (isTokenExpiringSoon()) {
    await ensureRefreshed();
  }

  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

  // Silent retry after 401
  if (res.status === 401) {
    await ensureRefreshed(); // throws + redirects if refresh fails
    const retryRes = await fetch(`${BASE}/api${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
    if (!retryRes.ok) {
      const errJson = (await retryRes.json()) as ApiResult<null>;
      throw new Error(errJson.message ?? 'Request failed');
    }
    return retryRes.json() as Promise<ApiResult<T>>;
  }

  if (!res.ok) {
    const errJson = (await res.json()) as ApiResult<null>;
    throw new Error(errJson.message ?? 'Request failed');
  }

  return res.json() as Promise<ApiResult<T>>;
}

// ─── Typed API surface ────────────────────────────────────────────────────────
export interface SchoolSummary {
  id: string;
  name: string;
  address: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Mirrors BusPointBackend src/schools/school-settings.ts */
export type SubscriptionManager = 'platform' | 'school';

export interface PlanSummary {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SchoolSettings {
  subscriptionManagedBy: SubscriptionManager;
  /** UUID of the assigned plan, or null if unassigned. */
  planId: string | null;
  /** ISO 8601 date string or null. When set and in the past all logins are blocked (HTTP 402). */
  planExpiresAt: string | null;
  /** Plans available for assignment (returned by GET settings only). */
  availablePlans?: PlanSummary[];
}

// ─── School-admin domain types ────────────────────────────────────────────────

export interface BusSummary {
  id: string;
  schoolId: string;
  name: string;
  plateNumber: string;
  make: string | null;
  model: string | null;
  capacity: number | null;
  routeId: string | null;
  returnRouteId: string | null;
  isActive: boolean;
  createdAt: string;
  driver?: { id: string; fullName: string | null; phone: string | null } | null;
}

export interface RouteSummary {
  id: string;
  schoolId: string;
  name: string;
  isActive: boolean;
  stopCount?: number;
  busCount?: number;
  createdAt: string;
}

export type StopKind = 'school' | 'stop' | 'end';

export interface RouteStop {
  id: string;
  routeId: string;
  name: string;
  kind: StopKind;
  address: string | null;
  lat: number;
  lng: number;
  stopOrder: number;
  createdAt: string;
}

export interface StopLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface MySchool {
  id: string;
  name: string;
  address: string;
  logoUrl: string | null;
  lat: number | null;
  lng: number | null;
}

export interface RouteDetail extends RouteSummary {
  stops: RouteStop[];
}

export interface DriverSummary {
  id: string;
  fullName: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  bus?: { id: string; name: string; plateNumber: string } | null;
}

export interface DriverWithPassword extends DriverSummary {
  tempPassword: string;
}

export interface BusDriverAssignment {
  id: string;
  busId: string;
  driverId: string;
  isActive: boolean;
  assignedAt: string;
  driver?: DriverSummary | null;
}

export const api = {
  schools: {
    list: () => request<SchoolSummary[]>('/schools'),

    get: (id: string) => request<SchoolSummary>(`/schools/${id}`),

    getSettings: (id: string) => request<SchoolSettings>(`/schools/${id}/settings`),

    updateSettings: (id: string, body: Partial<SchoolSettings>) =>
      request<SchoolSettings>(`/schools/${id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    create: (body: {
      name: string;
      address: string;
      lat?: number;
      lng?: number;
      logoUrl?: string;
      planId?: string;
      adminEmail: string;
      adminPassword: string;
      adminName: string;
      adminPhone: string;
    }) =>
      request<{ school: SchoolSummary; admin: { email: string; name: string } }>(
        '/schools',
        { method: 'POST', body: JSON.stringify(body) },
      ),

    resetAdminPassword: (schoolId: string) =>
      request<{ email: string; tempPassword: string }>(
        `/schools/${schoolId}/reset-admin-password`,
        { method: 'POST' },
      ),
  },

  plans: {
    list: () => request<PlanSummary[]>('/plans'),

    create: (body: { name: string; description?: string }) =>
      request<PlanSummary>('/plans', { method: 'POST', body: JSON.stringify(body) }),

    update: (id: string, body: { name?: string; description?: string; isActive?: boolean }) =>
      request<PlanSummary>(`/plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    remove: (id: string) =>
      request<null>(`/plans/${id}`, { method: 'DELETE' }),
  },

  buses: {
    list: () => request<BusSummary[]>('/buses'),

    get: (id: string) => request<BusSummary>(`/buses/${id}`),

    create: (body: { name: string; plateNumber: string; make?: string; model?: string; capacity?: number; routeId?: string }) =>
      request<BusSummary>('/buses', { method: 'POST', body: JSON.stringify(body) }),

    update: (id: string, body: Partial<{ name: string; plateNumber: string; make: string | null; model: string | null; capacity: number | null; routeId: string | null; returnRouteId: string | null }>) =>
      request<BusSummary>(`/buses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    remove: (id: string) =>
      request<null>(`/buses/${id}`, { method: 'DELETE' }),

    getDriver: (id: string) =>
      request<BusDriverAssignment | null>(`/buses/${id}/driver`),

    assignDriver: (busId: string, driverId: string) =>
      request<BusDriverAssignment>(`/buses/${busId}/driver`, { method: 'POST', body: JSON.stringify({ driverId }) }),

    unassignDriver: (busId: string) =>
      request<null>(`/buses/${busId}/driver`, { method: 'DELETE' }),
  },

  routes: {
    list: () => request<RouteSummary[]>('/routes'),

    get: (id: string) => request<RouteDetail>(`/routes/${id}`),

    create: (body: { name: string }) =>
      request<RouteSummary>('/routes', { method: 'POST', body: JSON.stringify(body) }),

    update: (id: string, body: { name?: string }) =>
      request<RouteSummary>(`/routes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    remove: (id: string) =>
      request<null>(`/routes/${id}`, { method: 'DELETE' }),

    /** School (first stop) is added by the server; send pickups in order plus the Last Stop. */
    saveStops: (id: string, body: { stops: Array<StopLocation & { name: string }>; end: StopLocation | null }) =>
      request<RouteStop[]>(`/routes/${id}/stops`, { method: 'PUT', body: JSON.stringify(body) }),
  },

  mySchool: {
    get: () => request<MySchool>('/my-school'),

    setLocation: (lat: number, lng: number) =>
      request<{ lat: number; lng: number }>('/my-school/location', { method: 'PATCH', body: JSON.stringify({ lat, lng }) }),
  },

  drivers: {
    list: () => request<DriverSummary[]>('/drivers'),

    get: (id: string) => request<DriverSummary>(`/drivers/${id}`),

    create: (body: { fullName: string; phone: string }) =>
      request<DriverWithPassword>('/drivers', { method: 'POST', body: JSON.stringify(body) }),

    update: (id: string, body: { fullName?: string; phone?: string; isActive?: boolean }) =>
      request<DriverSummary>(`/drivers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    resetPassword: (id: string) =>
      request<{ tempPassword: string }>(`/drivers/${id}/reset-password`, { method: 'POST' }),

    remove: (id: string) =>
      request<null>(`/drivers/${id}`, { method: 'DELETE' }),
  },

  auth: {
    webLogin: (email: string, password: string) =>
      request<{ role: string; email: string; accessTokenExpiresAt: number }>(
        '/auth/web/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      ),

    me: () =>
      request<{
        id: string;
        email: string | null;
        role: string;
        schoolId: string | null;
        fullName: string | null;
        school: { id: string; name: string; logoUrl: string | null } | null;
      }>('/auth/me'),

    logout: () => request<null>('/auth/logout', { method: 'POST' }),

    changePassword: (currentPassword: string, newPassword: string) =>
      request<null>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },
};
