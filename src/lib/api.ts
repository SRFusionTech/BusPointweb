const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface ApiResult<T> {
  success: boolean;
  message: string;
  data: T;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  const json = (await res.json()) as ApiResult<T>;
  if (!res.ok) throw new Error(json.message ?? 'Request failed');
  return json;
}

export const api = {
  auth: {
    webLogin: (email: string, password: string) =>
      request<{ role: string; email: string }>('/auth/web/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

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
