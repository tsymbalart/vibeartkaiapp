import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";

/**
 * Centralised Express error handler. Express 5 forwards promise
 * rejections here automatically, so every async route handler gets
 * a consistent JSON error envelope and a pino log entry with the
 * request id for correlation.
 *
 * Must be registered via `app.use(errorHandler)` AFTER all routes.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const reqId = (req as Request & { id?: string | number }).id;
  const status = (err as { status?: number } | null)?.status;
  const httpStatus = typeof status === "number" && status >= 400 && status < 600 ? status : 500;

  // pino-http attaches a child logger to req.log; prefer it so logs
  // are correlated with the request id automatically.
  const log = (req as Request & { log?: typeof logger }).log ?? logger;
  log.error(
    { err, reqId, path: req.path, method: req.method, status: httpStatus },
    "Unhandled error in route",
  );

  if (res.headersSent) {
    return;
  }

  res.status(httpStatus).json({
    error: httpStatus >= 500 ? "Internal server error" : (err as Error)?.message || "Request failed",
    requestId: reqId ?? null,
  });
}
