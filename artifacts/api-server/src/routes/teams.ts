import { Router, type IRouter } from "express";
import { db, teamsTable, usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  GetCurrentTeamResponse,
  GetTeamMembersResponse,
} from "@workspace/api-zod";
import { requireTeam } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/teams/current", requireTeam, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, teamId));
  if (!team) {
    res.status(404).json({ error: "No team found" });
    return;
  }

  const [memberCountResult] = await db
    .select({ count: count() })
    .from(usersTable)
    .where(eq(usersTable.teamId, teamId));

  res.json({
    id: team.id,
    name: team.name,
    memberCount: memberCountResult?.count ?? 0,
    createdAt: team.createdAt.toISOString(),
  });
});

router.get("/teams/current/members", requireTeam, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const members = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.teamId, teamId));

  res.json(
    members.map((m) => ({
      id: m.id,
      name: m.name,
      avatarUrl: m.avatarUrl,
      role: m.role,
    }))
  );
});

export default router;
