import { db, pulseSettingsTable, usersTable, checkInsTable, teamsTable } from "@workspace/db";
import { eq, and, gte, inArray, ne } from "drizzle-orm";
import { logger } from "./logger";
import { sendReminderEmail, isMailerConfigured } from "./mailer";

/** Check every hour whether it's time to send reminders. */
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** Don't re-send if a reminder was sent less than 6 days ago. */
const MIN_GAP_MS = 6 * 24 * 60 * 60 * 1000;

async function tick(): Promise<void> {
  if (!isMailerConfigured()) {
    return; // silently skip — logged once on startup
  }

  const now = new Date();
  const currentDay = now.getUTCDay(); // 0=Sun..6=Sat
  const currentHour = now.getUTCHours();

  // Find teams whose reminder schedule matches the current UTC day+hour.
  const settings = await db
    .select()
    .from(pulseSettingsTable)
    .where(
      and(
        eq(pulseSettingsTable.reminderEnabled, true),
        eq(pulseSettingsTable.reminderDay, currentDay),
        eq(pulseSettingsTable.reminderHour, currentHour),
      )
    );

  if (settings.length === 0) return;

  for (const s of settings) {
    // Guard against duplicate sends within the same week.
    if (s.lastReminderSentAt) {
      const gap = now.getTime() - new Date(s.lastReminderSentAt).getTime();
      if (gap < MIN_GAP_MS) continue;
    }

    // Get the team name for logging.
    const [team] = await db
      .select({ name: teamsTable.name })
      .from(teamsTable)
      .where(eq(teamsTable.id, s.teamId));

    // Find team members (active, with email).
    const members = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.teamId, s.teamId),
          eq(usersTable.isActive, true),
        )
      );

    const membersWithEmail = members.filter((m) => m.email != null);
    if (membersWithEmail.length === 0) continue;

    // Find who already completed a check-in in the last 7 days.
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCheckIns = await db
      .select({ userId: checkInsTable.userId })
      .from(checkInsTable)
      .where(
        and(
          inArray(
            checkInsTable.userId,
            membersWithEmail.map((m) => m.id),
          ),
          eq(checkInsTable.status, "completed"),
          gte(checkInsTable.createdAt, sevenDaysAgo),
        )
      );

    const completedUserIds = new Set(recentCheckIns.map((c) => c.userId));

    // Send reminders to those who haven't checked in.
    const needsReminder = membersWithEmail.filter(
      (m) => !completedUserIds.has(m.id),
    );

    if (needsReminder.length === 0) {
      logger.info(
        { teamId: s.teamId, team: team?.name },
        "reminderCron: all members have checked in — no reminders needed",
      );
    } else {
      let sent = 0;
      for (const m of needsReminder) {
        const ok = await sendReminderEmail(m.email!, m.name);
        if (ok) sent++;
      }
      logger.info(
        { teamId: s.teamId, team: team?.name, sent, total: needsReminder.length },
        "reminderCron: sent weekly reminders",
      );
    }

    // Mark this team's reminder as sent.
    await db
      .update(pulseSettingsTable)
      .set({ lastReminderSentAt: now })
      .where(eq(pulseSettingsTable.id, s.id));
  }
}

/**
 * Start the weekly reminder cron. Follows the same pattern as
 * sessionGC: immediate check on startup, then hourly via setInterval
 * with `.unref()` so it doesn't hold the event loop open.
 */
export function startReminderCron(): void {
  if (!isMailerConfigured()) {
    logger.info("reminderCron: skipping — RESEND_API_KEY not configured");
    return;
  }

  logger.info("reminderCron: started (checking every hour)");

  // Run once immediately in case the server restarted right at
  // the scheduled hour and we'd otherwise miss the window.
  tick().catch((err) =>
    logger.error({ err }, "reminderCron: initial tick failed"),
  );

  const timer = setInterval(() => {
    tick().catch((err) =>
      logger.error({ err }, "reminderCron: scheduled tick failed"),
    );
  }, CHECK_INTERVAL_MS);

  if (typeof timer.unref === "function") timer.unref();
}
