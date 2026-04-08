const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export function apiUrl(path: string, params?: Record<string, string | number>): string {
  const url = new URL(`${window.location.origin}${BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.pathname + url.search;
}

export async function apiFetch<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const resp = await fetch(apiUrl(path, params), { credentials: "include" });
  if (!resp.ok) throw new Error(`API error: ${resp.status}`);
  return resp.json();
}

export function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { credentials: "include", ...init });
}
