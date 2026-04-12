const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sa_token');
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
  const json = await res.json();
  return camelizeKeys(json) as T;
}

export const api = {
  // Stats
  getStats: () => request<{ schools: number; users: number; buses: number; pendingRequests: number }>('/superadmin/stats'),

  // Schools
  getSchools: () => request<any[]>('/superadmin/schools'),
  getSchool:  (id: string) => request<any>(`/superadmin/schools/${id}`),
  provisionSchool: (body: { schoolName: string; location: string; adminEmail: string; adminName: string; adminPassword: string }) =>
    request<any>('/superadmin/schools', { method: 'POST', body: JSON.stringify(body) }),
  suspendSchool:   (id: string) => request<any>(`/superadmin/schools/${id}/suspend`,   { method: 'PATCH' }),
  reinstateSchool: (id: string) => request<any>(`/superadmin/schools/${id}/reinstate`, { method: 'PATCH' }),
  deleteSchool:    (id: string) => request<any>(`/superadmin/schools/${id}`,           { method: 'DELETE' }),

  // Access Requests
  getRequests: (status?: string) => request<any[]>(`/superadmin/access-requests${status ? `?status=${status}` : ''}`),
  approveRequest: (id: string, body: { adminEmail: string; adminPassword: string; location: string }) =>
    request<any>(`/superadmin/access-requests/${id}/approve`, { method: 'PATCH', body: JSON.stringify(body) }),
  rejectRequest: (id: string, reason?: string) =>
    request<any>(`/superadmin/access-requests/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),

  // Settings
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<any>('/superadmin/settings/change-password', { method: 'POST', body: JSON.stringify(body) }),
};
