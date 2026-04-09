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

  // Atomic upsert against the `pulse_settings_team_id_unique` constraint.
  // Avoids the read-then-write race where two concurrent PUTs both miss
  // the existing row and end up inserting duplicates.
  const [row] = await db
    .insert(pulseSettingsTable)
    .values({
      teamId,
      sessionSize: sessionSize ?? 8,
      pillarWeights: pillarWeights ?? {},
      scoringMode: scoringMode ?? "latest_only",
    })
    .onConflictDoUpdate({
      target: pulseSettingsTable.teamId,
      set: {
        ...(sessionSize !== undefined ? { sessionSize } : {}),
        ...(pillarWeights !== undefined ? { pillarWeights } : {}),
        ...(scoringMode !== undefined ? { scoringMode } : {}),
      },
    })
    .returning();

  res.json(row);
});

export default router;
