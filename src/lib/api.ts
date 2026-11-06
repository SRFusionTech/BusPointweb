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

import { useAuthStore, type AuthTokens } from '@/stores/auth.store';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// Refresh if the access token expires within the next 60 seconds
const PROACTIVE_REFRESH_BUFFER_MS = 60_000;

export interface ApiResult<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Thrown by `request()` on a non-OK response. Carries the HTTP status so callers can
 *  route specific errors (e.g. 409 conflict) to the right form field instead of a generic toast. */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Refresh mutex ────────────────────────────────────────────────────────────
// The backend rotates refresh tokens (each is valid exactly once) and every tab shares the same
// token via localStorage. So the lock must be cross-tab (Web Locks), and each tab must re-read
// storage before refreshing — otherwise tab B posts the token tab A already rotated, gets
// "already-used refresh token", and logs every tab out.
const REFRESH_LOCK = 'buspoint-auth-refresh';
let refreshingPromise: Promise<void> | null = null;

async function ensureRefreshed(): Promise<void> {
  if (!refreshingPromise) {
    const locked = async (): Promise<void> => {
      if (typeof navigator !== 'undefined' && navigator.locks) {
        await navigator.locks.request(REFRESH_LOCK, () => doRefresh());
      } else {
        await doRefresh();
      }
    };
    refreshingPromise = locked().finally(() => {
      refreshingPromise = null;
    });
  }
  return refreshingPromise!;
}

async function doRefresh(): Promise<void> {
  const before = useAuthStore.getState().accessToken;
  // Pick up tokens another tab may have just rotated.
  await useAuthStore.persist.rehydrate();
  const { refreshToken, accessToken, accessTokenExpiresAt } = useAuthStore.getState();
  if (!refreshToken) {
    forceLogout();
    throw new Error('Session expired. Please log in again.');
  }
  // Another tab already refreshed while we waited for the lock — use its tokens.
  if (accessToken && accessToken !== before && accessTokenExpiresAt && accessTokenExpiresAt - PROACTIVE_REFRESH_BUFFER_MS > Date.now()) {
    return;
  }

  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    // 5xx / gateway errors are transient — keep the session, let the caller see the error.
    if (![400, 401, 402, 403].includes(res.status)) {
      throw new ApiError('Could not reach the server. Please try again.', res.status);
    }
    forceLogout();
    throw new Error('Session expired. Please log in again.');
  }

  const json = (await res.json()) as ApiResult<AuthTokens>;
  useAuthStore.getState().setTokens(json.data);
}

