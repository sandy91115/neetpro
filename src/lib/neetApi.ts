const defaultApiBase = import.meta.env.PROD
  ? 'https://neet.cybals.com/api'
  : 'http://127.0.0.1:8000/api';
const API_BASE = (import.meta.env.VITE_API_BASE_URL || defaultApiBase).replace(/\/$/, '');
const TOKEN_KEY = 'neet-prep/backend-token';

export function getApiToken(): string { return localStorage.getItem(TOKEN_KEY) || ''; }
export function setApiToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event('neet-auth-changed'));
}
export function clearApiToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event('neet-auth-changed'));
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const token = getApiToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.message || Object.values(payload.errors || {}).flat().join(' ') || `API error (${response.status})`;
    throw new Error(String(message));
  }
  return payload as T;
}
