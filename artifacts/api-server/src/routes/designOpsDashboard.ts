import { Router, type IRouter } from "express";
import { requireLeadOrDirector } from "../middlewares/requireAuth";
import {
  listProjectsEnriched,
  listDesignTeamUsersEnriched,
  enrichRegisterItem,
} from "../lib/designOpsStorage";
import { db, registerItemsTable } from "@workspace/db";
import { and, eq, ne } from "drizzle-orm";

const router: IRouter = Router();

/**
 * Dashboard aggregate for the Design Ops dashboard widgets.
 * Returns projects, design-team users, and all open register items in one
 * call so the frontend can render the 4 widgets without N+1 round trips.
 */
router.get("/design-ops/dashboard", requireLeadOrDirector, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;

  const [projects, people, allItems] = await Promise.all([
    listProjectsEnriched(teamId),
    listDesignTeamUsersEnriched(teamId),
    db
      .select()
      .from(registerItemsTable)
      .where(
        and(eq(registerItemsTable.teamId, teamId), ne(registerItemsTable.status, "done"))
      ),
  ]);

  res.json({
    projects,
    people,
    registerItems: allItems.map(enrichRegisterItem),
  });
});

export default router;
