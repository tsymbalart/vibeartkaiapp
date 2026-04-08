import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BiTrendingUp } from "react-icons/bi";

import { apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthBadge } from "@/components/design-ops/HealthBadge";
import { HealthGauge, LevelBar } from "@/components/design-ops/HealthGauge";
import { RiskLevelBadge, OppLevelBadge } from "@/components/design-ops/ScoreSelector";
import { computeRiskScore, computeOpportunityScore } from "@workspace/scoring";

interface ProjectEnriched {
  id: number;
  name: string;
  latestHealth: { healthScore: number; overallHealth: "green" | "yellow" | "red" } | null;
}

interface PersonEnriched {
  id: number;
  name: string;
  latestHealth: { healthScore: number; overallHealth: "green" | "yellow" | "red" } | null;
}

interface RegisterItem {
  id: number;
  type: "risk" | "opportunity";
  linkedTo: "project" | "user";
  projectId: number | null;
  userId: number | null;
  title: string;
  status: string;
  impact: number | null;
  probability: number | null;
  confidence: number | null;
  value: number | null;
}

interface DesignOpsDashboardData {
  projects: ProjectEnriched[];
  people: PersonEnriched[];
  registerItems: RegisterItem[];
}

function countHealth<T extends { latestHealth: { overallHealth: string } | null }>(items: T[]) {
  const counts = { green: 0, yellow: 0, red: 0, none: 0 };
  for (const item of items) {
    const h = item.latestHealth?.overallHealth;
    if (h === "green") counts.green++;
    else if (h === "yellow") counts.yellow++;
    else if (h === "red") counts.red++;
    else counts.none++;
  }
  return counts;
}

function countLevels(items: { computedLevel: string }[]) {
  const counts = { high: 0, medium: 0, low: 0 };
  for (const item of items) {
    const l = item.computedLevel;
    if (l === "high") counts.high++;
    else if (l === "medium") counts.medium++;
    else counts.low++;
  }
  return counts;
}

