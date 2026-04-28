import { Router, type IRouter } from "express";
import { db, pulseSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireTeam, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/pulse-settings", requireTeam, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const [settings] = await db
    .select()
    .from(pulseSettingsTable)
    .where(eq(pulseSettingsTable.teamId, teamId))
    .limit(1);

  if (!settings) {
    res.json({
      id: null,
      teamId,
      sessionSize: 8,
      pillarWeights: {
        wellness: "normal",
        alignment: "normal",
        management: "normal",
        growth: "normal",
        design_courage: "normal",
        collaboration: "normal",
        recognition: "normal",
        belonging: "normal",
      },
      scoringMode: "latest_only",
      reminderEnabled: false,
      reminderDay: 1,
      reminderHour: 9,
      reminderTimezone: "UTC",
    });
    return;
  }

  res.json(settings);
});

router.put("/pulse-settings", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const { sessionSize, pillarWeights, scoringMode, reminderEnabled, reminderDay, reminderHour, reminderTimezone } = req.body;

  const VALID_SCORING_MODES = ["latest_only", "average_all"];
  if (scoringMode !== undefined && !VALID_SCORING_MODES.includes(scoringMode)) {
    res.status(400).json({ error: `scoringMode must be one of: ${VALID_SCORING_MODES.join(", ")}` });
    return;
  }

  if (sessionSize !== undefined && (typeof sessionSize !== "number" || sessionSize < 3 || sessionSize > 20)) {
    res.status(400).json({ error: "sessionSize must be a number between 3 and 20" });
    return;
  }

  if (reminderDay !== undefined && (typeof reminderDay !== "number" || reminderDay < 0 || reminderDay > 6)) {
    res.status(400).json({ error: "reminderDay must be 0 (Sunday) through 6 (Saturday)" });
    return;
  }

  if (reminderHour !== undefined && (typeof reminderHour !== "number" || reminderHour < 0 || reminderHour > 23)) {
    res.status(400).json({ error: "reminderHour must be 0 through 23" });
    return;
  }

  if (reminderTimezone !== undefined) {
    if (typeof reminderTimezone !== "string" || reminderTimezone.length === 0 || reminderTimezone.length > 64) {
      res.status(400).json({ error: "reminderTimezone must be a non-empty IANA timezone string" });
      return;
    }
    try {
      // Validate by trying to format with the zone — throws RangeError for unknown zones.
      new Intl.DateTimeFormat("en-US", { timeZone: reminderTimezone }).format(new Date());
    } catch {
      res.status(400).json({ error: `reminderTimezone "${reminderTimezone}" is not a valid IANA timezone` });
      return;
    }
  }

  const VALID_FOCUS_LEVELS = ["focus", "normal", "reduced", "off"];
  if (pillarWeights !== undefined) {
    if (typeof pillarWeights !== "object" || pillarWeights === null || Array.isArray(pillarWeights)) {
      res.status(400).json({ error: "pillarWeights must be an object" });
      return;
    }
    for (const [key, value] of Object.entries(pillarWeights)) {
      if (!VALID_FOCUS_LEVELS.includes(value as string)) {
        res.status(400).json({ error: `Invalid focus level "${value}" for pillar "${key}". Must be one of: ${VALID_FOCUS_LEVELS.join(", ")}` });
        return;
      }
    }
  }

  // Build the conflict-update set from provided fields.
  const updateSet: Record<string, unknown> = {};
  if (sessionSize !== undefined) updateSet.sessionSize = sessionSize;
  if (pillarWeights !== undefined) updateSet.pillarWeights = pillarWeights;
  if (scoringMode !== undefined) updateSet.scoringMode = scoringMode;
  if (reminderEnabled !== undefined) updateSet.reminderEnabled = !!reminderEnabled;
  if (reminderDay !== undefined) updateSet.reminderDay = reminderDay;
  if (reminderHour !== undefined) updateSet.reminderHour = reminderHour;
  if (reminderTimezone !== undefined) updateSet.reminderTimezone = reminderTimezone;

  const [row] = await db
    .insert(pulseSettingsTable)
    .values({
      teamId,
      sessionSize: sessionSize ?? 8,
      pillarWeights: pillarWeights ?? {},
      scoringMode: scoringMode ?? "latest_only",
      reminderEnabled: reminderEnabled ?? false,
      reminderDay: reminderDay ?? 1,
      reminderHour: reminderHour ?? 9,
      reminderTimezone: reminderTimezone ?? "UTC",
    })
    .onConflictDoUpdate({
      target: pulseSettingsTable.teamId,
      set: updateSet,
    })
    .returning();

  res.json(row);
});

export default router;
