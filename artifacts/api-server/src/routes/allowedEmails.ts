import { Router, type IRouter } from "express";
import { db, allowedEmailsTable, insertAllowedEmailSchema } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireTeam, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

const directorsOnly = requireRole("director");

router.get("/allowed-emails", requireTeam, directorsOnly, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const rows = await db
    .select()
    .from(allowedEmailsTable)
    .where(eq(allowedEmailsTable.teamId, teamId));

  res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/allowed-emails", requireTeam, directorsOnly, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const parsed = insertAllowedEmailSchema.safeParse({
    email: (req.body?.email ?? "").toString().toLowerCase().trim(),
    teamId,
    invitedByUserId: req.user!.id,
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(allowedEmailsTable)
    .values(parsed.data)
    .onConflictDoNothing({ target: allowedEmailsTable.email })
    .returning();

  if (!row) {
    res.status(409).json({ error: "Email already allowed" });
    return;
  }

  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/allowed-emails/:id", requireTeam, directorsOnly, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db
    .delete(allowedEmailsTable)
    .where(and(eq(allowedEmailsTable.id, id), eq(allowedEmailsTable.teamId, teamId)));

  res.status(204).send();
});

export default router;
