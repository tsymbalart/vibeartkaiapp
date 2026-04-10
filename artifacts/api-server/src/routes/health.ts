import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db, usersTable, teamsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

/**
 * Temporary diagnostic endpoint to debug why Design Team page is empty.
 * Returns all users and teams so we can see teamId assignments and isActive values.
 * TODO: Remove after debugging.
 */
router.get("/debug/users", async (_req, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      teamId: usersTable.teamId,
      isActive: usersTable.isActive,
      employmentStatus: usersTable.employmentStatus,
      roleTitle: usersTable.roleTitle,
    })
    .from(usersTable);

  const teams = await db.select().from(teamsTable);

  res.json({ teams, users });
});

export default router;
