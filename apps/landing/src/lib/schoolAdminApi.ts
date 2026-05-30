import { broadcastDashboardSync } from './dashboardSync';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('school_admin_token');
}

export function getSchool(): { id: string; name: string; location: string; lat?: number | null; lng?: number | null } | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('school_admin_school') ?? 'null'); }
  catch { return null; }
}

export function setSchool(school: { id: string; name: string; location: string; lat?: number | null; lng?: number | null }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('school_admin_school', JSON.stringify(school));
}

// The backend uses a global SnakeCaseInterceptor — convert all response keys back to camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelizeKeys(value: any): any {
  if (Array.isArray(value)) return value.map(camelizeKeys);
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return Object.keys(value).reduce((acc, key) => {
      acc[snakeToCamel(key)] = camelizeKeys(value[key]);
      return acc;
    }, {} as Record<string, any>);
  }
  return value;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const method = (options.method ?? 'GET').toUpperCase();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401 && typeof window !== 'undefined') {
    // Token missing/expired/invalid — clear session and send the user to /login.
    localStorage.removeItem('school_admin_token');
    localStorage.removeItem('school_admin_school');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Your session expired. Please sign in again.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
  }
  if (method !== 'GET' && method !== 'HEAD') {
    broadcastDashboardSync();
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return camelizeKeys(json) as T;
}

export const api = {
  // Dashboard
  getDashboard: (schoolId: string) =>
    request<any>(`/dashboard/${schoolId}`),

  // Buses
  getBuses: (schoolId: string) =>
    request<any[]>(`/buses?school_id=${schoolId}`),
  createBus: (body: object) =>
    request<any>('/buses', { method: 'POST', body: JSON.stringify(body) }),
  updateBus: (id: string, body: object) =>
    request<any>(`/buses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBus: (id: string) =>
    request<void>(`/buses/${id}`, { method: 'DELETE' }),

  // Users
  getDrivers: (schoolId: string) =>
    request<any[]>(`/users?school_id=${schoolId}&role=driver`),
  getParents: (schoolId: string) =>
    request<any[]>(`/users?school_id=${schoolId}&role=parent`),
  createUser: (body: object) =>
    request<any>('/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: string, body: object) =>
    request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id: string) =>
    request<void>(`/users/${id}`, { method: 'DELETE' }),

  // Bus-driver assignments
  getActiveDriver: (busId: string) =>
    request<any>(`/bus-drivers/bus/${busId}/active`),
  assignDriver: (body: { busId: string; driverId: string }) =>
    request<any>('/bus-drivers', { method: 'POST', body: JSON.stringify(body) }),
  unassignDriver: (busId: string) =>
    request<any>(`/bus-drivers/bus/${busId}/unassign`, { method: 'PATCH' }),

  // Subscriptions
  getSubscriptions: (schoolId: string) =>
    request<any[]>(`/subscriptions?school_id=${schoolId}`),
  activateSubscription: (parentId: string, schoolId: string) =>
    request<any>(`/subscriptions/parent/${parentId}/activate?school_id=${schoolId}`, { method: 'POST' }),
  revokeSubscription: (parentId: string) =>
    request<void>(`/subscriptions/parent/${parentId}`, { method: 'DELETE' }),

  // School
  getSchoolById: (id: string) =>
    request<any>(`/schools/${id}`),
  updateSchool: (id: string, body: { name?: string; location?: string; information?: string; lat?: number; lng?: number }) =>
    request<any>(`/schools/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Routes
  getRoutes: (schoolId: string) =>
    request<any[]>(`/routes?school_id=${schoolId}`),
  getRoute: (id: string) =>
    request<any>(`/routes/${id}`),
  createRoute: (body: {
    schoolId: string;
    name: string;
    startLat: number;
    startLng: number;
    startAddress?: string;
    notes?: string;
    stops?: Array<{ name: string; lat: number; lng: number; address?: string; stopOrder: number }>;
  }) =>
    request<any>('/routes', { method: 'POST', body: JSON.stringify(body) }),
  updateRoute: (id: string, body: object) =>
    request<any>(`/routes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteRoute: (id: string) =>
    request<void>(`/routes/${id}`, { method: 'DELETE' }),
  addRouteStop: (routeId: string, body: { name: string; lat: number; lng: number; address?: string; stopOrder: number }) =>
    request<any>(`/routes/${routeId}/stops`, { method: 'POST', body: JSON.stringify(body) }),
  updateRouteStop: (stopId: string, body: object) =>
    request<any>(`/routes/stops/${stopId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteRouteStop: (stopId: string) =>
    request<void>(`/routes/stops/${stopId}`, { method: 'DELETE' }),
  reorderRouteStops: (routeId: string, stopIds: string[]) =>
    request<any>(`/routes/${routeId}/stops/reorder`, { method: 'PATCH', body: JSON.stringify({ stopIds }) }),
};
