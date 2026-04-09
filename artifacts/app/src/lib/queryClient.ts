import { QueryClient } from "@tanstack/react-query";
import { apiMutate } from "./api";

/**
 * Single shared QueryClient instance. Pages import this when they
 * need to invalidate / mutate without going through `useQueryClient`.
 *
 * Defaults:
 *  - staleTime: 30s so navigating back to a page doesn't immediately
 *    refetch the same data.
 *  - retry: false — failed requests surface a typed ApiError to the
 *    component instead of retrying silently.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Back-compat shim for the design-ops pages that import `apiRequest`
 * from this module. Delegates to the unified `apiMutate` helper so
 * all mutations throw a typed ApiError on failure.
 */
export async function apiRequest(
  method: "POST" | "PATCH" | "PUT" | "DELETE" | "GET",
  path: string,
  body?: unknown,
): Promise<unknown> {
  if (method === "GET") {
    // Rare but some legacy call sites pass "GET". Route through
    // fetch directly since apiMutate doesn't handle GET bodies.
    const resp = await fetch(path, { credentials: "include" });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(text || `API error: ${resp.status}`);
    }
    return resp.status === 204 ? null : resp.json();
  }
  return apiMutate(method, path, body);
}
