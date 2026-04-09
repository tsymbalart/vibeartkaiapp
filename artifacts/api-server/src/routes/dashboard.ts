import { Router, type IRouter } from "express";
import { db, teamsTable, usersTable, checkInsTable, responsesTable, questionsTable, pulseSettingsTable, userSubTeamsTable } from "@workspace/db";
import { eq, desc, gte, and, inArray, sql } from "drizzle-orm";
import {
  ALL_PILLARS,
  PILLAR_WEIGHTS,
  PILLAR_LABELS,
  computeComposite,
  computeStatus,
  computeTrend,
} from "../lib/scoring";
import { requireTeam, requireLeadOrDirector } from "../middlewares/requireAuth";
import { getCachedQuestionsForTeam } from "../lib/questionCache";

const router: IRouter = Router();

// Require at least 3 respondents before a pillar score is shown. Smaller
// groups make the "anonymous" aggregate trivially de-anonymisable.
const MIN_RESPONDENTS = 3;

async function getScoringMode(teamId: number): Promise<string> {
  const [settings] = await db.select().from(pulseSettingsTable).where(eq(pulseSettingsTable.teamId, teamId)).limit(1);
  return settings?.scoringMode ?? "latest_only";
}

async function computePillarScores(windowDays: number, teamId: number, subTeamUserIds?: number[]) {
  const scoringMode = await getScoringMode(teamId);
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - windowDays);

  const prevWindowStart = new Date();
  prevWindowStart.setDate(prevWindowStart.getDate() - windowDays * 2);

  let userFilter: number[] | undefined;
  const hasExplicitSubTeamFilter = subTeamUserIds !== undefined;
  if (hasExplicitSubTeamFilter) {
    userFilter = subTeamUserIds.length > 0 ? subTeamUserIds : [0];
  } else if (teamId) {
    const members = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.teamId, teamId));
    userFilter = members.map((m) => m.id);
  }

  const currentCheckIns = await db
    .select()
    .from(checkInsTable)
    .where(
      and(
        gte(checkInsTable.createdAt, windowStart),
        eq(checkInsTable.status, "completed"),
        ...(userFilter ? [inArray(checkInsTable.userId, userFilter)] : [])
      )
    )
    .orderBy(desc(checkInsTable.createdAt));

  const prevCheckIns = await db
    .select()
    .from(checkInsTable)
    .where(
      and(
        gte(checkInsTable.createdAt, prevWindowStart),
        eq(checkInsTable.status, "completed"),
        ...(userFilter ? [inArray(checkInsTable.userId, userFilter)] : [])
      )
    );
  const prevOnlyCheckIns = prevCheckIns.filter((c) => c.createdAt < windowStart);

  const allQuestions = await getCachedQuestionsForTeam(teamId);
  const questionMap = new Map(allQuestions.map((q) => [q.id, q]));
  const questionsByPillar = new Map<string, typeof allQuestions>();
  for (const q of allQuestions) {
    if (!questionsByPillar.has(q.pillar)) questionsByPillar.set(q.pillar, []);
    questionsByPillar.get(q.pillar)!.push(q);
  }

  let filteredCheckIns = currentCheckIns;
  if (scoringMode === "latest_only") {
    const latestByUser = new Map<number, typeof currentCheckIns[0]>();
    for (const ci of currentCheckIns) {
      if (!latestByUser.has(ci.userId)) {
        latestByUser.set(ci.userId, ci);
      }
    }
    filteredCheckIns = Array.from(latestByUser.values());
  }

  const currentCiIds = filteredCheckIns.map((c) => c.id);
  const prevCiIds = prevOnlyCheckIns.map((c) => c.id);

  let currentResponses: (typeof responsesTable.$inferSelect)[] = [];
  if (currentCiIds.length > 0) {
    currentResponses = await db
      .select()
      .from(responsesTable)
      .where(inArray(responsesTable.checkInId, currentCiIds));
  }

  let prevResponses: (typeof responsesTable.$inferSelect)[] = [];
  if (prevCiIds.length > 0) {
    prevResponses = await db
      .select()
      .from(responsesTable)
      .where(inArray(responsesTable.checkInId, prevCiIds));
  }

  const ciUserMap = new Map<number, number>();
  for (const ci of [...filteredCheckIns, ...prevOnlyCheckIns]) {
    ciUserMap.set(ci.id, ci.userId);
  }

  const pillarScores = ALL_PILLARS.map((pillar) => {
    const pillarQIds = (questionsByPillar.get(pillar) || []).map((q) => q.id);

    const currResponses = currentResponses.filter(
      (r) => pillarQIds.includes(r.questionId) && r.normalizedScore != null
    );
    const pResponses = prevResponses.filter(
      (r) => pillarQIds.includes(r.questionId) && r.normalizedScore != null
    );

    const respondentIds = new Set(currResponses.map((r) => ciUserMap.get(r.checkInId)).filter(Boolean));
    const respondentCount = respondentIds.size;

    if (respondentCount < MIN_RESPONDENTS || currResponses.length === 0) {
      return {
        pillar,
        score: 0,
        trend: "stable" as const,
        previousScore: null,
        favorability: 0,
        responseCount: currResponses.length,
        respondentCount,
        status: "insufficient" as const,
      };
    }

    let weightedSum = 0;
    let totalWeight = 0;
    for (const r of currResponses) {
      const q = questionMap.get(r.questionId);
      const w = q?.impactWeight ?? 1.0;
      weightedSum += r.normalizedScore! * w;
      totalWeight += w;
    }
    const score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;

    let prevScore: number | null = null;
    if (pResponses.length > 0) {
      let pWeightedSum = 0;
      let pTotalWeight = 0;
      for (const r of pResponses) {
        const q = questionMap.get(r.questionId);
        const w = q?.impactWeight ?? 1.0;
        pWeightedSum += r.normalizedScore! * w;
        pTotalWeight += w;
      }
      prevScore = pTotalWeight > 0 ? Math.round((pWeightedSum / pTotalWeight) * 10) / 10 : null;
    }

    const favorableCount = currResponses.filter((r) => (r.normalizedScore ?? 0) >= 75).length;
    const favorability = currResponses.length > 0 ? Math.round((favorableCount / currResponses.length) * 100) : 0;

    return {
      pillar,
      score,
      trend: computeTrend(score, prevScore),
      previousScore: prevScore,
      favorability,
      responseCount: currResponses.length,
      respondentCount,
      status: computeStatus(score),
    };
  });

  return pillarScores;
}

