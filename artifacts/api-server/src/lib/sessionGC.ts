import { db, sessionsTable } from "@workspace/db";
import { lt } from "drizzle-orm";
import { logger } from "./logger";

const GC_INTERVAL_MS = 60 * 60 * 1000; // every hour

async function sweep(): Promise<number> {
  const result = await db
    .delete(sessionsTable)
    .where(lt(sessionsTable.expire, new Date()))
    .returning({ sid: sessionsTable.sid });
  return result.length;
}

/**
 * Periodically purge expired rows from the `sessions` table. Without
 * this, sessions grow unbounded even though the IDX_session_expire
 * index exists. Called once during server bootstrap; it runs an
 * immediate sweep and then schedules an hourly one.
 */
export function startSessionGC(): void {
  sweep()
    .then((count) => {
      if (count > 0) {
        logger.info({ deleted: count }, "sessionGC: removed expired sessions");
      }
    })
    .catch((err) => logger.error({ err }, "sessionGC initial sweep failed"));

  const timer = setInterval(() => {
    sweep()
      .then((count) => {
        if (count > 0) {
          logger.info({ deleted: count }, "sessionGC: removed expired sessions");
        }
      })
      .catch((err) => logger.error({ err }, "sessionGC scheduled sweep failed"));
  }, GC_INTERVAL_MS);

  // Don't hold the event loop open for the GC timer alone.
  if (typeof timer.unref === "function") timer.unref();
}
