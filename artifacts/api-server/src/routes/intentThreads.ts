import crypto from "crypto";
import { Router, type IRouter } from "express";
import { db, intentThreadsTable, intentMessagesTable, usersTable, questionsTable } from "@workspace/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { requireTeam, requireLeadOrDirector } from "../middlewares/requireAuth";
import { intParam } from "../lib/params";

const router: IRouter = Router();

// Stable per-team anonymous label. Uses a SHA-256 hash of the user id with
// a per-team salt so:
//   1. The label stays the same across requests (leads can follow a
//      conversation without the label shifting when new threads arrive).
//   2. The label cannot be reversed to a user id without the salt.
//   3. Two teams' labels are independent.
const ANON_SALT = process.env.ANON_LABEL_SALT ?? "artkai-pulse-anon-v1";

function anonLabelFor(teamId: number, userId: number | null, fallbackThreadId: number): string {
  const source = userId != null ? `u:${userId}` : `t:${fallbackThreadId}`;
  const hash = crypto.createHash("sha256").update(`${ANON_SALT}:${teamId}:${source}`).digest("hex");
  // Map the first 24 bits of the hash into a 4-digit id. Two users colliding
  // in 4096 combinations is acceptable; leads have the full hash to disambiguate
  // programmatically if needed but we only expose the short form.
  const short = parseInt(hash.slice(0, 6), 16) % 10000;
  return `Anonymous #${short.toString().padStart(4, "0")}`;
}

router.get("/intent-threads", requireLeadOrDirector, async (req, res): Promise<void> => {
  const user = req.user!;

  const rawThreads = await db
    .select()
    .from(intentThreadsTable)
    .where(eq(intentThreadsTable.teamId, user.teamId!))
    .orderBy(desc(intentThreadsTable.createdAt));

  const threadIds = rawThreads.map((t) => t.id);
  let messageCounts: Record<number, { count: number; lastActivity: string | null; hasLeadReply: boolean }> = {};

  if (threadIds.length > 0) {
    const msgRows = await db
      .select({
        threadId: intentMessagesTable.threadId,
        authorRole: intentMessagesTable.authorRole,
        createdAt: intentMessagesTable.createdAt,
      })
      .from(intentMessagesTable)
      .where(inArray(intentMessagesTable.threadId, threadIds));

    for (const row of msgRows) {
      if (!messageCounts[row.threadId]) {
        messageCounts[row.threadId] = { count: 0, lastActivity: null, hasLeadReply: false };
      }
      messageCounts[row.threadId].count++;
      const ts = row.createdAt?.toISOString() ?? null;
      if (ts && (!messageCounts[row.threadId].lastActivity || ts > messageCounts[row.threadId].lastActivity!)) {
        messageCounts[row.threadId].lastActivity = ts;
      }
      if (row.authorRole === "lead") {
        messageCounts[row.threadId].hasLeadReply = true;
      }
    }
  }

  const topicGroups: Record<string, {
    topic: string;
    pillar: string;
    questionId: number | null;
    threads: any[];
  }> = {};

  for (const t of rawThreads) {
    const key = `${t.pillar}::${t.topic}`;
    if (!topicGroups[key]) {
      topicGroups[key] = {
        topic: t.topic,
        pillar: t.pillar,
        questionId: t.questionId,
        threads: [],
      };
    }

    topicGroups[key].threads.push({
      id: t.id,
      anonLabel: anonLabelFor(user.teamId!, t.userId, t.id),
      status: t.status,
      createdAt: t.createdAt,
      messageCount: messageCounts[t.id]?.count ?? 0,
      lastActivity: messageCounts[t.id]?.lastActivity ?? null,
      hasLeadReply: messageCounts[t.id]?.hasLeadReply ?? false,
    });
  }

  for (const group of Object.values(topicGroups)) {
    group.threads.sort((a: any, b: any) => {
      const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return bTime - aTime;
    });
  }

  const grouped = Object.values(topicGroups).sort((a, b) => {
    const aLatest = Math.max(...a.threads.map((t: any) => t.lastActivity ? new Date(t.lastActivity).getTime() : 0));
    const bLatest = Math.max(...b.threads.map((t: any) => t.lastActivity ? new Date(t.lastActivity).getTime() : 0));
    return bLatest - aLatest;
  });

  res.json(grouped);
});

