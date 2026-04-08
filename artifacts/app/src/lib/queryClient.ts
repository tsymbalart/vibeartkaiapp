import { QueryClient } from "@tanstack/react-query";
import { apiUrl } from "./api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Typed `apiRequest` helper for the design-ops endpoints, mirroring the
 * shape used in the legacy check app. The new vibe app generally prefers
 * orval-generated hooks from `@workspace/api-client-react`, but the
 * design-ops mutations and one-off PATCH/DELETE/POST calls are simpler
 * to write against this fetch wrapper.
 */
export async function apiRequest(
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT",
  path: string,
  body?: unknown
): Promise<unknown> {
  const init: RequestInit = {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  };
  const resp = await fetch(apiUrl(path), init);
  if (!resp.ok) {
    let message = `API error: ${resp.status}`;
    try {
      const data = await resp.json();
      if (data?.error) message = data.error;
      else if (data?.message) message = data.message;
    } catch {}
    throw new Error(message);
  }
  if (resp.status === 204) return null;
  return resp.json();
}