function forceLogout() {
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

function authHeaders(init: RequestInit): HeadersInit {
  const { accessToken } = useAuthStore.getState();
  return {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...init.headers,
  };
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
    headers: authHeaders(init),
  });

  // Silent retry after 401 (only if we have a refresh token to try)
  if (res.status === 401 && useAuthStore.getState().refreshToken) {
    await ensureRefreshed(); // throws + redirects if refresh fails
    const retryRes = await fetch(`${BASE}/api${path}`, {
      ...init,
      headers: authHeaders(init), // re-read: carries the refreshed access token
    });
    if (!retryRes.ok) {
      const errJson = (await retryRes.json()) as ApiResult<null>;
      throw new ApiError(errJson.message ?? 'Request failed', retryRes.status);
    }
    return retryRes.json() as Promise<ApiResult<T>>;
  }

  if (!res.ok) {
    const errJson = (await res.json()) as ApiResult<null>;
    throw new ApiError(errJson.message ?? 'Request failed', res.status);
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
export type SubscriptionManager = 'platform' | 'school' | 'both';

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
  subscriptionManagedBy: SubscriptionManager;
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

export interface ParentSummary {
  id: string;
  fullName: string | null;
  phone: string | null;
  childName: string | null;
  childClass: { id: number; name: string } | null;
  childSection: { id: number; name: string } | null;
  isActive: boolean;
  createdAt: string;
  stop: { id: string; name: string; routeId: string; routeName: string } | null;
  subscriptionExpiresAt: string | null;
}

export interface ClassSection {
  id: number;
  name: string;
}

/** A class in the school's class master, with its sections in display order. */
export interface SchoolClass {
  id: number;
  name: string;
  sortOrder: number;
  sections: ClassSection[];
  /** Parents whose child is in this class (list endpoint only). */
  parentsCount?: number;
}

/** Sections to save: keep `id` for an existing section, omit it for a new one. */
export type SectionInput = { id?: number; name: string };

export interface ParentWithPassword extends ParentSummary {
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

  parents: {
    list: () => request<ParentSummary[]>('/parents'),

    get: (id: string) => request<ParentSummary>(`/parents/${id}`),

    create: (body: { fullName: string; phone: string; childName: string; childClassId: number; childSectionId: number; routeStopId: string; subscriptionExpiresAt?: string }) =>
      request<ParentWithPassword>('/parents', { method: 'POST', body: JSON.stringify(body) }),

    update: (id: string, body: { fullName?: string; phone?: string; childName?: string; childClassId?: number; childSectionId?: number; isActive?: boolean; routeStopId?: string; subscriptionExpiresAt?: string | null }) =>
      request<ParentSummary>(`/parents/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    resetPassword: (id: string) =>
      request<{ tempPassword: string }>(`/parents/${id}/reset-password`, { method: 'POST' }),

    remove: (id: string) =>
      request<null>(`/parents/${id}`, { method: 'DELETE' }),
  },

  /** Super-admin: manage parents for any school, picked by school id. */
  classes: {
    list: () => request<SchoolClass[]>('/classes'),

    create: (body: { name: string; sections: SectionInput[] }) =>
      request<SchoolClass>('/classes', { method: 'POST', body: JSON.stringify(body) }),

    update: (id: number, body: { name?: string; sections?: SectionInput[] }) =>
      request<SchoolClass>(`/classes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    remove: (id: number) => request<null>(`/classes/${id}`, { method: 'DELETE' }),

    /** `ids` = every class id of the school, in the new order. */
    reorder: (ids: number[]) =>
      request<SchoolClass[]>('/classes/reorder', { method: 'PATCH', body: JSON.stringify({ ids }) }),
  },

  superAdminClasses: {
    list: (schoolId: string) => request<SchoolClass[]>(`/schools/${schoolId}/classes`),

    create: (schoolId: string, body: { name: string; sections: SectionInput[] }) =>
      request<SchoolClass>(`/schools/${schoolId}/classes`, { method: 'POST', body: JSON.stringify(body) }),

    update: (schoolId: string, id: number, body: { name?: string; sections?: SectionInput[] }) =>
      request<SchoolClass>(`/schools/${schoolId}/classes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    remove: (schoolId: string, id: number) =>
      request<null>(`/schools/${schoolId}/classes/${id}`, { method: 'DELETE' }),

    reorder: (schoolId: string, ids: number[]) =>
      request<SchoolClass[]>(`/schools/${schoolId}/classes/reorder`, { method: 'PATCH', body: JSON.stringify({ ids }) }),
  },

  superAdminParents: {
    list: (schoolId: string) => request<ParentSummary[]>(`/schools/${schoolId}/parents`),

    create: (schoolId: string, body: { fullName: string; phone: string; childName: string; childClassId: number; childSectionId: number; routeStopId: string; subscriptionExpiresAt?: string }) =>
      request<ParentWithPassword>(`/schools/${schoolId}/parents`, { method: 'POST', body: JSON.stringify(body) }),

    update: (schoolId: string, id: string, body: { fullName?: string; phone?: string; childName?: string; childClassId?: number; childSectionId?: number; isActive?: boolean; routeStopId?: string; subscriptionExpiresAt?: string | null }) =>
      request<ParentSummary>(`/schools/${schoolId}/parents/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    resetPassword: (schoolId: string, id: string) =>
      request<{ tempPassword: string }>(`/schools/${schoolId}/parents/${id}/reset-password`, { method: 'POST' }),

    remove: (schoolId: string, id: string) =>
      request<null>(`/schools/${schoolId}/parents/${id}`, { method: 'DELETE' }),
  },

  /** Super-admin: read-only access to a school's routes/stops, for picking a parent's pickup point. */
  superAdminRoutes: {
    list: (schoolId: string) => request<RouteSummary[]>(`/schools/${schoolId}/routes`),

    get: (schoolId: string, routeId: string) => request<RouteDetail>(`/schools/${schoolId}/routes/${routeId}`),
  },

  auth: {
    webLogin: (email: string, password: string) =>
      request<{ role: string; email: string } & AuthTokens>(
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

    logout: () =>
      request<null>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: useAuthStore.getState().refreshToken }),
      }),

    changePassword: (currentPassword: string, newPassword: string) =>
      request<null>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },
};

/** Shared authed request (used by feature clients such as lib/tripsApi.ts). */
export { request as apiRequest };
