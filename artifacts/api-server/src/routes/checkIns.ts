import { Router, type IRouter } from "express";
import { db, checkInsTable, responsesTable, questionsTable, intentThreadsTable, intentMessagesTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  CreateCheckInBody,
  GetCheckInsQueryParams,
  SubmitResponsesBody,
} from "@workspace/api-zod";
import { normalizeScore } from "../lib/scoring";
import { requireTeam } from "../middlewares/requireAuth";
import { intParam } from "../lib/params";

/**
 * Runtime type guard for the `follow_up_logic` jsonb column. We only
 * look up the `question` field today, so anything that isn't a plain
 * object with a string `question` key falls back to the base question
 * text instead of blowing up with a cast error.
 */
function parseFollowUpLogic(value: unknown): { question?: string } | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const q = (value as Record<string, unknown>).question;
  return { question: typeof q === "string" ? q : undefined };
}

const router: IRouter = Router();

function formatCheckIn(c: typeof checkInsTable.$inferSelect) {
  return {
    id: c.id,
    userId: c.userId,
    cadence: c.cadence,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    completedAt: c.completedAt?.toISOString() ?? null,
  };
}

function formatResponse(r: typeof responsesTable.$inferSelect) {
  return {
    id: r.id,
    questionId: r.questionId,
    numericValue: r.numericValue ?? null,
    textValue: r.textValue ?? null,
    emojiValue: r.emojiValue ?? null,
    selectedOptions: r.selectedOptions ?? null,
    trafficLight: r.trafficLight ?? null,
    normalizedScore: r.normalizedScore ?? null,
  };
}

router.get("/check-ins", requireTeam, async (req, res): Promise<void> => {
  const params = GetCheckInsQueryParams.safeParse(req.query);
  const limit = params.success ? params.data.limit ?? 20 : 20;

  const checkIns = await db
    .select()
    .from(checkInsTable)
    .where(eq(checkInsTable.userId, req.user!.id))
    .orderBy(desc(checkInsTable.createdAt))
    .limit(limit);

  res.json(checkIns.map(formatCheckIn));
});

router.post("/check-ins", requireTeam, async (req, res): Promise<void> => {
  const parsed = CreateCheckInBody.safeParse(req.body);
  const cadence = parsed.success && parsed.data.cadence ? parsed.data.cadence : "weekly";

  const [checkIn] = await db
    .insert(checkInsTable)
    .values({
      userId: req.user!.id,
      cadence,
    })
    .returning();

  res.status(201).json(formatCheckIn(checkIn));
});

router.get("/check-ins/:id", requireTeam, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [checkIn] = await db
    .select()
    .from(checkInsTable)
    .where(eq(checkInsTable.id, id));

  if (!checkIn || checkIn.userId !== req.user!.id) {
    res.status(404).json({ error: "Check-in not found" });
    return;
  }

  const responses = await db
    .select()
    .from(responsesTable)
    .where(eq(responsesTable.checkInId, checkIn.id));

  res.json({
    ...formatCheckIn(checkIn),
    responses: responses.map(formatResponse),
  });
});

router.post("/check-ins/:id/responses", requireTeam, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = SubmitResponsesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(checkInsTable)
    .where(eq(checkInsTable.id, id));

  if (!existing || existing.userId !== req.user!.id) {
    res.status(404).json({ error: "Check-in not found" });
    return;
  }

  const checkIn = existing;

  const teamId = req.user!.teamId!;

  for (const resp of parsed.data.responses) {
    const [question] = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, resp.questionId));

    const norm = question
      ? normalizeScore(question.inputType, {
          numericValue: resp.numericValue ?? null,
          trafficLight: resp.trafficLight ?? null,
        })
      : null;

    await db.insert(responsesTable).values({
      checkInId: checkIn.id,
      questionId: resp.questionId,
      numericValue: resp.numericValue ?? null,
      textValue: resp.textValue ?? null,
      emojiValue: resp.emojiValue ?? null,
      selectedOptions: resp.selectedOptions ?? null,
      trafficLight: resp.trafficLight ?? null,
      normalizedScore: norm,
    });

    if (resp.textValue && question?.followUpLogic) {
      const parsedFl = parseFollowUpLogic(question.followUpLogic);
      const topic = parsedFl?.question || question.questionText;
      const memberId = req.user!.id;

      let [existingThread] = await db
        .select()
        .from(intentThreadsTable)
        .where(
          and(
            eq(intentThreadsTable.teamId, teamId),
            eq(intentThreadsTable.questionId, question.id),
            eq(intentThreadsTable.userId, memberId),
            eq(intentThreadsTable.topic, topic)
          )
        );

      if (!existingThread) {
        [existingThread] = await db
          .insert(intentThreadsTable)
          .values({
            teamId,
            questionId: question.id,
            userId: memberId,
            pillar: question.pillar,
            topic,
          })
          .returning();
      }

      // Intentionally store `userId: null` on the message so a DB reader
      // cannot tie the pulse follow-up text back to the teammate. The
      // thread row still has `userId` so the author can find their own
      // threads via `/my-feedback`.
      await db.insert(intentMessagesTable).values({
        threadId: existingThread.id,
        content: resp.textValue,
        authorRole: "anonymous_member",
        userId: null,
      });
    }
  }

  const allResponses = await db
    .select()
    .from(responsesTable)
    .where(eq(responsesTable.checkInId, checkIn.id));

  res.json({
    ...formatCheckIn(checkIn),
    responses: allResponses.map(formatResponse),
  });
});

router.post("/check-ins/:id/complete", requireTeam, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existingCi] = await db
    .select()
    .from(checkInsTable)
    .where(eq(checkInsTable.id, id));

  if (!existingCi || existingCi.userId !== req.user!.id) {
    res.status(404).json({ error: "Check-in not found" });
    return;
  }

  const [checkIn] = await db
    .update(checkInsTable)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(checkInsTable.id, id))
    .returning();

  res.json(formatCheckIn(checkIn));
});

export default router;
