import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  userHealthChecksTable,
  projectAssignmentsTable,
  insertUserHealthCheckSchema,
  registerItemsTable,
} from "@workspace/db";
import { and, desc, eq, asc } from "drizzle-orm";
import { requireTeam, requireRole } from "../middlewares/requireAuth";
import {
  enrichRegisterItem,
  enrichUserHealth,
  getUserScoped,
  listDesignTeamUsersEnriched,
  trendFromChecks,
} from "../lib/designOpsStorage";

/**
 * Design Team routes — operates on `users` as tracked design-ops people.
 * A user is considered "tracked" when `roleTitle` is non-null.
 * Listing excludes untracked users by default; PATCH lets a lead "claim" any
 * team member by setting `roleTitle`.
 */

const router: IRouter = Router();

const canWrite = requireRole("lead", "director");

// ─── List + get ─────────────────────────────────────────────────────────

router.get("/design-team", requireTeam, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const people = await listDesignTeamUsersEnriched(teamId);
  res.json(people);
});

router.get("/design-team/:userId", requireTeam, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const user = await getUserScoped(teamId, userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const healthChecks = await db
    .select()
    .from(userHealthChecksTable)
    .where(eq(userHealthChecksTable.userId, userId))
    .orderBy(desc(userHealthChecksTable.createdAt));

  const assignments = await db
    .select()
    .from(projectAssignmentsTable)
    .where(eq(projectAssignmentsTable.userId, userId));

  const items = await db
    .select()
    .from(registerItemsTable)
    .where(
      and(eq(registerItemsTable.linkedTo, "user"), eq(registerItemsTable.userId, userId))
    )
    .orderBy(asc(registerItemsTable.priority), desc(registerItemsTable.updatedAt));

  const latest = healthChecks[0] ?? null;
  const previous = healthChecks[1] ?? null;

  res.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    healthChecks: healthChecks.map(enrichUserHealth),
    latestHealth: enrichUserHealth(latest),
    trend: trendFromChecks(latest, previous),
    projectIds: assignments.map((a) => a.projectId),
    registerItems: items.map(enrichRegisterItem),
  });
});

// ─── Update design-ops fields ───────────────────────────────────────────

const EDITABLE_FIELDS = [
  "roleTitle",
  "leadUserId",
  "employmentStatus",
  "notes",
  "reviewDate",
  "isActive",
] as const;

router.patch("/design-team/:userId", requireTeam, canWrite, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const existing = await getUserScoped(teamId, userId);
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const body = req.body ?? {};
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of EDITABLE_FIELDS) {
    if (key in body) updates[key] = body[key];
  }

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning();

  res.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
});

// ─── Health checks ─────────────────────────────────────────────────────

router.post(
  "/design-team/:userId/health-checks",
  requireTeam,
  canWrite,
  async (req, res): Promise<void> => {
    const teamId = req.user!.teamId!;
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const existing = await getUserScoped(teamId, userId);
    if (!existing) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const parsed = insertUserHealthCheckSchema.safeParse({
      ...req.body,
      userId,
      createdByUserId: req.user!.id,
    });
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [hc] = await db.insert(userHealthChecksTable).values(parsed.data).returning();

    // Auto-bump user review date to +14 days
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + 14);
    await db
      .update(usersTable)
      .set({ reviewDate: reviewDate.toISOString().slice(0, 10), updatedAt: new Date() })
      .where(eq(usersTable.id, userId));

    res.status(201).json(enrichUserHealth(hc));
  }
);

router.patch(
  "/design-team/:userId/health-checks/:checkId",
  requireTeam,
  canWrite,
  async (req, res): Promise<void> => {
    const teamId = req.user!.teamId!;
    const userId = Number(req.params.userId);
    const checkId = Number(req.params.checkId);
    if (!Number.isInteger(userId) || !Number.isInteger(checkId)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const existing = await getUserScoped(teamId, userId);
    if (!existing) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const body = req.body ?? {};
    const editable = [
      "energy",
      "workloadBalance",
      "roleClarity",
      "levelFit",
      "engagement",
      "support",
      "summaryNote",
    ] as const;
    const updates: Record<string, unknown> = {};
    for (const key of editable) {
      if (key in body) updates[key] = body[key];
    }

    const [hc] = await db
      .update(userHealthChecksTable)
      .set(updates)
      .where(
        and(
          eq(userHealthChecksTable.id, checkId),
          eq(userHealthChecksTable.userId, userId)
        )
      )
      .returning();

    if (!hc) {
      res.status(404).json({ error: "Health check not found" });
      return;
    }

    res.json(enrichUserHealth(hc));
  }
);

router.delete(
  "/design-team/:userId/health-checks/:checkId",
  requireTeam,
  canWrite,
  async (req, res): Promise<void> => {
    const teamId = req.user!.teamId!;
    const userId = Number(req.params.userId);
    const checkId = Number(req.params.checkId);
    if (!Number.isInteger(userId) || !Number.isInteger(checkId)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const existing = await getUserScoped(teamId, userId);
    if (!existing) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await db
      .delete(userHealthChecksTable)
      .where(
        and(
          eq(userHealthChecksTable.id, checkId),
          eq(userHealthChecksTable.userId, userId)
        )
      );

    res.status(204).send();
  }
);

export default router;
