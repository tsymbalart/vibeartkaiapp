import { questionsTable } from "@workspace/db";
import { eq, isNull, or, type SQL } from "drizzle-orm";

/**
 * Filter expression for questions a team is allowed to see. A question
 * belongs to a team when its `teamId` matches; it is also treated as a
 * "global template" when `teamId IS NULL`. Global templates are visible
 * to every team so a fresh install already has a starter question bank.
 */
export function questionsVisibleToTeam(teamId: number): SQL {
  return or(isNull(questionsTable.teamId), eq(questionsTable.teamId, teamId))!;
}
