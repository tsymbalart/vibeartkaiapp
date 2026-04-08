import { Router, type IRouter } from "express";
import { db, intentThreadsTable, intentMessagesTable, usersTable, questionsTable } from "@workspace/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { requireTeam, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/intent-threads", requireRole("lead", "director"), async (req, res): Promise<void> => {
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

  const userIdToAnonLabel: Record<string, string> = {};
  let anonCounter = 0;

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

    const memberKey = t.userId ? String(t.userId) : `null-${t.id}`;
    if (!userIdToAnonLabel[memberKey]) {
      anonCounter++;
      userIdToAnonLabel[memberKey] = `Anonymous #${anonCounter}`;
    }

    topicGroups[key].threads.push({
      id: t.id,
      anonLabel: userIdToAnonLabel[memberKey],
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
  const threadId = parseInt(req.params.id);

  if (isNaN(threadId)) {
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
  const threadId = parseInt(req.params.id);

  if (isNaN(threadId)) {
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

router.patch("/intent-threads/:id", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const threadId = parseInt(req.params.id);

  if (isNaN(threadId)) {
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
