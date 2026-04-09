import { type Request } from "express";

/**
 * Express 5's `@types/express` types `req.params[name]` as `string | string[]`
 * when the generic is not pinned, which makes every `parseInt(req.params.id)`
 * fail the type-check. This helper normalises the lookup + parsing in one place.
 *
 * Returns `null` if the param is missing, an array, or not an integer.
 */
export function intParam(req: Request, name: string): number | null {
  const raw = req.params[name];
  if (raw == null) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  return parsed;
}

/**
 * Same as `intParam` but for query string values. Used in handlers that
 * accept optional `?days=90` or `?subTeamId=3` parameters.
 */
export function intQuery(req: Request, name: string): number | null {
  const raw = req.query[name];
  if (raw == null) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  return parsed;
}

/**
 * Returns a trimmed string query value or null.
 */
export function stringQuery(req: Request, name: string): string | null {
  const raw = req.query[name];
  if (raw == null) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
