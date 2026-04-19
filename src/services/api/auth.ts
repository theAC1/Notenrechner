import { apiFetch, setToken } from './client';

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string | null;
}

interface AuthResponse {
  readonly token: string;
  readonly user: AuthUser;
}

export async function register(input: {
  email: string;
  password: string;
  displayName?: string;
  inviteCode?: string;
}): Promise<AuthUser> {
  const res = await apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  setToken(res.token);
  return res.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(res.token);
  return res.user;
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    return await apiFetch<AuthUser>('/api/auth/me');
  } catch {
    return null;
  }
}

export function logout(): void {
  setToken(null);
}
