import {
  db,
  projectsTable,
  projectHealthChecksTable,
  userHealthChecksTable,
  projectAssignmentsTable,
  registerItemsTable,
  usersTable,
  type Project,
  type ProjectHealthCheck,
  type UserHealthCheck,
  type RegisterItem,
  type User,
} from "@workspace/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  computeHealthStatus,
  computeRiskScore,
  computeOpportunityScore,
  type HealthStatus,
  type ItemLevel,
} from "@workspace/scoring";

/**
 * Shared storage helpers for the design-ops domain (projects, design-team users,
 * health checks, assignments, risks/opportunities). Patterns mirror Check's original
 * server/storage.ts: batch reads using DISTINCT ON / window functions to avoid N+1,
 * and enrichment helpers that compute derived scores server-side.
 */

// ─── Health enrichment ──────────────────────────────────────────────

export function enrichProjectHealth(hc: ProjectHealthCheck | null | undefined) {
  if (!hc) return null;
  const dims = [hc.capacity, hc.clientSatisfaction, hc.teamSatisfaction, hc.quality];
  const { score, status } = computeHealthStatus(dims);
  return {
    id: hc.id,
    projectId: hc.projectId,
    createdByUserId: hc.createdByUserId,
    capacity: hc.capacity,
    clientSatisfaction: hc.clientSatisfaction,
    teamSatisfaction: hc.teamSatisfaction,
    quality: hc.quality,
    summaryNote: hc.summaryNote,
    createdAt: hc.createdAt.toISOString(),
    healthScore: score,
    overallHealth: status,
  };
}

export function enrichUserHealth(hc: UserHealthCheck | null | undefined) {
  if (!hc) return null;
  const dims = [hc.energy, hc.workloadBalance, hc.roleClarity, hc.levelFit, hc.engagement, hc.support];
  const { score, status } = computeHealthStatus(dims);
  return {
    id: hc.id,
    userId: hc.userId,
    createdByUserId: hc.createdByUserId,
    energy: hc.energy,
    workloadBalance: hc.workloadBalance,
    roleClarity: hc.roleClarity,
    levelFit: hc.levelFit,
    engagement: hc.engagement,
    support: hc.support,
    summaryNote: hc.summaryNote,
    createdAt: hc.createdAt.toISOString(),
    healthScore: score,
    overallHealth: status,
  };
}

export function enrichRegisterItem(item: RegisterItem) {
  let computed: { score: number; level: ItemLevel } | null = null;
  if (item.type === "risk" && item.probability != null && item.impact != null) {
    computed = computeRiskScore(item.probability, item.impact);
  } else if (item.type === "opportunity" && item.confidence != null && item.value != null) {
    computed = computeOpportunityScore(item.confidence, item.value);
  }
  return {
    id: item.id,
    teamId: item.teamId,
    type: item.type as "risk" | "opportunity",
    linkedTo: item.linkedTo as "project" | "user",
    projectId: item.projectId,
    userId: item.userId,
    title: item.title,
    description: item.description,
    impact: item.impact,
    probability: item.probability,
    confidence: item.confidence,
    value: item.value,
    dueDate: item.dueDate,
    responsibleUserId: item.responsibleUserId,
    priority: item.priority,
    status: item.status,
    createdByUserId: item.createdByUserId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    closedAt: item.closedAt?.toISOString() ?? null,
    riskScore: item.type === "risk" ? computed?.score ?? null : null,
    riskLevel: item.type === "risk" ? computed?.level ?? null : null,
    oppScore: item.type === "opportunity" ? computed?.score ?? null : null,
    oppLevel: item.type === "opportunity" ? computed?.level ?? null : null,
  };
}

export function trendFromChecks(
  latest: ProjectHealthCheck | UserHealthCheck | null,
  previous: ProjectHealthCheck | UserHealthCheck | null
): "up" | "down" | "stable" | null {
  if (!latest || !previous) return null;
  const latestDims = "capacity" in latest
    ? [latest.capacity, latest.clientSatisfaction, latest.teamSatisfaction, latest.quality]
    : [latest.energy, latest.workloadBalance, latest.roleClarity, latest.levelFit, latest.engagement, latest.support];
  const prevDims = "capacity" in previous
    ? [previous.capacity, previous.clientSatisfaction, previous.teamSatisfaction, previous.quality]
    : [previous.energy, previous.workloadBalance, previous.roleClarity, previous.levelFit, previous.engagement, previous.support];
  const a = computeHealthStatus(latestDims).score;
  const b = computeHealthStatus(prevDims).score;
  if (a - b >= 0.3) return "up";
  if (b - a >= 0.3) return "down";
  return "stable";
}

