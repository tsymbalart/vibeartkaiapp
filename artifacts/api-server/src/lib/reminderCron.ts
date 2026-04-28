import { db, pulseSettingsTable, usersTable, checkInsTable, teamsTable } from "@workspace/db";
import { eq, and, gte, inArray } from "drizzle-orm";
import { logger } from "./logger";
import { sendReminderEmail, isMailerConfigured } from "./mailer";

/** In-process check interval — every hour. */
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** Don't re-send if a reminder was sent less than 6 days ago. */
const MIN_GAP_MS = 6 * 24 * 60 * 60 * 1000;

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/**
 * Compute the day-of-week (0=Sun..6=Sat) and 0-23 hour for a given UTC moment
 * in a target IANA timezone. Falls back to UTC if the timezone string is invalid.
 */
function dayHourInZone(now: Date, timeZone: string): { day: number; hour: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
    const hourStr = parts.find((p) => p.type === "hour")?.value ?? "0";
    return { day: WEEKDAY_TO_INDEX[weekday] ?? 0, hour: Number(hourStr) };
  } catch {
    return { day: now.getUTCDay(), hour: now.getUTCHours() };
  }
}

export interface ReminderTickResult {
  configured: boolean;
  matchedTeams: number;
  remindersSent: number;
  skippedRecent: number;
}

/**
 * Run a single reminder tick. Exported so the HTTP cron endpoint can invoke it
 * directly (e.g. from a Replit Scheduled Deployment) without waiting for the
 * in-process setInterval — the autoscale deployment can't be relied on to be
 * awake at the scheduled hour.
 */
export async function runReminderTick(): Promise<ReminderTickResult> {
  if (!isMailerConfigured()) {
    return { configured: false, matchedTeams: 0, remindersSent: 0, skippedRecent: 0 };
  }

  const now = new Date();

  // Fetch every enabled reminder, then filter in JS using the team's stored
  // timezone. (Doing this in SQL would require a per-row timezone conversion
  // that's hard to express portably; the row count here is tiny.)
  const allEnabled = await db
    .select()
    .from(pulseSettingsTable)
    .where(eq(pulseSettingsTable.reminderEnabled, true));

  const due = allEnabled.filter((s) => {
    const { day, hour } = dayHourInZone(now, s.reminderTimezone || "UTC");
    return day === s.reminderDay && hour === s.reminderHour;
  });

  let remindersSent = 0;
  let skippedRecent = 0;

  for (const s of due) {
    if (s.lastReminderSentAt) {
      const gap = now.getTime() - new Date(s.lastReminderSentAt).getTime();
      if (gap < MIN_GAP_MS) {
        skippedRecent++;
        continue;
      }
    }

    const [team] = await db
      .select({ name: teamsTable.name })
      .from(teamsTable)
      .where(eq(teamsTable.id, s.teamId));

    const members = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
      .from(usersTable)
      .where(and(eq(usersTable.teamId, s.teamId), eq(usersTable.isActive, true)));

    const membersWithEmail = members.filter((m) => m.email != null);
    if (membersWithEmail.length === 0) continue;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCheckIns = await db
      .select({ userId: checkInsTable.userId })
      .from(checkInsTable)
      .where(
        and(
          inArray(checkInsTable.userId, membersWithEmail.map((m) => m.id)),
          eq(checkInsTable.status, "completed"),
          gte(checkInsTable.createdAt, sevenDaysAgo),
        )
      );

    const completedUserIds = new Set(recentCheckIns.map((c) => c.userId));
    const needsReminder = membersWithEmail.filter((m) => !completedUserIds.has(m.id));

    if (needsReminder.length === 0) {
      logger.info(
        { teamId: s.teamId, team: team?.name, tz: s.reminderTimezone },
        "reminderCron: all members have checked in — no reminders needed",
      );
    } else {
      let sent = 0;
      for (const m of needsReminder) {
        const ok = await sendReminderEmail(m.email!, m.name);
        if (ok) sent++;
      }
      remindersSent += sent;
      logger.info(
        { teamId: s.teamId, team: team?.name, tz: s.reminderTimezone, sent, total: needsReminder.length },
        "reminderCron: sent weekly reminders",
      );
    }

    await db
      .update(pulseSettingsTable)
      .set({ lastReminderSentAt: now })
      .where(eq(pulseSettingsTable.id, s.id));
  }

  return { configured: true, matchedTeams: due.length, remindersSent, skippedRecent };
}

/**
 * Start the in-process reminder cron. Kept as a backup for when the deployment
 * happens to be awake at the scheduled hour. The reliable trigger is the
 * /api/cron/reminders endpoint hit by a Replit Scheduled Deployment.
 */
export function startReminderCron(): void {
  if (!isMailerConfigured()) {
    logger.info("reminderCron: skipping — RESEND_API_KEY not configured");
    return;
  }

  logger.info("reminderCron: started (in-process backup; Scheduled Deployment is the primary trigger)");

  runReminderTick().catch((err) =>
    logger.error({ err }, "reminderCron: initial tick failed"),
  );

  const timer = setInterval(() => {
    runReminderTick().catch((err) =>
      logger.error({ err }, "reminderCron: scheduled tick failed"),
    );
  }, CHECK_INTERVAL_MS);

  if (typeof timer.unref === "function") timer.unref();
}
