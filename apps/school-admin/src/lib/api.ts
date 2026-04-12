const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sa_token');
}

export function getSchool(): { id: string; name: string; location: string } | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('school') ?? 'null'); }
  catch { return null; }
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
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
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
};
