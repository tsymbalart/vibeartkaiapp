import { Router, type IRouter } from "express";
import { db, questionsTable, responsesTable, checkInsTable, pulseSettingsTable } from "@workspace/db";
import { eq, asc, and, or, inArray, isNull, desc, sql } from "drizzle-orm";
import { requireTeam, requireRole } from "../middlewares/requireAuth";
import { intParam } from "../lib/params";
import { questionsVisibleToTeam } from "../lib/questionScope";

const router: IRouter = Router();

const DEFAULT_SESSION_SIZE = 8;

const VALID_PILLARS = ["wellness", "alignment", "management", "growth", "design_courage", "collaboration", "recognition", "belonging"];
const VALID_INPUT_TYPES = ["likert_5", "frequency_5", "traffic_light", "yes_no", "open_text"];
const VALID_FREQUENCY_CLASSES = ["core", "high", "standard", "deep"];

const WEIGHT_MULTIPLIERS: Record<string, number> = {
  focus: 2.0,
  normal: 1.0,
  reduced: 0.5,
  off: 0,
};

router.get("/questions", requireTeam, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const questions = await db
    .select()
    .from(questionsTable)
    .where(questionsVisibleToTeam(teamId))
    .orderBy(asc(questionsTable.pillar), asc(questionsTable.order));
  res.json(questions);
});

router.post("/questions", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const { pillar, questionText, inputType, options, impactWeight, frequencyClass, isCore, isRequired, source, followUpLogic } = req.body;

  if (!pillar || !questionText || !inputType) {
    res.status(400).json({ error: "pillar, questionText, and inputType are required" });
    return;
  }

  if (!VALID_PILLARS.includes(pillar)) {
    res.status(400).json({ error: `Invalid pillar. Must be one of: ${VALID_PILLARS.join(", ")}` });
    return;
  }

  if (!VALID_INPUT_TYPES.includes(inputType)) {
    res.status(400).json({ error: `Invalid inputType. Must be one of: ${VALID_INPUT_TYPES.join(", ")}` });
    return;
  }

  const fc = frequencyClass ?? "standard";
  if (!VALID_FREQUENCY_CLASSES.includes(fc)) {
    res.status(400).json({ error: `Invalid frequencyClass. Must be one of: ${VALID_FREQUENCY_CLASSES.join(", ")}` });
    return;
  }

  const weight = impactWeight ?? 1.0;
  if (typeof weight !== "number" || weight < 0.1 || weight > 2.0) {
    res.status(400).json({ error: "impactWeight must be a number between 0.1 and 2.0" });
    return;
  }

  // Transactional "next order" computation so two concurrent creates
  // don't race on the same order value.
  const created = await db.transaction(async (tx) => {
    const [maxRow] = await tx
      .select({ max: sql<number | null>`MAX(${questionsTable.order})` })
      .from(questionsTable)
      .where(
        and(
          eq(questionsTable.pillar, pillar),
          or(isNull(questionsTable.teamId), eq(questionsTable.teamId, teamId))
        )
      );

    const nextOrder = (maxRow?.max ?? 0) + 1;

    const [row] = await tx
      .insert(questionsTable)
      .values({
        teamId,
        pillar,
        questionText,
        inputType,
        options: options || null,
        order: nextOrder,
        impactWeight: impactWeight ?? 1.0,
        frequencyClass: frequencyClass ?? "standard",
        isCore: isCore ?? false,
        isRequired: isRequired ?? true,
        source: source || "custom",
        followUpLogic: followUpLogic || null,
      })
      .returning();
    return row;
  });

  res.status(201).json(created);
});

router.put("/questions/:id", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const id = intParam(req, "id");
  if (id == null) {
    res.status(400).json({ error: "Invalid question id" });
    return;
  }

  // Leads/directors can only modify questions owned by their team.
  // Global templates (teamId IS NULL) are read-only through this API.
  const [existing] = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  if (existing.teamId !== teamId) {
    res.status(403).json({ error: "Cannot modify a question owned by another team or a global template" });
    return;
  }

  const { questionText, inputType, options, impactWeight, frequencyClass, isCore, isRequired, pillar } = req.body;

  if (pillar !== undefined && !VALID_PILLARS.includes(pillar)) {
    res.status(400).json({ error: `Invalid pillar. Must be one of: ${VALID_PILLARS.join(", ")}` });
    return;
  }
  if (inputType !== undefined && !VALID_INPUT_TYPES.includes(inputType)) {
    res.status(400).json({ error: `Invalid inputType. Must be one of: ${VALID_INPUT_TYPES.join(", ")}` });
    return;
  }
  if (frequencyClass !== undefined && !VALID_FREQUENCY_CLASSES.includes(frequencyClass)) {
    res.status(400).json({ error: `Invalid frequencyClass. Must be one of: ${VALID_FREQUENCY_CLASSES.join(", ")}` });
    return;
  }
  if (impactWeight !== undefined && (typeof impactWeight !== "number" || impactWeight < 0.1 || impactWeight > 2.0)) {
    res.status(400).json({ error: "impactWeight must be a number between 0.1 and 2.0" });
    return;
  }

  const updateData: Record<string, any> = {};
  if (questionText !== undefined) updateData.questionText = questionText;
  if (inputType !== undefined) updateData.inputType = inputType;
  if (options !== undefined) updateData.options = options;
  if (impactWeight !== undefined) updateData.impactWeight = impactWeight;
  if (frequencyClass !== undefined) updateData.frequencyClass = frequencyClass;
  if (isCore !== undefined) updateData.isCore = isCore;
  if (isRequired !== undefined) updateData.isRequired = isRequired;
  if (pillar !== undefined) updateData.pillar = pillar;

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db
    .update(questionsTable)
    .set(updateData)
    .where(eq(questionsTable.id, id))
    .returning();

  res.json(updated);
});