// ─── Batched latest-health fetches (avoid N+1) ──────────────────────────

export async function getLatestProjectHealthByProject(projectIds: number[]) {
  if (projectIds.length === 0) return new Map<number, ProjectHealthCheck>();
  const idsParam = sql.join(projectIds.map((id) => sql`${id}`), sql`, `);
  const rows = await db.execute<ProjectHealthCheck & { _row: number }>(sql`
    SELECT DISTINCT ON (project_id) *
    FROM project_health_checks
    WHERE project_id = ANY(ARRAY[${idsParam}]::int[])
    ORDER BY project_id, created_at DESC
  `);
  const map = new Map<number, ProjectHealthCheck>();
  for (const r of rows.rows as unknown as ProjectHealthCheck[]) {
    map.set(r.projectId, r);
  }
  return map;
}

export async function getLatestTwoProjectHealthByProject(projectIds: number[]) {
  if (projectIds.length === 0) return new Map<number, ProjectHealthCheck[]>();
  const idsParam = sql.join(projectIds.map((id) => sql`${id}`), sql`, `);
  const rows = await db.execute<ProjectHealthCheck & { rn: number }>(sql`
    SELECT *
    FROM (
      SELECT *, row_number() OVER (PARTITION BY project_id ORDER BY created_at DESC) AS rn
      FROM project_health_checks
      WHERE project_id = ANY(ARRAY[${idsParam}]::int[])
    ) t
    WHERE rn <= 2
  `);
  const map = new Map<number, ProjectHealthCheck[]>();
  for (const r of rows.rows as unknown as ProjectHealthCheck[]) {
    const list = map.get(r.projectId) ?? [];
    list.push(r);
    map.set(r.projectId, list);
  }
  return map;
}

export async function getLatestUserHealthByUser(userIds: number[]) {
  if (userIds.length === 0) return new Map<number, UserHealthCheck>();
  const idsParam = sql.join(userIds.map((id) => sql`${id}`), sql`, `);
  const rows = await db.execute<UserHealthCheck>(sql`
    SELECT DISTINCT ON (user_id) *
    FROM user_health_checks
    WHERE user_id = ANY(ARRAY[${idsParam}]::int[])
    ORDER BY user_id, created_at DESC
  `);
  const map = new Map<number, UserHealthCheck>();
  for (const r of rows.rows as unknown as UserHealthCheck[]) {
    map.set(r.userId, r);
  }
  return map;
}

export async function getLatestTwoUserHealthByUser(userIds: number[]) {
  if (userIds.length === 0) return new Map<number, UserHealthCheck[]>();
  const idsParam = sql.join(userIds.map((id) => sql`${id}`), sql`, `);
  const rows = await db.execute<UserHealthCheck>(sql`
    SELECT *
    FROM (
      SELECT *, row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
      FROM user_health_checks
      WHERE user_id = ANY(ARRAY[${idsParam}]::int[])
    ) t
    WHERE rn <= 2
  `);
  const map = new Map<number, UserHealthCheck[]>();
  for (const r of rows.rows as unknown as UserHealthCheck[]) {
    const list = map.get(r.userId) ?? [];
    list.push(r);
    map.set(r.userId, list);
  }
  return map;
}

// ─── Listing helpers ────────────────────────────────────────────────────

export async function listProjectsEnriched(teamId: number) {
  const projects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.teamId, teamId))
    .orderBy(desc(projectsTable.updatedAt));

  const projectIds = projects.map((p) => p.id);
  const latestTwoByProject = await getLatestTwoProjectHealthByProject(projectIds);
  const assignmentsByProject = await getAssignmentsByProject(projectIds);
  const itemCountsByProject = await getRegisterItemCountsByProject(projectIds);

  return projects.map((p) => {
    const [latest, previous] = latestTwoByProject.get(p.id) ?? [];
    return {
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      latestHealth: enrichProjectHealth(latest),
      trend: trendFromChecks(latest ?? null, previous ?? null),
      assignedUserIds: assignmentsByProject.get(p.id) ?? [],
      riskCount: itemCountsByProject.get(p.id)?.riskOpen ?? 0,
      oppCount: itemCountsByProject.get(p.id)?.oppOpen ?? 0,
    };
  });
}

