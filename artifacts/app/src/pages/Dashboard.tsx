import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BiSolidHappy, BiSolidRightArrow, BiSolidShield, BiSolidZap, BiSolidTime, BiSolidGroup,
  BiSolidBarChartAlt2, BiSolidError, BiSolidCheckCircle, BiSolidUpArrowAlt, BiSolidChevronDown, BiSolidLayer
} from "react-icons/bi";
import { format, formatDistanceToNow } from "date-fns";
import { cn, scoreColor } from "@/lib/utils";
import { getPillarLabel, getPillarIcon } from "@/components/ui/dimension-badge";
import { useRole } from "@/context/RoleContext";
import { apiFetch } from "@/lib/api";
import type { DashboardData, PillarScore } from "@workspace/api-client-react";
import { DesignOpsWidgets } from "@/components/design-ops/DesignOpsWidgets";

interface SubTeam {
  id: number;
  name: string;
  color: string;
  memberCount: number;
}

const STATUS_BG = {
  green: "bg-card border-[#dddee1] dark:border-[#2a3040]",
  yellow: "bg-card border-[#dddee1] dark:border-[#2a3040]",
  red: "bg-card border-[#dddee1] dark:border-[#2a3040]",
  insufficient: "bg-card border-[#dddee1] dark:border-[#2a3040]",
};

const STATUS_TEXT = {
  green: "text-emerald-600 dark:text-emerald-400",
  yellow: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  insufficient: "text-muted-foreground",
};

type ExtendedDashboardData = DashboardData & {
  personalPillarScores: PillarScore[] | null;
  personalCompositeScore: number | null;
  lastCheckInDate: string | null;
  bestZone: { pillar: string; score: number; status: string } | null;
  worstZone: { pillar: string; score: number; status: string } | null;
};

function SubTeamFilter({ subTeams, selected, onChange }: { subTeams: SubTeam[]; selected: number | null; onChange: (id: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const current = subTeams.find((st) => st.id === selected);

  if (subTeams.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
          selected
            ? "border-primary/30 bg-primary/5 text-primary"
            : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
        )}
      >
        <BiSolidLayer className="w-4 h-4" />
        {current ? current.name : "All Teams"}
        <BiSolidChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-[160px]">
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                !selected ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              All Teams
            </button>
            {subTeams.map((st) => (
              <button
                key={st.id}
                onClick={() => { onChange(st.id); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                  selected === st.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                )}
              >
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: st.color }} />
                {st.name}
                <span className="text-xs text-muted-foreground/60 ml-auto">{st.memberCount}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { userId, role } = useRole();
  const [subTeamFilter, setSubTeamFilter] = useState<number | null>(null);

  const isLeadView = role === "lead" || role === "director";

  const apiParams: Record<string, string | number> = {};
  if (subTeamFilter && isLeadView) {
    apiParams.subTeamId = subTeamFilter;
  }

  const { data, isLoading, error } = useQuery<ExtendedDashboardData>({
    queryKey: ["dashboard", userId, subTeamFilter],
    queryFn: () => apiFetch<ExtendedDashboardData>("/api/dashboard", apiParams),
  });

  const { data: subTeams = [] } = useQuery<SubTeam[]>({
    queryKey: ["sub-teams"],
    queryFn: () => apiFetch<SubTeam[]>("/api/sub-teams"),
    enabled: isLeadView,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="p-8 text-center bg-destructive/10 rounded-2xl border border-destructive/20 text-destructive">
          <h2 className="text-xl font-medium mb-2">Failed to load dashboard</h2>
          <p>Could not connect to the server. Please try again later.</p>
        </div>
      </AppLayout>
    );
  }

  const isLead = data.userRole === "lead" || data.userRole === "director";
  const isLeadEmpty = isLead && data.compositeScore === 0 && data.completionRate === 0;

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isLeadEmpty ? (
          <>
            {subTeamFilter && subTeams.length > 0 && (
              <div className="flex items-center gap-3">
                <SubTeamFilter subTeams={subTeams} selected={subTeamFilter} onChange={setSubTeamFilter} />
              </div>
            )}
            <EmptyState isLead={true} subTeamFilter={subTeamFilter} />
          </>
        ) : isLead ? (
          <>
            <LeadDashboard data={data} subTeams={subTeams} subTeamFilter={subTeamFilter} onSubTeamChange={setSubTeamFilter} />
            <DesignOpsWidgets />
          </>
        ) : (
          <TeammateDashboard data={data} />
        )}
      </div>
    </AppLayout>
  );
}