router.delete("/questions/:id", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const id = intParam(req, "id");
  if (id == null) {
    res.status(400).json({ error: "Invalid question id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  if (existing.teamId !== teamId) {
    res.status(403).json({ error: "Cannot delete a question owned by another team or a global template" });
    return;
  }

  await db.delete(questionsTable).where(eq(questionsTable.id, id));
  res.json({ success: true });
});

router.get("/questions/session", requireTeam, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const [settings] = await db
    .select()
    .from(pulseSettingsTable)
    .where(eq(pulseSettingsTable.teamId, teamId))
    .limit(1);

  const sessionSize = settings?.sessionSize ?? DEFAULT_SESSION_SIZE;
  const pillarWeights = (settings?.pillarWeights as Record<string, string>) ?? {};

  const allQuestions = await db
    .select()
    .from(questionsTable)
    .where(questionsVisibleToTeam(teamId))
    .orderBy(asc(questionsTable.order));

  const filteredQuestions = allQuestions.filter((q) => {
    const weight = pillarWeights[q.pillar] ?? "normal";
    return weight !== "off";
  });

  const coreQuestions = filteredQuestions.filter((q) => q.isCore);
  const nonCoreQuestions = filteredQuestions.filter((q) => !q.isCore);

  const effectiveSessionSize = Math.max(sessionSize, coreQuestions.length);

  const userCheckIns = await db
    .select()
    .from(checkInsTable)
    .where(eq(checkInsTable.userId, req.user!.id))
    .orderBy(desc(checkInsTable.createdAt))
    .limit(5);

  const recentCheckInIds = userCheckIns.map((c) => c.id);
  let recentQuestionIds: number[] = [];
  if (recentCheckInIds.length > 0) {
    const recentResponses = await db
      .select({ questionId: responsesTable.questionId })
      .from(responsesTable)
      .where(inArray(responsesTable.checkInId, recentCheckInIds));
    recentQuestionIds = recentResponses.map((r) => r.questionId);
  }

  const freshPool = nonCoreQuestions.filter((q) => !recentQuestionIds.includes(q.id));
  const stalePool = nonCoreQuestions.filter((q) => recentQuestionIds.includes(q.id));

  const remaining = effectiveSessionSize - coreQuestions.length;
  const selected = [...coreQuestions];

  const weightedFresh = freshPool.map((q) => {
    const focusLevel = pillarWeights[q.pillar] ?? "normal";
    const multiplier = WEIGHT_MULTIPLIERS[focusLevel] ?? 1.0;
    return { question: q, weight: multiplier };
  });

  const highFreq = weightedFresh.filter((w) => w.question.frequencyClass === "high");
  const standardFreq = weightedFresh.filter((w) => w.question.frequencyClass === "standard");
  const deepFreq = weightedFresh.filter((w) => w.question.frequencyClass === "deep");

  const rotatingPool = [
    ...weightedShuffle(highFreq),
    ...weightedShuffle(standardFreq),
    ...weightedShuffle(deepFreq),
  ];

  for (const q of rotatingPool) {
    if (selected.length >= effectiveSessionSize) break;
    selected.push(q);
  }

  if (selected.length < effectiveSessionSize) {
    for (const q of shuffle(stalePool)) {
      if (selected.length >= effectiveSessionSize) break;
      selected.push(q);
    }
  }

  const interleaved = interleavePillars(selected);

  res.json(
    interleaved.map((q) => ({
      id: q.id,
      pillar: q.pillar,
      questionText: q.questionText,
      inputType: q.inputType,
      options: q.options,
      order: q.order,
      impactWeight: q.impactWeight,
      isCore: q.isCore,
      isRequired: q.isRequired,
      followUpLogic: q.followUpLogic,
    }))
  );
});

function interleavePillars(questions: any[]): any[] {
  const byPillar: Record<string, any[]> = {};
  for (const q of questions) {
    if (!byPillar[q.pillar]) byPillar[q.pillar] = [];
    byPillar[q.pillar].push(q);
  }

  const pillarKeys = shuffle(Object.keys(byPillar));
  for (const k of pillarKeys) {
    byPillar[k] = shuffle(byPillar[k]);
  }

  const result: any[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const k of pillarKeys) {
      if (byPillar[k].length > 0) {
        result.push(byPillar[k].shift()!);
        added = true;
      }
    }
  }
  return result;
}

function weightedShuffle<T extends { weight: number; question: any }>(items: T[]): any[] {
  const expanded: any[] = [];
  for (const item of items) {
    const copies = Math.max(1, Math.round(item.weight * 2));
    for (let i = 0; i < copies; i++) {
      expanded.push(item.question);
    }
  }
  const shuffled = shuffle(expanded);
  const seen = new Set<number>();
  const result: any[] = [];
  for (const q of shuffled) {
    if (!seen.has(q.id)) {
      seen.add(q.id);
      result.push(q);
    }
  }
  return result;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default router;