router.get("/dashboard", requireTeam, async (req, res): Promise<void> => {
  const user = req.user!;
  const userRole = user.role;
  const uid = user.id;
  const teamId = user.teamId!;
  const isLead = userRole === "lead" || userRole === "director";

  // ── Member view: personal data only, no team aggregates ─────────────
  if (!isLead) {
    const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, teamId));
    const teamName = team?.name ?? "Your Team";

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const userCheckIns = await db
      .select()
      .from(checkInsTable)
      .where(
        and(
          eq(checkInsTable.userId, uid),
          eq(checkInsTable.status, "completed"),
          gte(checkInsTable.createdAt, ninetyDaysAgo)
        )
      )
      .orderBy(desc(checkInsTable.createdAt));

    let personalPillarScores: Array<{
      pillar: string;
      score: number;
      trend: "stable";
      previousScore: number | null;
      favorability: number;
      responseCount: number;
      respondentCount: number;
      status: "green" | "yellow" | "red" | "insufficient";
    }> | null = null;
    let personalCompositeScore: number | null = null;
    let lastCheckInDate: string | null = null;

    if (userCheckIns.length > 0) {
      lastCheckInDate = userCheckIns[0].createdAt.toISOString();

      const ciIds = userCheckIns.map((c) => c.id);
      const userResponses = await db
        .select()
        .from(responsesTable)
        .where(inArray(responsesTable.checkInId, ciIds));

      const allQuestions = await getCachedQuestionsForTeam(teamId);
      const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

      personalPillarScores = ALL_PILLARS.map((pillar) => {
        const pillarResponses = userResponses.filter((r) => {
          const q = questionMap.get(r.questionId);
          return q?.pillar === pillar && r.normalizedScore != null;
        });

        if (pillarResponses.length === 0) {
          return {
            pillar,
            score: 0,
            trend: "stable" as const,
            previousScore: null,
            favorability: 0,
            responseCount: 0,
            respondentCount: 0,
            status: "insufficient" as const,
          };
        }

        let weightedSum = 0;
        let totalWeight = 0;
        for (const r of pillarResponses) {
          const q = questionMap.get(r.questionId);
          const w = q?.impactWeight ?? 1.0;
          weightedSum += r.normalizedScore! * w;
          totalWeight += w;
        }
        const score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
        const favorableCount = pillarResponses.filter((r) => (r.normalizedScore ?? 0) >= 75).length;

        return {
          pillar,
          score,
          trend: "stable" as const,
          previousScore: null,
          favorability: Math.round((favorableCount / pillarResponses.length) * 100),
          responseCount: pillarResponses.length,
          respondentCount: 1,
          status: computeStatus(score),
        };
      });

      const validPersonal = personalPillarScores.filter((p) => p.status !== "insufficient");
      personalCompositeScore = computeComposite(validPersonal);
    }

    res.json({
      teamName,
      userRole,
      // Team aggregates intentionally omitted for members.
      memberCount: null,
      completionRate: null,
      compositeScore: null,
      pillarScores: [],
      recentActivity: [],
      personalPillarScores,
      personalCompositeScore,
      lastCheckInDate,
      bestZone: null,
      worstZone: null,
    });
    return;
  }

  // ── Lead / director view: team aggregates (anonymised) ──────────────
  const subTeamIdParam = req.query.subTeamId ? parseInt(req.query.subTeamId as string, 10) : undefined;

  if (subTeamIdParam) {
    const { subTeamsTable } = await import("@workspace/db");
    const [st] = await db.select().from(subTeamsTable).where(eq(subTeamsTable.id, subTeamIdParam));
    if (!st || st.teamId !== teamId) {
      res.status(404).json({ error: "Sub-team not found" });
      return;
    }
  }

  const teamMembers = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.teamId, teamId));
  const teamMemberIds = teamMembers.map((m) => m.id);

  let subTeamUserIds: number[] | undefined;
  if (subTeamIdParam) {
    const stMembers = await db.select({ userId: userSubTeamsTable.userId }).from(userSubTeamsTable).where(eq(userSubTeamsTable.subTeamId, subTeamIdParam));
    subTeamUserIds = stMembers.map((m) => m.userId).filter((id) => teamMemberIds.includes(id));
  }

  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, teamId));
  const teamName = team?.name ?? "Your Team";

  const filteredMemberCount = subTeamUserIds ? subTeamUserIds.length : teamMemberIds.length;
  const effectiveUserIds = subTeamUserIds || teamMemberIds;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentCheckIns = effectiveUserIds.length > 0
    ? await db
        .select()
        .from(checkInsTable)
        .where(
          and(
            gte(checkInsTable.createdAt, sevenDaysAgo),
            inArray(checkInsTable.userId, effectiveUserIds)
          )
        )
    : [];

  const uniqueUsers = new Set(recentCheckIns.filter((c) => c.status === "completed").map((c) => c.userId));
  const completionRate = filteredMemberCount > 0 ? Math.round((uniqueUsers.size / filteredMemberCount) * 100) : 0;

  const pillarScores = await computePillarScores(90, teamId, subTeamUserIds);
  const validPillars = pillarScores.filter((p) => p.status !== "insufficient");
  const compositeScore = computeComposite(validPillars);

  const recentCompletedCheckIns = teamMemberIds.length > 0
    ? await db
        .select({
          id: checkInsTable.id,
          userId: checkInsTable.userId,
          status: checkInsTable.status,
          createdAt: checkInsTable.createdAt,
        })
        .from(checkInsTable)
        .where(
          and(
            gte(checkInsTable.createdAt, sevenDaysAgo),
            inArray(checkInsTable.userId, teamMemberIds)
          )
        )
        .orderBy(desc(checkInsTable.createdAt))
        .limit(10)
    : [];

  // Names are intentionally omitted — the activity feed is anonymised.
  const recentActivity = recentCompletedCheckIns.map((ci) => ({
    id: ci.id,
    userName: "A teammate",
    action: ci.status === "completed" ? "Completed a pulse check" : "Started a pulse check",
    timestamp: ci.createdAt.toISOString(),
  }));

  const sorted = [...validPillars].sort((a, b) => b.score - a.score);
  const bestZone = sorted.length > 0 ? sorted[0] : null;
  const worstZone = sorted.length > 1 ? sorted[sorted.length - 1] : null;

  res.json({
    teamName,
    memberCount: filteredMemberCount,
    userRole,
    completionRate,
    compositeScore,
    pillarScores,
    recentActivity,
    personalPillarScores: null,
    personalCompositeScore: null,
    lastCheckInDate: null,
    bestZone: bestZone ? { pillar: bestZone.pillar, score: bestZone.score, status: bestZone.status } : null,
    worstZone: worstZone ? { pillar: worstZone.pillar, score: worstZone.score, status: worstZone.status } : null,
  });
});

