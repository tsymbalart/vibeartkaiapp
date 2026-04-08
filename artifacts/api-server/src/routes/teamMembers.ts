import { Router, type IRouter } from "express";
import crypto from "crypto";
import { db, usersTable, invitationsTable, userSubTeamsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireTeam, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/team/members", requireTeam, async (req, res): Promise<void> => {
  const user = req.user!;
  if (!user.teamId) {
    res.json([]);
    return;
  }

  const members = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.teamId, user.teamId));

  const memberships = await db.select().from(userSubTeamsTable);
  const userSubTeamMap: Record<number, number[]> = {};
  for (const m of memberships) {
    if (!userSubTeamMap[m.userId]) userSubTeamMap[m.userId] = [];
    userSubTeamMap[m.userId].push(m.subTeamId);
  }

  res.json(
    members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      avatarUrl: m.avatarUrl,
      subTeamIds: userSubTeamMap[m.id] || [],
      // Design-ops fused fields (null when user has not been tracked yet)
      roleTitle: m.roleTitle ?? null,
      leadUserId: m.leadUserId ?? null,
      employmentStatus: m.employmentStatus,
      isActive: m.isActive,
    }))
  );
});

router.patch(
  "/team/members/:id/role",
  requireRole("lead", "director"),
  async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const { role } = req.body;
    if (!role || !["member", "lead", "director"].includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    if (role === "director" && req.user!.role !== "director") {
      res.status(403).json({ error: "Only directors can assign director role" });
      return;
    }

    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));

    if (!target || target.teamId !== req.user!.teamId) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    if (target.role === "director" && req.user!.role !== "director") {
      res.status(403).json({ error: "Only directors can modify director accounts" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set({ role })
      .where(eq(usersTable.id, id))
      .returning();

    res.json({ id: updated.id, name: updated.name, role: updated.role });
  }
);

router.delete(
  "/team/members/:id",
  requireRole("lead", "director"),
  async (req, res): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    if (id === req.user!.id) {
      res.status(400).json({ error: "Cannot remove yourself" });
      return;
    }

    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));

    if (!target || target.teamId !== req.user!.teamId) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    if (target.role === "director" && req.user!.role !== "director") {
      res.status(403).json({ error: "Only directors can remove directors" });
      return;
    }

    await db
      .update(usersTable)
      .set({ teamId: null })
      .where(eq(usersTable.id, id));

    res.json({ success: true });
  }
);

router.get("/invitations", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const user = req.user!;
  if (!user.teamId) {
    res.json([]);
    return;
  }

  const invitations = await db
    .select()
    .from(invitationsTable)
    .where(eq(invitationsTable.teamId, user.teamId));

  res.json(invitations);
});

router.post("/invitations", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const { email, role } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }

  const inviteRole = role || "member";
  if (!["member", "lead", "director"].includes(inviteRole)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }

  if (inviteRole === "director" && req.user!.role !== "director") {
    res.status(403).json({ error: "Only directors can invite as director" });
    return;
  }

  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existingUser && existingUser.teamId === req.user!.teamId) {
    res.status(409).json({ error: "User is already a team member" });
    return;
  }

  const [existingInvite] = await db
    .select()
    .from(invitationsTable)
    .where(
      and(
        eq(invitationsTable.email, email),
        eq(invitationsTable.status, "pending"),
        eq(invitationsTable.teamId, req.user!.teamId!)
      )
    );

  if (existingInvite) {
    res.status(409).json({ error: "Invitation already pending for this email" });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const [invitation] = await db
    .insert(invitationsTable)
    .values({
      email,
      role: inviteRole,
      teamId: req.user!.teamId,
      invitedBy: req.user!.id,
      token,
      expiresAt,
    })
    .returning();

  res.status(201).json(invitation);
});

router.delete("/invitations/:id", requireRole("lead", "director"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [invitation] = await db
    .select()
    .from(invitationsTable)
    .where(eq(invitationsTable.id, id));

  if (!invitation || invitation.teamId !== req.user!.teamId) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }

  await db
    .update(invitationsTable)
    .set({ status: "cancelled" })
    .where(eq(invitationsTable.id, id));

  res.json({ success: true });
});

export default router;
