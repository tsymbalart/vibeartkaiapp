import { Router, type IRouter } from "express";
import {
  db,
  projectsTable,
  projectHealthChecksTable,
  projectAssignmentsTable,
  usersTable,
  insertProjectSchema,
  insertProjectHealthCheckSchema,
} from "@workspace/db";
import { and, asc, desc, eq } from "drizzle-orm";
import { requireLeadOrDirector } from "../middlewares/requireAuth";
import {
  enrichProjectHealth,
  enrichRegisterItem,
  getProjectScoped,
  listProjectsEnriched,
  trendFromChecks,
} from "../lib/designOpsStorage";
import { registerItemsTable } from "@workspace/db";

const router: IRouter = Router();

// All design-ops project routes are lead/director-only.
const canRead = requireLeadOrDirector;
const canWrite = requireLeadOrDirector;

async function validateLeadInTeam(teamId: number, leadUserId: unknown): Promise<boolean> {
  if (leadUserId == null) return true;
  if (typeof leadUserId !== "number" || !Number.isInteger(leadUserId)) return false;
  const [row] = await db
    .select({ id: usersTable.id, teamId: usersTable.teamId, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, leadUserId));
  if (!row || row.teamId !== teamId) return false;
  return row.role === "lead" || row.role === "director";
}

// ─── List + get ─────────────────────────────────────────────────────────

router.get("/projects", canRead, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const projects = await listProjectsEnriched(teamId);
  res.json(projects);
});

router.get("/projects/:id", canRead, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const project = await getProjectScoped(teamId, id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const healthChecks = await db
    .select()
    .from(projectHealthChecksTable)
    .where(eq(projectHealthChecksTable.projectId, id))
    .orderBy(desc(projectHealthChecksTable.createdAt));

  const assignments = await db
    .select()
    .from(projectAssignmentsTable)
    .where(eq(projectAssignmentsTable.projectId, id));

  const items = await db
    .select()
    .from(registerItemsTable)
    .where(
      and(eq(registerItemsTable.linkedTo, "project"), eq(registerItemsTable.projectId, id))
    )
    .orderBy(asc(registerItemsTable.priority), desc(registerItemsTable.updatedAt));

  const latest = healthChecks[0] ?? null;
  const previous = healthChecks[1] ?? null;

  res.json({
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    healthChecks: healthChecks.map(enrichProjectHealth),
    latestHealth: enrichProjectHealth(latest),
    trend: trendFromChecks(latest, previous),
    assignedUserIds: assignments.map((a) => a.userId),
    registerItems: items.map(enrichRegisterItem),
  });
});

// ─── Create / update / delete project ──────────────────────────────────

router.post("/projects", canWrite, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const parsed = insertProjectSchema.safeParse({ ...req.body, teamId });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!(await validateLeadInTeam(teamId, parsed.data.leadUserId))) {
    res.status(400).json({ error: "leadUserId must be a lead/director in the same team" });
    return;
  }

  const [project] = await db.insert(projectsTable).values(parsed.data).returning();
  res.status(201).json({
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
});

router.patch("/projects/:id", canWrite, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const existing = await getProjectScoped(teamId, id);
  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  // Whitelist editable fields to avoid pass-through of sensitive columns.
  const ALLOWED = [
    "name",
    "clientName",
    "leadUserId",
    "status",
    "description",
    "reviewDate",
    "trend",
  ] as const;
  const body = req.body ?? {};
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of ALLOWED) {
    if (key in body) updates[key] = body[key];
  }

  if ("leadUserId" in updates) {
    if (!(await validateLeadInTeam(teamId, updates.leadUserId))) {
      res.status(400).json({ error: "leadUserId must be a lead/director in the same team" });
      return;
    }
  }

  const [project] = await db
    .update(projectsTable)
    .set(updates)
    .where(eq(projectsTable.id, id))
    .returning();

  res.json({
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
});

router.delete("/projects/:id", canWrite, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const existing = await getProjectScoped(teamId, id);
  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  res.status(204).send();
});

