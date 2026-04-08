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
    });
    return;
  }

  res.json(settings);
});

router.put("/pulse-settings", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const { sessionSize, pillarWeights, scoringMode } = req.body;

  const VALID_SCORING_MODES = ["latest_only", "average_all"];
  if (scoringMode !== undefined && !VALID_SCORING_MODES.includes(scoringMode)) {
    res.status(400).json({ error: `scoringMode must be one of: ${VALID_SCORING_MODES.join(", ")}` });
    return;
  }

  if (sessionSize !== undefined && (typeof sessionSize !== "number" || sessionSize < 3 || sessionSize > 20)) {
    res.status(400).json({ error: "sessionSize must be a number between 3 and 20" });
    return;
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

  const [existing] = await db
    .select()
    .from(pulseSettingsTable)
    .where(eq(pulseSettingsTable.teamId, teamId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(pulseSettingsTable)
      .set({
        sessionSize: sessionSize ?? existing.sessionSize,
        pillarWeights: pillarWeights ?? existing.pillarWeights,
        scoringMode: scoringMode ?? existing.scoringMode,
      })
      .where(eq(pulseSettingsTable.id, existing.id))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db
      .insert(pulseSettingsTable)
      .values({
        teamId,
        sessionSize: sessionSize ?? 8,
        pillarWeights: pillarWeights ?? {},
        scoringMode: scoringMode ?? "latest_only",
      })
      .returning();
    res.json(created);
  }
});

export default router;