export function DesignOpsWidgets() {
  const { data, isLoading } = useQuery<DesignOpsDashboardData>({
    queryKey: ["/api/design-ops/dashboard"],
    queryFn: () => apiFetch<DesignOpsDashboardData>("/api/design-ops/dashboard"),
  });

  const projects = data?.projects ?? [];
  const people = data?.people ?? [];
  const allRegisterItems = data?.registerItems ?? [];

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const personMap = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const projectCounts = useMemo(() => countHealth(projects), [projects]);
  const peopleCounts = useMemo(() => countHealth(people), [people]);

  const allRisks = useMemo(
    () =>
      allRegisterItems
        .filter((i) => i.type === "risk")
        .map((r) => {
          const computed =
            r.probability != null && r.impact != null
              ? computeRiskScore(r.probability, r.impact)
              : { score: 0, level: "low" as const };
          return {
            ...r,
            sourceName:
              r.linkedTo === "project"
                ? projectMap.get(r.projectId ?? -1)?.name || "Unknown"
                : personMap.get(r.userId ?? -1)?.name || "Unknown",
            computedScore: computed.score,
            computedLevel: computed.level as string,
          };
        })
        .sort((a, b) => b.computedScore - a.computedScore),
    [allRegisterItems, projectMap, personMap]
  );

  const allOpps = useMemo(
    () =>
      allRegisterItems
        .filter((i) => i.type === "opportunity")
        .map((o) => {
          const computed =
            o.confidence != null && o.value != null
              ? computeOpportunityScore(o.confidence, o.value)
              : { score: 0, level: "low" as const };
          return {
            ...o,
            sourceName:
              o.linkedTo === "project"
                ? projectMap.get(o.projectId ?? -1)?.name || "Unknown"
                : personMap.get(o.userId ?? -1)?.name || "Unknown",
            computedScore: computed.score,
            computedLevel: computed.level as string,
          };
        })
        .sort((a, b) => b.computedScore - a.computedScore),
    [allRegisterItems, projectMap, personMap]
  );

  const riskLevels = useMemo(() => countLevels(allRisks), [allRisks]);
  const oppLevels = useMemo(() => countLevels(allOpps), [allOpps]);

  const worstProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => (a.latestHealth?.healthScore ?? 99) - (b.latestHealth?.healthScore ?? 99))
        .slice(0, 5),
    [projects]
  );

  const worstPeople = useMemo(
    () =>
      [...people]
        .sort((a, b) => (a.latestHealth?.healthScore ?? 99) - (b.latestHealth?.healthScore ?? 99))
        .slice(0, 5),
    [people]
  );

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-medium tracking-tight text-muted-foreground flex items-center gap-2">
          <BiTrendingUp className="w-5 h-5" />
          Design Ops
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium tracking-tight text-muted-foreground flex items-center gap-2">
        <BiTrendingUp className="w-5 h-5" />
        Design Ops
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        <section
          className="bg-card border border-border shadow-sm rounded-2xl p-4"
          aria-labelledby="projects-heading"
        >
          <h3 id="projects-heading" className="sr-only">
            Projects health
          </h3>
          <div className="bg-secondary/40 border border-border rounded-2xl px-3 py-2.5 mb-2.5">
            <HealthGauge total={projects.length} counts={projectCounts} label="projects" />
          </div>
          {projects.length > 0 ? (
            <div>
              {worstProjects.map((p) => (
                <Link
                  href={`/projects/${p.id}`}
                  key={p.id}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-sm px-1 -mx-1 block transition-colors"
                >
                  <div
                    className="flex items-center justify-between gap-2 py-3 border-b border-border last:border-b-0"
                    style={{ minHeight: "48px" }}
                  >
                    <span className="text-[15px] font-medium text-foreground truncate leading-relaxed">
                      {p.name}
                    </span>
                    <HealthBadge status={p.latestHealth?.overallHealth} />
                  </div>
                </Link>
              ))}
              <Link
                href="/projects"
                className="block py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View all projects →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-3">No projects yet</p>
          )}
        </section>

        <section
          className="bg-card border border-border shadow-sm rounded-2xl p-4"
          aria-labelledby="team-heading"
        >
          <h3 id="team-heading" className="sr-only">
            Team health
          </h3>
          <div className="bg-secondary/40 border border-border rounded-2xl px-3 py-2.5 mb-2.5">
            <HealthGauge total={people.length} counts={peopleCounts} label="people" />
          </div>
          {people.length > 0 ? (
            <div>
              {worstPeople.map((p) => (
                <Link
                  href={`/design-team/${p.id}`}
                  key={p.id}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-sm px-1 -mx-1 block transition-colors"
                >
                  <div
                    className="flex items-center justify-between gap-2 py-3 border-b border-border last:border-b-0"
                    style={{ minHeight: "48px" }}
                  >
                    <span className="text-[15px] font-medium text-foreground truncate leading-relaxed">
                      {p.name}
                    </span>
                    <HealthBadge status={p.latestHealth?.overallHealth} />
                  </div>
                </Link>
              ))}
              <Link
                href="/design-team"
                className="block py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View all team members →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-3">No team members tracked yet</p>
          )}
        </section>

        <section
          className="bg-card border border-border shadow-sm rounded-2xl p-4"
          aria-labelledby="risks-heading"
        >
          <h3 id="risks-heading" className="sr-only">
            Risks
          </h3>
          <div className="bg-secondary/40 border border-border rounded-2xl px-3 py-2.5 mb-2.5">
            <LevelBar total={allRisks.length} counts={riskLevels} label="risks" variant="risk" />
          </div>
          {allRisks.length > 0 ? (
            <div>
              {allRisks.slice(0, 4).map((r) => {
                const href =
                  r.linkedTo === "project"
                    ? `/projects/${r.projectId}?item=${r.id}`
                    : `/design-team/${r.userId}?item=${r.id}`;
                return (
                  <Link
                    href={href}
                    key={r.id}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-sm px-1 -mx-1 block transition-colors"
                  >
                    <div
                      className="flex items-center justify-between gap-2 py-3 border-b border-border last:border-b-0"
                      style={{ minHeight: "48px" }}
                    >
                      <span className="text-[15px] font-medium text-foreground truncate leading-relaxed">
                        {r.title}
                      </span>
                      <RiskLevelBadge level={r.computedLevel} />
                    </div>
                  </Link>
                );
              })}
              <Link
                href="/operational-tasks"
                className="block py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View all risks →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-3">No active risks</p>
          )}
        </section>

        <section
          className="bg-card border border-border shadow-sm rounded-2xl p-4"
          aria-labelledby="opportunities-heading"
        >
          <h3 id="opportunities-heading" className="sr-only">
            Opportunities
          </h3>
          <div className="bg-secondary/40 border border-border rounded-2xl px-3 py-2.5 mb-2.5">
            <LevelBar
              total={allOpps.length}
              counts={oppLevels}
              label="opportunities"
              variant="opportunity"
            />
          </div>
          {allOpps.length > 0 ? (
            <div>
              {allOpps.slice(0, 4).map((o) => {
                const href =
                  o.linkedTo === "project"
                    ? `/projects/${o.projectId}?item=${o.id}`
                    : `/design-team/${o.userId}?item=${o.id}`;
                return (
                  <Link
                    href={href}
                    key={o.id}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-sm px-1 -mx-1 block transition-colors"
                  >
                    <div
                      className="flex items-center justify-between gap-2 py-3 border-b border-border last:border-b-0"
                      style={{ minHeight: "48px" }}
                    >
                      <span className="text-[15px] font-medium text-foreground truncate leading-relaxed">
                        {o.title}
                      </span>
                      <OppLevelBadge level={o.computedLevel} />
                    </div>
                  </Link>
                );
              })}
              <Link
                href="/operational-tasks"
                className="block py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View all opportunities →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-3">No active opportunities</p>
          )}
        </section>
      </div>
    </section>
  );
}
