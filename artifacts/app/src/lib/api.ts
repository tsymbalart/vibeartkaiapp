const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

/**
 * Typed error thrown from every API call. Pages can branch on
 * `err.status` to render the right message (401/403/404/500) instead
 * of treating every failure as a generic "API error".
 */
export class ApiError extends Error {
  readonly status: number;
  readonly requestId: string | null;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown = null, requestId: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.requestId = requestId;
  }
}

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

async function parseError(resp: Response): Promise<ApiError> {
  let body: unknown = null;
  let message = `API error ${resp.status}`;
  let requestId: string | null = null;
  try {
    body = await resp.json();
    if (body && typeof body === "object") {
      const rec = body as Record<string, unknown>;
      if (typeof rec.error === "string") message = rec.error;
      else if (typeof rec.message === "string") message = rec.message;
      if (typeof rec.requestId === "string") requestId = rec.requestId;
    }
  } catch {
    // response was not JSON; leave message as the generic status text.
  }
  return new ApiError(resp.status, message, body, requestId);
}

/**
 * GET a JSON endpoint. Throws `ApiError` on non-2xx responses so
 * react-query surfaces the typed error in `error` with a real status.
 */
export async function apiFetch<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const resp = await fetch(apiUrl(path, params), { credentials: "include" });
  if (!resp.ok) throw await parseError(resp);
  return resp.json() as Promise<T>;
}

/**
 * Unified mutation helper replacing the old `apiRequest` in
 * lib/queryClient.ts. Accepts a method/body, returns the parsed JSON
 * (or `null` for 204), and throws `ApiError` for non-2xx.
 */
export async function apiMutate<T = unknown>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T | null> {
  const resp = await fetch(apiUrl(path), {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) throw await parseError(resp);
  if (resp.status === 204) return null;
  return (await resp.json()) as T;
}

export function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { credentials: "include", ...init });
}
