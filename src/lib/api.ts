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

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

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

export const api = {
  schools: {
    list: () => request<SchoolSummary[]>('/schools'),

    create: (body: {
      name: string;
      address: string;
      logoUrl?: string;
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

  auth: {
    webLogin: (email: string, password: string) =>
      request<{ role: string; email: string; accessTokenExpiresAt: number }>(
        '/auth/web/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      ),

    me: () =>
      request<{ id: string; email: string; role: string; schoolId: string | null }>(
        '/auth/me',
      ),

    logout: () => request<null>('/auth/logout', { method: 'POST' }),

    changePassword: (currentPassword: string, newPassword: string) =>
      request<null>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },
};
