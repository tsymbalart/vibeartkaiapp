import { Router, type IRouter } from "express";
import {
  db,
  registerItemsTable,
  insertRegisterItemSchema,
  projectsTable,
  usersTable,
} from "@workspace/db";
import { and, asc, desc, eq } from "drizzle-orm";
import { requireLeadOrDirector } from "../middlewares/requireAuth";
import { enrichRegisterItem } from "../lib/designOpsStorage";

const router: IRouter = Router();

// Risk/opportunity register is lead/director-only.
const canRead = requireLeadOrDirector;
const canWrite = requireLeadOrDirector;

/**
 * Unified risks + opportunities register.
 * Filters: type, linkedTo, projectId, userId, status
 */
router.get("/register-items", canRead, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;

  const where = [eq(registerItemsTable.teamId, teamId)];
  if (typeof req.query.type === "string") {
    where.push(eq(registerItemsTable.type, req.query.type));
  }
  if (typeof req.query.linkedTo === "string") {
    where.push(eq(registerItemsTable.linkedTo, req.query.linkedTo));
  }
  if (typeof req.query.status === "string") {
    where.push(eq(registerItemsTable.status, req.query.status));
  }
  if (typeof req.query.projectId === "string") {
    const pid = Number(req.query.projectId);
    if (Number.isInteger(pid)) where.push(eq(registerItemsTable.projectId, pid));
  }
  if (typeof req.query.userId === "string") {
    const uid = Number(req.query.userId);
    if (Number.isInteger(uid)) where.push(eq(registerItemsTable.userId, uid));
  }

  const rows = await db
    .select()
    .from(registerItemsTable)
    .where(and(...where))
    .orderBy(asc(registerItemsTable.priority), desc(registerItemsTable.updatedAt));

  res.json(rows.map(enrichRegisterItem));
});

router.post("/register-items", canWrite, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const parsed = insertRegisterItemSchema.safeParse({
    ...req.body,
    teamId,
    createdByUserId: req.user!.id,
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Validate linked entity belongs to team
  if (parsed.data.linkedTo === "project" && parsed.data.projectId != null) {
    const [p] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, parsed.data.projectId), eq(projectsTable.teamId, teamId)));
    if (!p) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
  }
  if (parsed.data.linkedTo === "user" && parsed.data.userId != null) {
    const [u] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, parsed.data.userId), eq(usersTable.teamId, teamId)));
    if (!u) {
      res.status(404).json({ error: "User not found" });
      return;
    }
  }

  const [item] = await db.insert(registerItemsTable).values(parsed.data).returning();
  res.status(201).json(enrichRegisterItem(item));
});

router.patch("/register-items/:id", canWrite, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(registerItemsTable)
    .where(and(eq(registerItemsTable.id, id), eq(registerItemsTable.teamId, teamId)));

  if (!existing) {
    res.status(404).json({ error: "Register item not found" });
    return;
  }

  const body = req.body ?? {};
  const allowedKeys = [
    "title",
    "description",
    "impact",
    "probability",
    "confidence",
    "value",
    "dueDate",
    "responsibleUserId",
    "priority",
    "status",
  ] as const;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowedKeys) {
    if (key in body) updates[key] = body[key];
  }

  if (updates.status === "done" && existing.status !== "done") {
    updates.closedAt = new Date();
  } else if ("status" in updates && updates.status !== "done" && existing.status === "done") {
    updates.closedAt = null;
  }

  const [item] = await db
    .update(registerItemsTable)
    .set(updates)
    .where(eq(registerItemsTable.id, id))
    .returning();

  res.json(enrichRegisterItem(item));
});

router.delete("/register-items/:id", canWrite, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(registerItemsTable)
    .where(and(eq(registerItemsTable.id, id), eq(registerItemsTable.teamId, teamId)));

  if (!existing) {
    res.status(404).json({ error: "Register item not found" });
    return;
  }

  await db.delete(registerItemsTable).where(eq(registerItemsTable.id, id));
  res.status(204).send();
});

export default router;
