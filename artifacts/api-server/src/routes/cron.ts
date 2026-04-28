import { Router, type IRouter } from "express";
import { runReminderTick } from "../lib/reminderCron";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * Triggered by Replit Scheduled Deployments (or any cron / curl) every hour.
 * Authentication: requires `Authorization: Bearer ${CRON_SECRET}` header.
 *
 * The endpoint is idempotent — it checks each team's stored timezone against
 * the current moment and only sends reminders for teams whose configured
 * weekday + hour matches; the per-team `lastReminderSentAt` enforces a 6-day
 * minimum gap so a misconfigured cron can't spam users.
 */
router.post("/api/cron/reminders", async (req, res): Promise<void> => {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    logger.warn("cron: CRON_SECRET not configured — refusing to run reminder tick");
    res.status(503).json({ error: "CRON_SECRET not configured" });
    return;
  }

  const provided = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (provided !== expected) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    const result = await runReminderTick();
    res.json({ ok: true, ...result });
  } catch (err) {
    logger.error({ err }, "cron: reminder tick failed");
    res.status(500).json({ error: "tick failed" });
  }
});

export default router;
