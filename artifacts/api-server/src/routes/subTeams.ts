import { Router, type IRouter } from "express";
import { db, subTeamsTable, usersTable, teamsTable, userSubTeamsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireTeam, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/sub-teams", requireTeam, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId;
  const subTeams = await db.select().from(subTeamsTable).where(eq(subTeamsTable.teamId, teamId));

  const subTeamIds = subTeams.map((st) => st.id);
  const memberships = subTeamIds.length > 0
    ? await db.select({ subTeamId: userSubTeamsTable.subTeamId }).from(userSubTeamsTable).where(inArray(userSubTeamsTable.subTeamId, subTeamIds))
    : [];

  const memberCounts: Record<number, number> = {};
  for (const m of memberships) {
    memberCounts[m.subTeamId] = (memberCounts[m.subTeamId] || 0) + 1;
  }

  res.json(subTeams.map((st) => ({
    ...st,
    memberCount: memberCounts[st.id] || 0,
  })));
});

router.post("/sub-teams", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const { name, color } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  const teamId = req.user!.teamId;

  const [subTeam] = await db.insert(subTeamsTable).values({
    name,
    color: color || "#6366f1",
    teamId,
  }).returning();

  res.status(201).json(subTeam);
});

router.put("/sub-teams/:id", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { name, color } = req.body;
  const updates: Record<string, any> = {};
  if (name) updates.name = name;
  if (color) updates.color = color;

  const [existing] = await db.select().from(subTeamsTable).where(eq(subTeamsTable.id, id));
  if (!existing || existing.teamId !== req.user!.teamId) {
    res.status(404).json({ error: "Sub-team not found" });
    return;
  }

  const [updated] = await db.update(subTeamsTable)
    .set(updates)
    .where(eq(subTeamsTable.id, id))
    .returning();

  res.json(updated!);
});

router.delete("/sub-teams/:id", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db.select().from(subTeamsTable).where(eq(subTeamsTable.id, id));
  if (!existing || existing.teamId !== req.user!.teamId) {
    res.status(404).json({ error: "Sub-team not found" });
    return;
  }

  await db.delete(subTeamsTable).where(eq(subTeamsTable.id, id));

  res.json({ success: true });
});

router.get("/users", requireTeam, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId;
  const users = await db.select().from(usersTable).where(eq(usersTable.teamId, teamId));

  const userIds = users.map((u) => u.id);
  const memberships = userIds.length > 0
    ? await db.select().from(userSubTeamsTable).where(inArray(userSubTeamsTable.userId, userIds))
    : [];

  const userSubTeamMap: Record<number, number[]> = {};
  for (const m of memberships) {
    if (!userSubTeamMap[m.userId]) userSubTeamMap[m.userId] = [];
    userSubTeamMap[m.userId].push(m.subTeamId);
  }

  res.json(users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatarUrl: u.avatarUrl,
    subTeamIds: userSubTeamMap[u.id] || [],
    teamId: u.teamId,
  })));
});

router.put("/users/:id", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user || user.teamId !== req.user!.teamId) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { name, role } = req.body;
  const validRoles = ["member", "lead", "director"];
  const updates: Record<string, any> = {};
  if (name) updates.name = name;
  if (role) {
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }
    if (role === "director" && req.user!.role !== "director") {
      res.status(403).json({ error: "Only directors can assign director role" });
      return;
    }
    if (user.role === "director" && req.user!.role !== "director") {
      res.status(403).json({ error: "Only directors can modify director users" });
      return;
    }
    updates.role = role;
  }

  if (Object.keys(updates).length > 0) {
    await db.update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, id));
  }

  const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, id));

  const memberships = await db.select().from(userSubTeamsTable).where(eq(userSubTeamsTable.userId, id));

  res.json({
    id: updatedUser!.id,
    name: updatedUser!.name,
    role: updatedUser!.role,
    subTeamIds: memberships.map((m) => m.subTeamId),
    teamId: updatedUser!.teamId,
  });
});

router.post("/users/:id/sub-teams", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const [targetUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!targetUser || targetUser.teamId !== req.user!.teamId) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { subTeamId } = req.body;
  if (!subTeamId || typeof subTeamId !== "number") {
    res.status(400).json({ error: "subTeamId is required" });
    return;
  }

  const [subTeam] = await db.select().from(subTeamsTable).where(eq(subTeamsTable.id, subTeamId));
  if (!subTeam || subTeam.teamId !== req.user!.teamId) {
    res.status(404).json({ error: "Sub-team not found" });
    return;
  }

  try {
    await db.insert(userSubTeamsTable).values({ userId, subTeamId });
  } catch (e: any) {
    if (e.code === "23505") {
      res.status(409).json({ error: "User already in this sub-team" });
      return;
    }
    throw e;
  }

  const memberships = await db.select().from(userSubTeamsTable).where(eq(userSubTeamsTable.userId, userId));
  res.status(201).json({ userId, subTeamIds: memberships.map((m) => m.subTeamId) });
});

router.delete("/users/:id/sub-teams/:subTeamId", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  const subTeamId = parseInt(req.params.subTeamId, 10);
  if (isNaN(userId) || isNaN(subTeamId)) {
    res.status(400).json({ error: "Invalid ids" });
    return;
  }

  const [targetUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!targetUser || targetUser.teamId !== req.user!.teamId) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [subTeam] = await db.select().from(subTeamsTable).where(eq(subTeamsTable.id, subTeamId));
  if (!subTeam || subTeam.teamId !== req.user!.teamId) {
    res.status(404).json({ error: "Sub-team not found" });
    return;
  }

  await db.delete(userSubTeamsTable).where(
    and(
      eq(userSubTeamsTable.userId, userId),
      eq(userSubTeamsTable.subTeamId, subTeamId)
    )
  );

  const memberships = await db.select().from(userSubTeamsTable).where(eq(userSubTeamsTable.userId, userId));
  res.json({ userId, subTeamIds: memberships.map((m) => m.subTeamId) });
});

export default router;
