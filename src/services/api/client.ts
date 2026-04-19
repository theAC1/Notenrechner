// Same-origin in production (Vercel serves both frontend and /api/*).
// Override via VITE_API_URL for split-host dev setups.
const BASE = import.meta.env['VITE_API_URL'] ?? (import.meta.env.DEV ? 'http://localhost:3000' : '');
const TOKEN_KEY = 'notenrechner-token';

export interface ApiError extends Error {
  status: number;
  body: unknown;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token === null) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore storage errors */
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${BASE}${path}`, { ...init, headers });
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const body: unknown = text ? safeJson(text) : null;

  if (!response.ok) {
    const err: ApiError = Object.assign(new Error(`API ${response.status}`), {
      status: response.status,
      body,
    });
    throw err;
  }
  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
