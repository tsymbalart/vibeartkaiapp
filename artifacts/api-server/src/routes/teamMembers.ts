import { Router, type IRouter } from "express";
import crypto from "crypto";
import { db, usersTable, invitationsTable, userSubTeamsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireTeam, requireLeadOrDirector } from "../middlewares/requireAuth";
import { intParam } from "../lib/params";

const router: IRouter = Router();

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) return null;
  return trimmed;
}

router.get("/team/members", requireTeam, async (req, res): Promise<void> => {
  const user = req.user!;
  const isLead = user.role === "lead" || user.role === "director";

  const members = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.teamId, user.teamId!));

  const memberIds = members.map((m) => m.id);
  const memberships = memberIds.length > 0
    ? await db
        .select()
        .from(userSubTeamsTable)
        .where(inArray(userSubTeamsTable.userId, memberIds))
    : [];

  const userSubTeamMap: Record<number, number[]> = {};
  for (const m of memberships) {
    if (!userSubTeamMap[m.userId]) userSubTeamMap[m.userId] = [];
    userSubTeamMap[m.userId].push(m.subTeamId);
  }

  res.json(
    members.map((m) => {
      // Everyone can see a minimal directory (id/name/role/avatar/sub-teams).
      const base = {
        id: m.id,
        name: m.name,
        role: m.role,
        avatarUrl: m.avatarUrl,
        subTeamIds: userSubTeamMap[m.id] || [],
      };
      if (!isLead) {
        return base;
      }
      // Leads and directors also see the full design-ops fused record.
      return {
        ...base,
        email: m.email,
        roleTitle: m.roleTitle ?? null,
        leadUserId: m.leadUserId ?? null,
        employmentStatus: m.employmentStatus,
        isActive: m.isActive,
      };
    })
  );
});

router.patch(
  "/team/members/:id/role",
  requireLeadOrDirector,
  async (req, res): Promise<void> => {
    const id = intParam(req, "id");
    if (id == null) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const { role } = req.body;
    if (!role || !["member", "lead", "director"].includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    // Only directors can assign the lead or director role. Leads can only
    // change a member's role among member-level options (i.e., nothing
    // elevating: this effectively restricts leads to demoting/removing leads
    // they did not create — which they can't do either, see below).
    if ((role === "director" || role === "lead") && req.user!.role !== "director") {
      res.status(403).json({ error: "Only directors can assign lead or director role" });
      return;
    }

    if (id === req.user!.id && role !== req.user!.role) {
      res.status(400).json({ error: "Cannot change your own role" });
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

    // Only directors can modify existing lead or director accounts.
    if ((target.role === "lead" || target.role === "director") && req.user!.role !== "director") {
      res.status(403).json({ error: "Only directors can modify lead or director accounts" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set({ role, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();

    res.json({ id: updated.id, name: updated.name, role: updated.role });
  }
);

router.delete(
  "/team/members/:id",
  requireLeadOrDirector,
  async (req, res): Promise<void> => {
    const id = intParam(req, "id");
    if (id == null) {
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

    // Only directors can remove leads or directors.
    if ((target.role === "lead" || target.role === "director") && req.user!.role !== "director") {
      res.status(403).json({ error: "Only directors can remove lead or director accounts" });
      return;
    }

    await db
      .update(usersTable)
      .set({ teamId: null, updatedAt: new Date() })
      .where(eq(usersTable.id, id));

    res.json({ success: true });
  }
);

router.get("/invitations", requireLeadOrDirector, async (req, res): Promise<void> => {
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

router.post("/invitations", requireLeadOrDirector, async (req, res): Promise<void> => {
  const email = normalizeEmail(req.body?.email);
  if (!email) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }

  const inviteRole = req.body?.role || "member";
  if (!["member", "lead", "director"].includes(inviteRole)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }

  // Only directors can add new leads or directors. Leads may only invite
  // members — this matches the "admin adds new leads and admins" rule.
  if ((inviteRole === "lead" || inviteRole === "director") && req.user!.role !== "director") {
    res.status(403).json({ error: "Only directors can invite leads or directors" });
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

/**
 * Bulk invite: accepts up to 50 emails in one request, processes each
 * independently, and returns per-email results so the frontend can show
 * which succeeded and which failed (e.g., "already a member").
 */
router.post("/invitations/bulk", requireLeadOrDirector, async (req, res): Promise<void> => {
  const rawEmails: unknown = req.body?.emails;
  if (!Array.isArray(rawEmails) || rawEmails.length === 0) {
    res.status(400).json({ error: "emails must be a non-empty array" });
    return;
  }
  if (rawEmails.length > 50) {
    res.status(400).json({ error: "Maximum 50 emails per request" });
    return;
  }

  const inviteRole: string = req.body?.role || "member";
  if (!["member", "lead", "director"].includes(inviteRole)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  if ((inviteRole === "lead" || inviteRole === "director") && req.user!.role !== "director") {
    res.status(403).json({ error: "Only directors can invite leads or directors" });
    return;
  }

  const teamId = req.user!.teamId!;
  const invitedBy = req.user!.id;
  const results: Array<{
    email: string;
    status: "created" | "error";
    error?: string;
    invitation?: typeof invitationsTable.$inferSelect;
  }> = [];

  for (const raw of rawEmails) {
    const email = normalizeEmail(raw);
    if (!email) {
      results.push({ email: String(raw), status: "error", error: "Invalid email" });
      continue;
    }

    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (existingUser && existingUser.teamId === teamId) {
      results.push({ email, status: "error", error: "Already a team member" });
      continue;
    }

    const [existingInvite] = await db
      .select()
      .from(invitationsTable)
      .where(
        and(
          eq(invitationsTable.email, email),
          eq(invitationsTable.status, "pending"),
          eq(invitationsTable.teamId, teamId)
        )
      );
    if (existingInvite) {
      results.push({ email, status: "error", error: "Invitation already pending" });
      continue;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [invitation] = await db
      .insert(invitationsTable)
      .values({ email, role: inviteRole, teamId, invitedBy, token, expiresAt })
      .returning();

    results.push({ email, status: "created", invitation });
  }

  const created = results.filter((r) => r.status === "created").length;
  const failed = results.filter((r) => r.status === "error").length;
  res.status(created > 0 ? 201 : 200).json({ results, summary: { created, failed } });
});

router.delete("/invitations/:id", requireLeadOrDirector, async (req, res): Promise<void> => {
  const id = intParam(req, "id");
  if (id == null) {
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