// ─── Health checks ─────────────────────────────────────────────────────

router.post(
  "/projects/:id/health-checks",
  canWrite,
  async (req, res): Promise<void> => {
    const teamId = req.user!.teamId!;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const existing = await getProjectScoped(teamId, id);
    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const parsed = insertProjectHealthCheckSchema.safeParse({
      ...req.body,
      projectId: id,
      createdByUserId: req.user!.id,
    });
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [hc] = await db.insert(projectHealthChecksTable).values(parsed.data).returning();

    // Auto-bump project review date to +14 days after every new check
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + 14);
    await db
      .update(projectsTable)
      .set({ reviewDate: reviewDate.toISOString().slice(0, 10), updatedAt: new Date() })
      .where(eq(projectsTable.id, id));

    res.status(201).json(enrichProjectHealth(hc));
  }
);

router.patch(
  "/projects/:id/health-checks/:checkId",
  canWrite,
  async (req, res): Promise<void> => {
    const teamId = req.user!.teamId!;
    const id = Number(req.params.id);
    const checkId = Number(req.params.checkId);
    if (!Number.isInteger(id) || !Number.isInteger(checkId)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const existing = await getProjectScoped(teamId, id);
    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const body = req.body ?? {};
    const editable = ["capacity", "clientSatisfaction", "teamSatisfaction", "quality", "summaryNote"] as const;
    const updates: Record<string, unknown> = {};
    for (const key of editable) {
      if (key in body) updates[key] = body[key];
    }

    const [hc] = await db
      .update(projectHealthChecksTable)
      .set(updates)
      .where(
        and(
          eq(projectHealthChecksTable.id, checkId),
          eq(projectHealthChecksTable.projectId, id)
        )
      )
      .returning();

    if (!hc) {
      res.status(404).json({ error: "Health check not found" });
      return;
    }

    res.json(enrichProjectHealth(hc));
  }
);

router.delete(
  "/projects/:id/health-checks/:checkId",
  canWrite,
  async (req, res): Promise<void> => {
    const teamId = req.user!.teamId!;
    const id = Number(req.params.id);
    const checkId = Number(req.params.checkId);
    if (!Number.isInteger(id) || !Number.isInteger(checkId)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const existing = await getProjectScoped(teamId, id);
    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    await db
      .delete(projectHealthChecksTable)
      .where(
        and(
          eq(projectHealthChecksTable.id, checkId),
          eq(projectHealthChecksTable.projectId, id)
        )
      );

    res.status(204).send();
  }
);

// ─── Assignments ───────────────────────────────────────────────────────

router.post(
  "/projects/:id/assignments",
  canWrite,
  async (req, res): Promise<void> => {
    const teamId = req.user!.teamId!;
    const id = Number(req.params.id);
    const userId = Number(req.body?.userId);
    if (!Number.isInteger(id) || !Number.isInteger(userId)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const existing = await getProjectScoped(teamId, id);
    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const [target] = await db
      .select({ id: usersTable.id, teamId: usersTable.teamId })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    if (!target || target.teamId !== teamId) {
      res.status(400).json({ error: "User not in this team" });
      return;
    }

    const [assignment] = await db
      .insert(projectAssignmentsTable)
      .values({ projectId: id, userId })
      .onConflictDoNothing()
      .returning();

    res.status(201).json(assignment ?? null);
  }
);

router.delete(
  "/projects/:id/assignments/:userId",
  canWrite,
  async (req, res): Promise<void> => {
    const teamId = req.user!.teamId!;
    const id = Number(req.params.id);
    const userId = Number(req.params.userId);
    if (!Number.isInteger(id) || !Number.isInteger(userId)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const existing = await getProjectScoped(teamId, id);
    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    await db
      .delete(projectAssignmentsTable)
      .where(
        and(
          eq(projectAssignmentsTable.projectId, id),
          eq(projectAssignmentsTable.userId, userId)
        )
      );

    res.status(204).send();
  }
);

export default router;
