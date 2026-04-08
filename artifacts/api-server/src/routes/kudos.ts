import { Router, type IRouter } from "express";
import { db, kudosTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireTeam } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/kudos/received", requireTeam, async (req, res): Promise<void> => {
  const userId = req.user!.id;

  const kudos = await db
    .select({
      id: kudosTable.id,
      content: kudosTable.content,
      category: kudosTable.category,
      emoji: kudosTable.emoji,
      createdAt: kudosTable.createdAt,
    })
    .from(kudosTable)
    .where(eq(kudosTable.toUserId, userId))
    .orderBy(desc(kudosTable.createdAt));

  res.json(kudos);
});

router.get("/kudos/sent", requireTeam, async (req, res): Promise<void> => {
  const userId = req.user!.id;

  const kudos = await db
    .select({
      id: kudosTable.id,
      toUserId: kudosTable.toUserId,
      content: kudosTable.content,
      category: kudosTable.category,
      emoji: kudosTable.emoji,
      createdAt: kudosTable.createdAt,
    })
    .from(kudosTable)
    .where(eq(kudosTable.fromUserId, userId))
    .orderBy(desc(kudosTable.createdAt));

  const toUserIds = [...new Set(kudos.map((k) => k.toUserId))];
  const users = toUserIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable)
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const result = kudos.map((k) => ({
    id: k.id,
    toName: userMap[k.toUserId] ?? "Unknown",
    content: k.content,
    category: k.category,
    emoji: k.emoji,
    createdAt: k.createdAt,
  }));

  res.json(result);
});

router.get("/kudos/team", requireTeam, async (req, res): Promise<void> => {
  const user = req.user!;
  if (!user.teamId) {
    res.json([]);
    return;
  }

  const kudos = await db
    .select({
      id: kudosTable.id,
      toUserId: kudosTable.toUserId,
      content: kudosTable.content,
      category: kudosTable.category,
      emoji: kudosTable.emoji,
      createdAt: kudosTable.createdAt,
    })
    .from(kudosTable)
    .where(eq(kudosTable.teamId, user.teamId))
    .orderBy(desc(kudosTable.createdAt));

  const users = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.teamId, user.teamId));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const result = kudos.map((k) => ({
    id: k.id,
    toName: userMap[k.toUserId] ?? "Unknown",
    content: k.content,
    category: k.category,
    emoji: k.emoji,
    createdAt: k.createdAt,
  }));

  res.json(result);
});

router.post("/kudos", requireTeam, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const { toUserId, content, category, emoji } = req.body;

  if (!toUserId || !content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "toUserId and content are required" });
    return;
  }

  if (toUserId === userId) {
    res.status(400).json({ error: "You can't send kudos to yourself" });
    return;
  }

  if (!req.user!.teamId) {
    res.status(400).json({ error: "You must be on a team to send kudos" });
    return;
  }

  const [recipient] = await db.select().from(usersTable).where(eq(usersTable.id, toUserId));
  if (!recipient || recipient.teamId !== req.user!.teamId) {
    res.status(400).json({ error: "Recipient not found or not on your team" });
    return;
  }

  const validCategories = ["recognition", "compliment", "encouragement"];
  const cat = validCategories.includes(category) ? category : "recognition";

  const [kudo] = await db
    .insert(kudosTable)
    .values({
      teamId: req.user!.teamId,
      fromUserId: userId,
      toUserId,
      content: content.trim(),
      category: cat,
      emoji: emoji || null,
    })
    .returning();

  res.status(201).json({
    id: kudo.id,
    content: kudo.content,
    category: kudo.category,
    emoji: kudo.emoji,
    createdAt: kudo.createdAt,
  });
});

router.delete("/kudos/:id", requireTeam, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const kudoId = parseInt(req.params.id);

  if (isNaN(kudoId)) {
    res.status(400).json({ error: "Invalid kudo id" });
    return;
  }

  const [kudo] = await db.select().from(kudosTable).where(eq(kudosTable.id, kudoId));
  if (!kudo) {
    res.status(404).json({ error: "Kudo not found" });
    return;
  }

  if (kudo.fromUserId !== userId && kudo.toUserId !== userId) {
    res.status(403).json({ error: "You can only delete kudos you sent or received" });
    return;
  }

  await db.delete(kudosTable).where(eq(kudosTable.id, kudoId));
  res.json({ success: true });
});

router.get("/kudos/teammates", requireTeam, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  if (!req.user!.teamId) {
    res.json([]);
    return;
  }

  const teammates = await db
    .select({ id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl })
    .from(usersTable)
    .where(eq(usersTable.teamId, req.user!.teamId));

  const filtered = teammates.filter((t) => t.id !== userId);
  res.json(filtered);
});

export default router;