router.get("/my-feedback", requireTeam, async (req, res): Promise<void> => {
  const userId = req.user!.id;

  const rawThreads = await db
    .select()
    .from(intentThreadsTable)
    .where(eq(intentThreadsTable.userId, userId))
    .orderBy(desc(intentThreadsTable.createdAt));

  const threadIds = rawThreads.map((t) => t.id);
  let messageMeta: Record<number, { count: number; lastActivity: string | null; hasLeadReply: boolean }> = {};

  if (threadIds.length > 0) {
    const msgRows = await db
      .select({
        threadId: intentMessagesTable.threadId,
        authorRole: intentMessagesTable.authorRole,
        createdAt: intentMessagesTable.createdAt,
      })
      .from(intentMessagesTable)
      .where(inArray(intentMessagesTable.threadId, threadIds));

    for (const row of msgRows) {
      if (!messageMeta[row.threadId]) {
        messageMeta[row.threadId] = { count: 0, lastActivity: null, hasLeadReply: false };
      }
      messageMeta[row.threadId].count++;
      const ts = row.createdAt?.toISOString() ?? null;
      if (ts && (!messageMeta[row.threadId].lastActivity || ts > messageMeta[row.threadId].lastActivity!)) {
        messageMeta[row.threadId].lastActivity = ts;
      }
      if (row.authorRole === "lead") {
        messageMeta[row.threadId].hasLeadReply = true;
      }
    }
  }

  const threads = rawThreads
    .map((t) => ({
      id: t.id,
      pillar: t.pillar,
      topic: t.topic,
      status: t.status,
      createdAt: t.createdAt,
      messageCount: messageMeta[t.id]?.count ?? 0,
      lastActivity: messageMeta[t.id]?.lastActivity ?? null,
      hasLeadReply: messageMeta[t.id]?.hasLeadReply ?? false,
    }))
    .sort((a, b) => {
      const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return bTime - aTime;
    });

  res.json(threads);
});

router.get("/intent-threads/:id/messages", requireTeam, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const threadId = intParam(req, "id");
  if (threadId == null) {
    res.status(400).json({ error: "Invalid thread id" });
    return;
  }

  const [thread] = await db
    .select()
    .from(intentThreadsTable)
    .where(eq(intentThreadsTable.id, threadId));

  if (!thread) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }

  const isLead = (req.user!.role === "lead" || req.user!.role === "director") && thread.teamId === req.user!.teamId;
  const isOwner = thread.userId === userId;

  if (!isLead && !isOwner) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const messages = await db
    .select({
      id: intentMessagesTable.id,
      threadId: intentMessagesTable.threadId,
      content: intentMessagesTable.content,
      authorRole: intentMessagesTable.authorRole,
      createdAt: intentMessagesTable.createdAt,
    })
    .from(intentMessagesTable)
    .where(eq(intentMessagesTable.threadId, threadId))
    .orderBy(intentMessagesTable.createdAt);

  res.json({
    thread: {
      id: thread.id,
      pillar: thread.pillar,
      topic: thread.topic,
      status: thread.status,
      questionId: thread.questionId,
      createdAt: thread.createdAt,
    },
    messages,
  });
});

router.post("/intent-threads/:id/messages", requireTeam, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const threadId = intParam(req, "id");
  if (threadId == null) {
    res.status(400).json({ error: "Invalid thread id" });
    return;
  }

  const { content } = req.body;
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const [thread] = await db
    .select()
    .from(intentThreadsTable)
    .where(eq(intentThreadsTable.id, threadId));

  if (!thread) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }

  const isLead = (req.user!.role === "lead" || req.user!.role === "director") && thread.teamId === req.user!.teamId;
  const isOwner = thread.userId === userId;

  if (!isLead && !isOwner) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const authorRole = isLead ? "lead" : "anonymous_member";

  const [message] = await db
    .insert(intentMessagesTable)
    .values({
      threadId,
      content: content.trim(),
      authorRole,
      userId: isLead ? userId : null,
    })
    .returning();

  res.status(201).json(message);
});

router.patch("/intent-threads/:id", requireLeadOrDirector, async (req, res): Promise<void> => {
  const threadId = intParam(req, "id");
  if (threadId == null) {
    res.status(400).json({ error: "Invalid thread id" });
    return;
  }

  const { status } = req.body;
  if (!status || !["open", "acknowledged", "resolved"].includes(status)) {
    res.status(400).json({ error: "Status must be open, acknowledged, or resolved" });
    return;
  }

  const [updated] = await db
    .update(intentThreadsTable)
    .set({ status })
    .where(and(eq(intentThreadsTable.id, threadId), eq(intentThreadsTable.teamId, req.user!.teamId!)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }

  res.json(updated);
});

export default router;