router.get("/my-journey", requireTeam, async (req, res): Promise<void> => {
  const days = parseInt(req.query.days as string) || 90;
  const teamId = req.user!.teamId!;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const userCheckIns = await db
    .select()
    .from(checkInsTable)
    .where(
      and(
        eq(checkInsTable.userId, req.user!.id),
        gte(checkInsTable.createdAt, startDate),
        eq(checkInsTable.status, "completed")
      )
    )
    .orderBy(checkInsTable.createdAt);

  const totalCheckIns = userCheckIns.length;

  let currentStreak = 0;
  const today = new Date();
  const checkInDates = userCheckIns.map((c) => {
    const d = new Date(c.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const uniqueDates = [...new Set(checkInDates)].sort().reverse();
  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expStr = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, "0")}-${String(expected.getDate()).padStart(2, "0")}`;
    if (uniqueDates.includes(expStr)) {
      currentStreak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }

  const allQuestions = await getCachedQuestionsForTeam(teamId);
  const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

  const ciIds = userCheckIns.map((c) => c.id);
  let allResponses: (typeof responsesTable.$inferSelect)[] = [];
  if (ciIds.length > 0) {
    allResponses = await db
      .select()
      .from(responsesTable)
      .where(inArray(responsesTable.checkInId, ciIds));
  }

  const ciDateMap = new Map(userCheckIns.map((c) => [c.id, c.createdAt.toISOString().split("T")[0]]));

  const pillarTimelines: Record<string, { date: string; value: number }[]> = {};
  for (const pillar of ALL_PILLARS) {
    pillarTimelines[pillar] = [];
  }

  const responsesByCheckIn = new Map<number, typeof allResponses>();
  for (const r of allResponses) {
    if (!responsesByCheckIn.has(r.checkInId)) responsesByCheckIn.set(r.checkInId, []);
    responsesByCheckIn.get(r.checkInId)!.push(r);
  }

  for (const ci of userCheckIns) {
    const ciResponses = responsesByCheckIn.get(ci.id) || [];
    const pillarSums: Record<string, { sum: number; weight: number }> = {};

    for (const r of ciResponses) {
      if (r.normalizedScore == null) continue;
      const q = questionMap.get(r.questionId);
      if (!q) continue;
      if (!pillarSums[q.pillar]) pillarSums[q.pillar] = { sum: 0, weight: 0 };
      pillarSums[q.pillar].sum += r.normalizedScore * (q.impactWeight ?? 1);
      pillarSums[q.pillar].weight += q.impactWeight ?? 1;
    }

    const dateStr = ci.createdAt.toISOString().split("T")[0];
    for (const [pillar, data] of Object.entries(pillarSums)) {
      if (data.weight > 0) {
        pillarTimelines[pillar].push({
          date: dateStr,
          value: Math.round((data.sum / data.weight) * 10) / 10,
        });
      }
    }
  }

  const pillarAverages = ALL_PILLARS.map((pillar) => {
    const timeline = pillarTimelines[pillar];
    const avg = timeline.length > 0 ? Math.round((timeline.reduce((s, t) => s + t.value, 0) / timeline.length) * 10) / 10 : 0;
    return {
      pillar,
      score: avg,
      trend: "stable" as const,
      previousScore: null,
      favorability: 0,
      responseCount: timeline.length,
      respondentCount: 1,
      status: (avg <= 0 ? "insufficient" : avg >= 75 ? "green" : avg >= 50 ? "yellow" : "red") as "green" | "yellow" | "red" | "insufficient",
    };
  });

  const textResponses = allResponses.filter((r) => r.textValue && r.textValue.trim() !== "");
  const recentReflections = textResponses.slice(-10).map((r) => {
    const q = questionMap.get(r.questionId);
    const ciDate = ciDateMap.get(r.checkInId) || "";
    return {
      id: r.id,
      questionText: q?.questionText ?? "",
      response: r.textValue!,
      pillar: q?.pillar ?? "",
      date: ciDate + "T00:00:00.000Z",
    };
  });

  const LIKERT_LABELS: Record<number, string> = { 1: "Strongly Disagree", 2: "Disagree", 3: "Neutral", 4: "Agree", 5: "Strongly Agree" };
  const recentCheckInsWithResponses = userCheckIns.slice(-10).reverse().map((ci) => {
    const ciResponses = responsesByCheckIn.get(ci.id) || [];
    return {
      id: ci.id,
      date: ci.createdAt.toISOString(),
      responses: ciResponses.map((r) => {
        const q = questionMap.get(r.questionId);
        let displayValue = "";
        if (r.numericValue != null && q?.inputType === "likert_5") {
          displayValue = LIKERT_LABELS[r.numericValue] || String(r.numericValue);
        } else if (r.numericValue != null) {
          displayValue = `${r.numericValue}/5`;
        } else if (r.trafficLight) {
          displayValue = r.trafficLight;
        } else if (r.emojiValue) {
          displayValue = r.emojiValue;
        } else if (r.textValue) {
          displayValue = r.textValue;
        } else if (r.selectedOptions && Array.isArray(r.selectedOptions)) {
          displayValue = r.selectedOptions.join(", ");
        }
        return {
          questionText: q?.questionText ?? "",
          pillar: q?.pillar ?? "",
          inputType: q?.inputType ?? "",
          numericValue: r.numericValue,
          normalizedScore: r.normalizedScore,
          displayValue,
        };
      }).filter((r) => r.displayValue !== ""),
    };
  });

  res.json({
    totalCheckIns,
    currentStreak,
    pillarTimelines,
    pillarAverages,
    recentReflections,
    checkInHistory: recentCheckInsWithResponses,
  });
});

router.get("/team-summary", requireLeadOrDirector, async (req, res): Promise<void> => {
  const teamId = req.user!.teamId!;
  const days = parseInt(req.query.days as string) || 90;
  const subTeamIdParam = req.query.subTeamId ? parseInt(req.query.subTeamId as string, 10) : undefined;

  if (subTeamIdParam) {
    const { subTeamsTable } = await import("@workspace/db");
    const [st] = await db.select().from(subTeamsTable).where(eq(subTeamsTable.id, subTeamIdParam));
    if (!st || st.teamId !== teamId) {
      res.status(404).json({ error: "Sub-team not found" });
      return;
    }
  }

  const allMembers = await db.select().from(usersTable).where(eq(usersTable.teamId, teamId));
  const allMemberIds = allMembers.map((m) => m.id);

  let subTeamUserIds: number[] | undefined;
  if (subTeamIdParam) {
    const stMembers = await db.select({ userId: userSubTeamsTable.userId }).from(userSubTeamsTable).where(eq(userSubTeamsTable.subTeamId, subTeamIdParam));
    subTeamUserIds = stMembers.map((m) => m.userId).filter((id) => allMemberIds.includes(id));
  }

  const pillarScores = await computePillarScores(days, teamId, subTeamUserIds);
  const validPillars = pillarScores.filter((p) => p.status !== "insufficient");
  const compositeScore = computeComposite(validPillars);

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - days);

  const memberIds = subTeamUserIds ? subTeamUserIds : allMemberIds;
  const filteredMemberCount = subTeamUserIds ? subTeamUserIds.length : allMembers.length;

  const completedCheckIns = await db
    .select()
    .from(checkInsTable)
    .where(
      and(
        gte(checkInsTable.createdAt, windowStart),
        eq(checkInsTable.status, "completed"),
        inArray(checkInsTable.userId, memberIds.length > 0 ? memberIds : [0])
      )
    );

  const uniqueRespondents = new Set(completedCheckIns.map((c) => c.userId));
  const participationRate = filteredMemberCount > 0 ? Math.round((uniqueRespondents.size / filteredMemberCount) * 100) : 0;

  // Weekly trend as a single SQL aggregate. Previously this loop ran
  // one responses query per week (13 queries for a 90-day window).
  const scopedUserIds = memberIds.length > 0 ? memberIds : [0];
  const trendRows = await db.execute<{ week: string; avg: number }>(sql`
    SELECT
      to_char(date_trunc('week', c.created_at), 'YYYY-MM-DD') AS week,
      AVG(r.normalized_score)::float AS avg
    FROM check_ins c
    JOIN responses r ON r.check_in_id = c.id
    WHERE c.status = 'completed'
      AND c.created_at >= ${windowStart}
      AND c.user_id = ANY(${scopedUserIds}::int[])
      AND r.normalized_score IS NOT NULL
    GROUP BY week
    ORDER BY week ASC
  `);
  const trendChart = (trendRows.rows as Array<{ week: string; avg: number }>).map((row) => ({
    date: row.week,
    value: Math.round((row.avg ?? 0) * 10) / 10,
  }));

  const sorted = [...validPillars].sort((a, b) => b.score - a.score);
  const topStrengths = sorted.slice(0, 2).map((p) => `${PILLAR_LABELS[p.pillar] || p.pillar}: ${p.score.toFixed(0)}%`);
  const areasForGrowth = sorted.slice(-2).reverse().map((p) => `${PILLAR_LABELS[p.pillar] || p.pillar}: ${p.score.toFixed(0)}%`);

  const alerts: { pillar: string; type: string; message: string }[] = [];
  for (const ps of pillarScores) {
    if (ps.status === "red") {
      alerts.push({
        pillar: ps.pillar,
        type: "critical",
        message: `${PILLAR_LABELS[ps.pillar] || ps.pillar} score is critically low at ${ps.score.toFixed(0)}%`,
      });
    }
    if (ps.trend === "down" && ps.previousScore != null) {
      alerts.push({
        pillar: ps.pillar,
        type: "decline",
        message: `${PILLAR_LABELS[ps.pillar] || ps.pillar} dropped from ${ps.previousScore.toFixed(0)}% to ${ps.score.toFixed(0)}%`,
      });
    }
  }

  res.json({
    compositeScore,
    participationRate,
    respondentCount: uniqueRespondents.size,
    pillarScores,
    trendChart,
    topStrengths,
    areasForGrowth,
    alerts,
  });
});

export default router;