export async function listDesignTeamUsersEnriched(teamId: number) {
  // Every active team member is part of Design Ops. The roleTitle field
  // is an optional "job title", not a visibility gate.
  const users = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.teamId, teamId),
        eq(usersTable.isActive, true)
      )
    );

  const userIds = users.map((u) => u.id);
  const latestTwoByUser = await getLatestTwoUserHealthByUser(userIds);
  const assignmentsByUser = await getProjectsByUser(userIds);
  const itemCountsByUser = await getRegisterItemCountsByUser(userIds);

  return users.map((u) => {
    const [latest, previous] = latestTwoByUser.get(u.id) ?? [];
    return {
      ...u,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      latestHealth: enrichUserHealth(latest),
      trend: trendFromChecks(latest ?? null, previous ?? null),
      projectIds: assignmentsByUser.get(u.id) ?? [],
      riskCount: itemCountsByUser.get(u.id)?.riskOpen ?? 0,
      oppCount: itemCountsByUser.get(u.id)?.oppOpen ?? 0,
    };
  });
}

// ─── Assignment helpers ─────────────────────────────────────────────────

export async function getAssignmentsByProject(projectIds: number[]) {
  if (projectIds.length === 0) return new Map<number, number[]>();
  const rows = await db
    .select()
    .from(projectAssignmentsTable)
    .where(inArray(projectAssignmentsTable.projectId, projectIds));
  const map = new Map<number, number[]>();
  for (const r of rows) {
    const list = map.get(r.projectId) ?? [];
    list.push(r.userId);
    map.set(r.projectId, list);
  }
  return map;
}

export async function getProjectsByUser(userIds: number[]) {
  if (userIds.length === 0) return new Map<number, number[]>();
  const rows = await db
    .select()
    .from(projectAssignmentsTable)
    .where(inArray(projectAssignmentsTable.userId, userIds));
  const map = new Map<number, number[]>();
  for (const r of rows) {
    const list = map.get(r.userId) ?? [];
    list.push(r.projectId);
    map.set(r.userId, list);
  }
  return map;
}

// ─── Register item count helpers ─────────────────────────────────────────

interface OpenCounts {
  riskOpen: number;
  oppOpen: number;
}

export async function getRegisterItemCountsByProject(projectIds: number[]) {
  const map = new Map<number, OpenCounts>();
  if (projectIds.length === 0) return map;
  const rows = await db
    .select()
    .from(registerItemsTable)
    .where(
      and(
        eq(registerItemsTable.linkedTo, "project"),
        inArray(registerItemsTable.projectId, projectIds)
      )
    );
  for (const r of rows) {
    if (r.projectId == null || r.status === "done") continue;
    const cur = map.get(r.projectId) ?? { riskOpen: 0, oppOpen: 0 };
    if (r.type === "risk") cur.riskOpen += 1;
    else if (r.type === "opportunity") cur.oppOpen += 1;
    map.set(r.projectId, cur);
  }
  return map;
}

export async function getRegisterItemCountsByUser(userIds: number[]) {
  const map = new Map<number, OpenCounts>();
  if (userIds.length === 0) return map;
  const rows = await db
    .select()
    .from(registerItemsTable)
    .where(
      and(
        eq(registerItemsTable.linkedTo, "user"),
        inArray(registerItemsTable.userId, userIds)
      )
    );
  for (const r of rows) {
    if (r.userId == null || r.status === "done") continue;
    const cur = map.get(r.userId) ?? { riskOpen: 0, oppOpen: 0 };
    if (r.type === "risk") cur.riskOpen += 1;
    else if (r.type === "opportunity") cur.oppOpen += 1;
    map.set(r.userId, cur);
  }
  return map;
}

// ─── Scoped getters (single entity) ─────────────────────────────────────

export async function getProjectScoped(teamId: number, projectId: number): Promise<Project | null> {
  const [row] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, projectId), eq(projectsTable.teamId, teamId)));
  return row ?? null;
}

export async function getUserScoped(teamId: number, userId: number): Promise<User | null> {
  const [row] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, userId), eq(usersTable.teamId, teamId)));
  return row ?? null;
}
