import { db, questionsTable, type Question } from "@workspace/db";
import { questionsVisibleToTeam } from "./questionScope";

/**
 * In-process cache of the questions visible to each team. The question
 * bank changes rarely (at most when a lead tweaks a question) but the
 * scoring loop reads the full list on every pulse-dashboard render, so
 * the cost-benefit ratio of a 60-second TTL is very high.
 *
 * Call `invalidateQuestions(teamId)` from the POST/PUT/DELETE question
 * handlers so that a newly added question shows up in the next render
 * without waiting for TTL expiry.
 */
const CACHE_TTL_MS = 60_000;

interface Entry {
  expiresAt: number;
  rows: Question[];
}

const cache = new Map<number, Entry>();

export async function getCachedQuestionsForTeam(teamId: number): Promise<Question[]> {
  const now = Date.now();
  const hit = cache.get(teamId);
  if (hit && hit.expiresAt > now) {
    return hit.rows;
  }
  let rows: Question[];
  try {
    rows = await db
      .select()
      .from(questionsTable)
      .where(questionsVisibleToTeam(teamId));
  } catch {
    // Graceful fallback: if the team_id column hasn't been added yet
    // (migration not run), fetch all questions without filtering.
    rows = await db.select().from(questionsTable);
  }
  cache.set(teamId, { expiresAt: now + CACHE_TTL_MS, rows });
  return rows;
}

export function invalidateQuestions(teamId?: number): void {
  if (teamId == null) {
    cache.clear();
    return;
  }
  cache.delete(teamId);
  // Global templates (teamId=null) are visible to every team; when a
  // director updates one the safest move is to drop everything.
}