function EmptyState({ isLead, subTeamFilter }: { isLead: boolean; subTeamFilter?: number | null }) {
  return (
    <>
      <section className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
          {isLead ? "Team Pulse" : "Your Pulse"}
        </h1>
        <p className="text-lg text-muted-foreground">
          {isLead
            ? "Anonymized team health overview across 8 pillars."
            : "Track your personal check-in history and team health."}
        </p>
      </section>
      <Card className="overflow-hidden">
        <div className="p-10 md:p-14 text-center space-y-6">
          <div className="text-6xl">🚀</div>
          <div className="space-y-3 max-w-lg mx-auto">
            <h2 className="text-2xl font-medium text-foreground">
              {subTeamFilter ? "No pulse data yet" : "Ready to take your first pulse?"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {subTeamFilter
                ? "No pulse data yet for this sub-team. Try switching to All Teams or wait for team members to complete their checks."
                : "It only takes 2 minutes to share how you're feeling across 8 key dimensions. Your answers stay private — only aggregated, anonymized scores are ever shared with the team."}
            </p>
          </div>
          {!subTeamFilter && (
            <Link href="/check-in">
              <Button size="lg" className="font-medium px-8 shadow-lg shadow-primary/20">
                Let's Go <BiSolidRightArrow className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
      </Card>
    </>
  );
}

function TeammateDashboard({ data }: { data: ExtendedDashboardData }) {
  const personal = data.personalPillarScores;
  const validPersonal = personal?.filter((p) => p.status !== "insufficient") ?? [];
  const compositeScore = data.personalCompositeScore ?? 0;

  const thriving = validPersonal.filter((p) => p.status === "green").sort((a, b) => b.score - a.score);
  const attention = validPersonal.filter((p) => p.status === "red" || p.status === "yellow").sort((a, b) => a.score - b.score);
  const hasData = validPersonal.length > 0;

  return (
    <>
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
            Your Pulse
          </h1>
          <p className="text-lg text-muted-foreground">
            {hasData
              ? "Here's how you're doing across your health pillars."
              : "Complete a pulse check to see your personal insights."}
          </p>
        </div>
        <Link href="/check-in">
          <Button size="lg" className="w-full md:w-auto font-medium shadow-xl shadow-primary/20">
            {hasData ? "New Pulse Check" : "Start Pulse Check"} <BiSolidRightArrow className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </section>
      {!hasData ? (
        <Card className="overflow-hidden">
          <div className="p-10 md:p-14 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <BiSolidZap className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-3 max-w-lg mx-auto">
              <h2 className="text-2xl font-medium text-foreground">No pulse data yet</h2>
              <p className="text-muted-foreground leading-relaxed">
                Take your first pulse check to see your personal health zones here. It takes under 3 minutes.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {data.lastCheckInDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BiSolidTime className="w-4 h-4" />
              Last check-in {formatDistanceToNow(new Date(data.lastCheckInDate), { addSuffix: true })}
            </div>
          )}

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/10 text-sm font-medium text-primary">
                    <BiSolidHappy className="w-4 h-4" />
                    Your Health Score
                  </div>
                  <h2 className="text-2xl font-medium text-foreground">
                    Overall well-being: <span className={scoreColor(compositeScore)}>{Math.round(compositeScore)}%</span>
                  </h2>
                </div>
                <div className="text-center flex-shrink-0">
                  <div className={cn("text-6xl font-medium", scoreColor(compositeScore))}>{Math.round(compositeScore)}</div>
                  <div className="text-sm font-medium mt-1 text-muted-foreground">out of 100</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {attention.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <BiSolidError className="w-5 h-5" />
                    Needs Attention
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {attention.map((ps) => (
                    <ZoneItem key={ps.pillar} ps={ps} variant="tension" />
                  ))}
                </CardContent>
              </Card>
            )}

            {thriving.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <BiSolidCheckCircle className="w-5 h-5" />
                    Thriving
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {thriving.map((ps) => (
                    <ZoneItem key={ps.pillar} ps={ps} variant="healthy" />
                  ))}
                </CardContent>
              </Card>
            )}

            {attention.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center space-y-2">
                  <BiSolidStar className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="font-medium text-foreground">All zones healthy</p>
                  <p className="text-sm text-muted-foreground">No areas need immediate attention.</p>
                </CardContent>
              </Card>
            )}
          </div>

          <section>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-muted-foreground">
              <BiSolidBarChartAlt2 className="w-5 h-5" />
              All Pillars
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(personal ?? []).map((ps) => (
                <MiniPillarCard key={ps.pillar} ps={ps} />
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/my-journey">
              <Card className="group hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BiSolidZap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">My Journey</p>
                    <p className="text-sm text-muted-foreground">View your check-in history</p>
                  </div>
                  <BiSolidUpArrowAlt className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/team-insights">
              <Card className="group hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BiSolidGroup className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Team Vibe</p>
                    <p className="text-sm text-muted-foreground">See how the team is doing</p>
                  </div>
                  <BiSolidUpArrowAlt className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </>
      )}
    </>
  );
}

function LeadDashboard({ data, subTeams, subTeamFilter, onSubTeamChange }: { data: ExtendedDashboardData; subTeams: SubTeam[]; subTeamFilter: number | null; onSubTeamChange: (id: number | null) => void }) {
  const validPillars = data.pillarScores.filter((p) => p.status !== "insufficient");
  const hasData = validPillars.length > 0;

  const thriving = validPillars.filter((p) => p.status === "green").sort((a, b) => b.score - a.score);
  const attention = validPillars.filter((p) => p.status === "red" || p.status === "yellow").sort((a, b) => a.score - b.score);

  const activeSubTeam = subTeams.find((st) => st.id === subTeamFilter);

  return (
    <>
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
            {activeSubTeam ? activeSubTeam.name : data.teamName} Pulse
          </h1>
          <p className="text-lg text-muted-foreground">
            {activeSubTeam
              ? `Filtered view · ${activeSubTeam.memberCount} member${activeSubTeam.memberCount !== 1 ? "s" : ""}`
              : "Anonymized team health overview across 8 pillars."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SubTeamFilter subTeams={subTeams} selected={subTeamFilter} onChange={onSubTeamChange} />
          <Link href="/check-in">
            <Button size="lg" className="w-full md:w-auto font-medium shadow-xl shadow-primary/20">
              Start Pulse Check <BiSolidRightArrow className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Card>
        <CardContent className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/10 text-sm font-medium text-primary">
                <BiSolidHappy className="w-4 h-4" />
                Composite Health Score
              </div>
              <h2 className="text-2xl md:text-3xl font-medium leading-tight text-foreground">
                Team health is at <span className={scoreColor(data.compositeScore)}>{Math.round(data.compositeScore)}%</span>
              </h2>
              <div className="w-full max-w-md pt-2">
                <div className="flex justify-between text-sm mb-2 font-medium text-muted-foreground">
                  <span>Participation: {data.completionRate}%</span>
                  <span>{data.memberCount} members</span>
                </div>
                <Progress value={data.completionRate} className="h-3 bg-primary/10" indicatorClassName="bg-primary" />
              </div>
            </div>
            <div className="text-center">
              <div className={cn("text-7xl font-medium", scoreColor(data.compositeScore))}>{Math.round(data.compositeScore)}</div>
              <div className="text-sm font-medium text-muted-foreground mt-1">out of 100</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {attention.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BiSolidError className="w-5 h-5" />
                  Team Tension Zones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {attention.map((ps) => (
                  <ZoneItem key={ps.pillar} ps={ps} variant="tension" meta={`${ps.respondentCount} respondents`} />
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center space-y-2">
                <BiSolidStar className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="font-medium text-foreground">No tension zones</p>
                <p className="text-sm text-muted-foreground">All team pillars are in the green across the board.</p>
              </CardContent>
            </Card>
          )}

          {thriving.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BiSolidCheckCircle className="w-5 h-5" />
                  Team Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {thriving.map((ps) => (
                  <ZoneItem key={ps.pillar} ps={ps} variant="healthy" meta={`${ps.favorability}% favorable`} />
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center space-y-2">
                <BiSolidError className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="font-medium text-foreground">No pillars in green yet</p>
                <p className="text-sm text-muted-foreground">Scores need to reach 75%+ to appear here.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <section>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-muted-foreground">
          <BiSolidBarChartAlt2 className="w-5 h-5" />
          All Pillars
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.pillarScores.map((ps) => (
            <LeadPillarCard key={ps.pillar} ps={ps} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BiSolidShield className="w-5 h-5" />
              Anonymity & Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              All scores are aggregated from {validPillars[0]?.respondentCount ?? 3}+ respondents.
              Individual responses are never visible. Pillar scores use weighted averages
              across a 90-day rolling window.
            </p>
            <Link href="/team-insights">
              <Button variant="outline" className="w-full">
                View Detailed Team Summary <BiSolidRightArrow className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity yet.</p>
              ) : (
                data.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-secondary-foreground text-sm font-medium">
                      {activity.userName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        <span className="text-foreground">{activity.userName}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ZoneItem({ ps, variant, meta }: { ps: PillarScore; variant: "tension" | "healthy"; meta?: string }) {
  const ZIcon = getPillarIcon(ps.pillar);
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <ZIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <p className="font-medium text-foreground text-sm">{getPillarLabel(ps.pillar)}</p>
          {meta && <span className="text-xs text-muted-foreground">· {meta}</span>}
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-primary/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-primary"
            style={{ width: `${Math.max(ps.score, 3)}%` }}
          />
        </div>
      </div>
      <span className={cn("text-lg font-medium tabular-nums w-12 text-right flex-shrink-0", scoreColor(ps.score))}>
        {Math.round(ps.score)}%
      </span>
    </div>
  );
}

function MiniPillarCard({ ps }: { ps: PillarScore }) {
  const MIcon = getPillarIcon(ps.pillar);
  if (ps.status === "insufficient") {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
        <MIcon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
        <p className="text-xs text-muted-foreground">{getPillarLabel(ps.pillar)}</p>
        <p className="text-sm text-muted-foreground mt-1">—</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border p-4 text-center transition-all",
      STATUS_BG[ps.status as keyof typeof STATUS_BG] || STATUS_BG.insufficient
    )}>
      <MIcon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
      <p className={cn(
        "text-2xl font-medium tabular-nums",
        STATUS_TEXT[ps.status as keyof typeof STATUS_TEXT] || STATUS_TEXT.insufficient
      )}>
        {Math.round(ps.score)}%
      </p>
      <p className="text-xs text-muted-foreground mt-1">{getPillarLabel(ps.pillar)}</p>
    </div>
  );
}

function LeadPillarCard({ ps }: { ps: PillarScore }) {
  const LIcon = getPillarIcon(ps.pillar);
  if (ps.status === "insufficient") {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
        <LIcon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
        <p className="text-xs text-muted-foreground">{getPillarLabel(ps.pillar)}</p>
        <p className="text-sm text-muted-foreground mt-1">Insufficient data</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border p-4 text-center transition-all",
      STATUS_BG[ps.status as keyof typeof STATUS_BG] || STATUS_BG.insufficient
    )}>
      <LIcon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
      <p className={cn(
        "text-2xl font-medium tabular-nums",
        STATUS_TEXT[ps.status as keyof typeof STATUS_TEXT] || STATUS_TEXT.insufficient
      )}>
        {Math.round(ps.score)}%
      </p>
      <p className="text-xs text-muted-foreground mt-1">{getPillarLabel(ps.pillar)}</p>
      <p className="text-xs text-muted-foreground">{ps.respondentCount} respondents</p>
    </div>
  );
}
