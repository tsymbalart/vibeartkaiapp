import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from "recharts";
import { BiSolidUpArrowAlt, BiSolidDownArrowAlt, BiMinus, BiSolidBolt, BiSolidBullseye, BiSolidShield, BiSolidError, BiSolidHeart, BiTrendingUp, BiSolidRightArrow, BiSolidMessageSquareDetail, BiSolidLayer, BiSolidChevronDown, BiSolidCompass, BiSolidGroup } from "react-icons/bi";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn, scoreColor } from "@/lib/utils";
import { getPillarLabel, getPillarColor, getPillarIcon } from "@/components/ui/dimension-badge";
import { format } from "date-fns";
import { useRole } from "@/context/RoleContext";
import { apiFetch } from "@/lib/api";

interface SubTeam {
  id: number;
  name: string;
  color: string;
  memberCount: number;
}

const STATUS_BG = {
  green: "bg-secondary text-foreground",
  yellow: "bg-secondary text-foreground",
  red: "bg-secondary text-foreground",
  insufficient: "bg-secondary text-muted-foreground",
};

const STATUS_EMOJI: Record<string, string> = {
  green: "Thriving",
  yellow: "Steady",
  red: "Needs Love",
  insufficient: "Not enough data",
};

type TeamSummaryData = {
  compositeScore: number;
  participationRate: number;
  respondentCount: number;
  pillarScores: {
    pillar: string;
    score: number;
    trend: string;
    previousScore: number | null;
    favorability: number;
    responseCount: number;
    respondentCount: number;
    status: string;
  }[];
  trendChart: { date: string; value: number }[];
  topStrengths: string[];
  areasForGrowth: string[];
  alerts: { pillar: string; type: string; message: string }[];
};

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <BiSolidUpArrowAlt className="w-4 h-4 text-muted-foreground" />;
  if (trend === "down") return <BiSolidDownArrowAlt className="w-4 h-4 text-muted-foreground" />;
  return <BiMinus className="w-4 h-4 text-muted-foreground" />;
}

function TeammateSummary({ data }: { data: TeamSummaryData }) {
  const validPillars = data.pillarScores.filter((p) => p.status !== "insufficient");
  const isEmpty = data.respondentCount === 0;
  const vibeLevel = data.compositeScore >= 75 ? "great" : data.compositeScore >= 60 ? "good" : data.compositeScore >= 50 ? "okay" : "tough";
  const vibeMessages: Record<string, { emoji: string; headline: string; body: string }> = {
    great: { emoji: "🌟", headline: "Team's feeling great!", body: "Your team's energy and health scores are strong across the board. Keep up the good work together." },
    good: { emoji: "💪", headline: "Team's doing well", body: "Most areas are looking healthy. A few pillars could use some attention, but overall the vibe is positive." },
    okay: { emoji: "🌤️", headline: "Room to grow together", body: "The team is in a steady place. There are some areas where collective focus could make a real difference." },
    tough: { emoji: "🤝", headline: "Let's rally together", body: "Some areas need attention. Remember, surfacing challenges is the first step toward improvement." },
  };
  const vibe = vibeMessages[vibeLevel];

  if (isEmpty) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <header>
          <h1 className="text-3xl font-medium">Team Vibe</h1>
          <p className="text-muted-foreground mt-2">
            How the team is feeling overall. Scores are anonymized — no individual responses are shown.
          </p>
        </header>

        <Card className="overflow-hidden">
          <div className="p-10 md:p-14 text-center space-y-6">
            <div className="text-6xl">🫶</div>
            <div className="space-y-3 max-w-lg mx-auto">
              <h2 className="text-2xl font-medium text-foreground">Your team vibe is waiting</h2>
              <p className="text-muted-foreground leading-relaxed">
                Once enough teammates complete their pulse checks, you'll see how the team is doing
                across wellness, growth, collaboration, and more. Every voice counts — be one of the first!
              </p>
            </div>
            <Link href="/check-in">
              <Button size="lg" className="font-medium px-8 shadow-lg shadow-primary/20">
                Add My Voice <BiSolidMessageSquareDetail className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-medium">Team Vibe</h1>
        <p className="text-muted-foreground mt-2">
          How the team is feeling overall. Scores are anonymized — no individual responses are shown.
        </p>
      </header>

      <Card>
        <CardContent className="p-8 text-center space-y-3">
          <p className="text-5xl">{vibe.emoji}</p>
          <h2 className="text-2xl font-medium text-foreground">{vibe.headline}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{vibe.body}</p>
          <div className="flex justify-center gap-6 pt-4">
            <div className="text-center">
              <p className={cn("text-3xl font-medium", scoreColor(data.compositeScore))}>{Math.round(data.compositeScore)}%</p>
              <p className="text-xs text-muted-foreground font-medium">Team Health</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-medium text-foreground">{data.participationRate}%</p>
              <p className="text-xs text-muted-foreground font-medium">Participation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {data.pillarScores.map((ps) => {
          const statusLabel = STATUS_EMOJI[ps.status] || "—";
          const PillarIcon = getPillarIcon(ps.pillar);
          return (
            <Card key={ps.pillar} className="overflow-hidden">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <PillarIcon className="w-4 h-4 text-muted-foreground" />
                  <TrendIcon trend={ps.trend} />
                </div>
                <p className={cn("text-xl font-medium", ps.status === "insufficient" ? "text-muted-foreground" : scoreColor(ps.score))}>
                  {ps.status === "insufficient" ? "—" : `${Math.round(ps.score)}%`}
                </p>
                <p className="text-xs font-medium text-foreground">{getPillarLabel(ps.pillar)}</p>
                <p className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-lg inline-block",
                  STATUS_BG[ps.status as keyof typeof STATUS_BG] || STATUS_BG.insufficient
                )}>
                  {statusLabel}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground text-base">
              <BiSolidHeart className="w-5 h-5" /> Where We Shine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.topStrengths.map((str, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">✓</span>
                  {str}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground text-base">
              <BiTrendingUp className="w-5 h-5" /> Where We Can Grow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.areasForGrowth.map((area, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">→</span>
                  {area}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {data.trendChart.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Health Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trendChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(val) => format(new Date(val), "MMM d")}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    formatter={(value: number) => [`${Math.round(value)}%`, "Team Health"]}
                    labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                  />
                  <ReferenceLine y={75} stroke="hsl(160, 60%, 45%)" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 rounded-xl text-xs text-muted-foreground">
        <BiSolidGroup className="w-4 h-4 flex-shrink-0" />
        <p>
          Based on {data.respondentCount} teammates over the last 90 days. Minimum 3 responses required per pillar. Your individual answers are never shown to anyone.
        </p>
      </div>
    </div>
  );
}

function RadarChart({ pillars }: { pillars: TeamSummaryData["pillarScores"] }) {
  const size = 380;
  const center = size / 2;
  const radius = size / 2 - 55;
  const maxValue = 100;

  const getCoord = (value: number, index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    const dist = (value / maxValue) * radius;
    return { x: center + dist * Math.cos(angle), y: center + dist * Math.sin(angle) };
  };

  const ringValues = [25, 50, 75, 100];
  const pillarsForRadar = pillars.map((p) => ({
    ...p,
    displayScore: p.status === "insufficient" ? 0 : p.score,
  }));
  const n = pillarsForRadar.length;

  const polygonPath = pillarsForRadar
    .map((p, i) => {
      const pt = getCoord(p.displayScore, i, n);
      return `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`;
    })
    .join(" ") + " Z";

  return (
    <svg width={size} height={size} className="overflow-visible">
      {ringValues.map((val) => {
        const r = (val / maxValue) * radius;
        return (
          <circle
            key={val}
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            strokeDasharray="3 3"
            className="opacity-40"
          />
        );
      })}

      {pillarsForRadar.map((_, i) => {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            className="opacity-30"
          />
        );
      })}

      <path
        d={polygonPath}
        fill="hsl(var(--primary))"
        fillOpacity="0.1"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {pillarsForRadar.map((p, i) => {
        const pt = getCoord(p.displayScore, i, n);
        return (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={4}
            fill={getPillarColor(p.pillar)}
            stroke="white"
            strokeWidth="2"
          />
        );
      })}

      {pillarsForRadar.map((p, i) => {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
        const labelDist = radius + 35;
        const lx = center + labelDist * Math.cos(angle);
        const ly = center + labelDist * Math.sin(angle);
        const anchor = Math.abs(Math.cos(angle)) < 0.1 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
        return (
          <g key={i}>
            <text
              x={lx}
              y={ly - 6}
              textAnchor={anchor}
              fill="hsl(var(--foreground))"
              className="text-[11px] font-medium"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {getPillarLabel(p.pillar)}
            </text>
            <text
              x={lx}
              y={ly + 10}
              textAnchor={anchor}
              fill={p.status === "insufficient" ? "hsl(var(--muted-foreground))" : p.score >= 75 ? "#059669" : p.score >= 50 ? "#d97706" : "#dc2626"}
              className="text-[13px] font-medium"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {p.status === "insufficient" ? "—" : `${Math.round(p.score)}%`}
            </text>
          </g>
        );
      })}

      <text x={center} y={center - 8} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-[10px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        75% target
      </text>
    </svg>
  );
}

function LeadSummary({ data, subTeams, subTeamFilter, onSubTeamChange }: { data: TeamSummaryData; subTeams: SubTeam[]; subTeamFilter: number | null; onSubTeamChange: (id: number | null) => void }) {
  const validPillars = data.pillarScores.filter((p) => p.status !== "insufficient");
  const isEmpty = data.respondentCount === 0;

  const insights = useMemo(() => {
    const items: { icon: React.ReactNode; title: string; body: string }[] = [];
    if (data.topStrengths.length > 0) {
      items.push({
        icon: <BiTrendingUp className="w-5 h-5" />,
        title: "Top Strength",
        body: data.topStrengths[0],
      });
    }
    if (data.areasForGrowth.length > 0) {
      items.push({
        icon: <BiSolidError className="w-5 h-5" />,
        title: "Needs Attention",
        body: data.areasForGrowth[0],
      });
    }
    const upCount = data.pillarScores.filter((p) => p.trend === "up").length;
    const downCount = data.pillarScores.filter((p) => p.trend === "down").length;
    if (upCount > downCount) {
      items.push({
        icon: <BiSolidUpArrowAlt className="w-5 h-5" />,
        title: "Momentum",
        body: `${upCount} pillars trending up — team health is improving.`,
      });
    } else if (downCount > 0) {
      items.push({
        icon: <BiSolidDownArrowAlt className="w-5 h-5" />,
        title: "Watch Out",
        body: `${downCount} pillar${downCount > 1 ? "s" : ""} trending down — may need attention.`,
      });
    } else {
      items.push({
        icon: <BiMinus className="w-5 h-5" />,
        title: "Holding Steady",
        body: "Most pillars are stable — consistent performance across the board.",
      });
    }
    return items;
  }, [data]);

  if (isEmpty) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="space-y-4">
          <div>
            <h1 className="text-3xl font-medium">
              {subTeamFilter ? subTeams.find((st) => st.id === subTeamFilter)?.name ?? "Team" : "Team"} Summary
            </h1>
            <p className="text-muted-foreground mt-2">
              Anonymized team health scores. Individual responses are never shown.
            </p>
          </div>
          {subTeams.length > 0 && (
            <SubTeamFilter subTeams={subTeams} selected={subTeamFilter} onChange={onSubTeamChange} />
          )}
        </header>

        <Card className="overflow-hidden">
          <div className="p-10 md:p-14 text-center space-y-6">
            <div className="text-6xl">📊</div>
            <div className="space-y-3 max-w-lg mx-auto">
              <h2 className="text-2xl font-medium text-foreground">Insights unlock with your team</h2>
              <p className="text-muted-foreground leading-relaxed">
                {subTeamFilter
                  ? "No pulse data yet for this sub-team. Try switching to All Teams or wait for team members to complete their checks."
                  : "Once 3 or more teammates complete a pulse check, you'll see composite scores, pillar breakdowns, favorability rates, and trend analysis — all fully anonymized."}
              </p>
            </div>
            {!subTeamFilter && (
              <Link href="/check-in">
                <Button size="lg" className="font-medium px-8 shadow-lg shadow-primary/20">
                  Lead by Example <BiSolidRightArrow className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-medium">
            {subTeamFilter ? subTeams.find((st) => st.id === subTeamFilter)?.name ?? "Team" : "Team"} Summary
          </h1>
          <p className="text-muted-foreground mt-2">
            Anonymized team health scores. Individual responses are never shown.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SubTeamFilter subTeams={subTeams} selected={subTeamFilter} onChange={onSubTeamChange} />
          <div className="bg-card px-5 py-2.5 rounded-xl border shadow-sm flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground uppercase">Score</span>
            <span className={cn("text-xl font-medium flex items-center gap-1", scoreColor(data.compositeScore))}>
              {Math.round(data.compositeScore)}%
              {data.compositeScore >= 75 ? (
                <BiSolidUpArrowAlt className="w-4 h-4 text-muted-foreground" />
              ) : data.compositeScore < 50 ? (
                <BiSolidDownArrowAlt className="w-4 h-4 text-muted-foreground" />
              ) : null}
            </span>
          </div>
          <div className="bg-card px-5 py-2.5 rounded-xl border shadow-sm flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground uppercase">Participation</span>
            <span className="text-xl font-medium text-foreground">{data.participationRate}%</span>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-muted-foreground">
        <BiSolidShield className="w-5 h-5 flex-shrink-0" />
        <p>
          All scores require a minimum of 1 respondent. Data is aggregated from {data.respondentCount} respondents
          over 90 days. Individual responses are never visible to leads or directors.
        </p>
      </div>

      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm border",
                "bg-secondary border-border text-muted-foreground"
              )}
            >
              <BiSolidError className="w-5 h-5 flex-shrink-0" />
              <p>{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      <Card className="overflow-hidden">
        <CardContent className="p-8 flex flex-col items-center">
          <div className="text-center mb-4">
            <h2 className="text-lg font-medium text-foreground flex items-center justify-center gap-2">
              <BiSolidCompass className="w-5 h-5 text-primary" /> Team Health Compass
            </h2>
            <p className="text-sm text-muted-foreground">Visualizing team shape across 8 health pillars</p>
          </div>
          <RadarChart pillars={data.pillarScores} />
        </CardContent>
      </Card>

      <div className={cn("grid gap-4", insights.length === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2")}>
        {insights.map((item, i) => (
          <Card key={i} className="shadow-none">
            <CardContent className="p-4 flex gap-3 items-start">
              <div className="p-2 rounded-xl bg-secondary text-muted-foreground">
                {item.icon}
              </div>
              <div>
                <h4 className="font-medium text-sm text-foreground">{item.title}</h4>
                <p className="text-sm mt-1 text-muted-foreground">{item.body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BiSolidBolt className="w-5 h-5" /> Top Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.topStrengths.map((str, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-medium">
                  <span className="w-6 h-6 rounded-full bg-secondary text-foreground flex items-center justify-center flex-shrink-0 text-xs">
                    {i + 1}
                  </span>
                  {str}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BiSolidBullseye className="w-5 h-5" /> Areas for Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.areasForGrowth.map((area, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-medium">
                  <span className="w-6 h-6 rounded-full bg-secondary text-foreground flex items-center justify-center flex-shrink-0 text-xs">
                    {i + 1}
                  </span>
                  {area}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {data.pillarScores.map((ps) => {
          const PIcon = getPillarIcon(ps.pillar);
          return (
            <Card key={ps.pillar} className="text-center">
              <CardContent className="p-3">
                <PIcon className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                <div className={cn("inline-flex px-2 py-0.5 rounded-lg text-xs font-medium mb-1", ps.status === "insufficient" ? "text-muted-foreground" : scoreColor(ps.favorability))}>
                  {ps.status === "insufficient" ? "—" : `${Math.round(ps.favorability)}%`}
                </div>
                <p className="text-[10px] font-medium text-muted-foreground leading-tight mt-1">
                  {getPillarLabel(ps.pillar)}
                </p>
                <p className="text-[10px] text-muted-foreground">favorable</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data.trendChart.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Composite Health Trend
              <span className="text-sm font-normal text-muted-foreground bg-secondary/50 px-3 py-1 rounded-lg">
                Last 90 Days
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trendChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(val) => format(new Date(val), "MMM d")}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    formatter={(value: number) => [`${Math.round(value)}%`, "Health Score"]}
                    labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                  />
                  <ReferenceLine y={75} stroke="hsl(160, 60%, 45%)" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#trendGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

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

export default function TeamInsights() {
  const { role, userId } = useRole();
  const [subTeamFilter, setSubTeamFilter] = useState<number | null>(null);
  const isLeadView = role === "lead" || role === "director";

  const apiParams: Record<string, string | number> = { days: 90 };
  if (subTeamFilter && isLeadView) {
    apiParams.subTeamId = subTeamFilter;
  }

  const { data, isLoading, error } = useQuery<TeamSummaryData>({
    queryKey: ["team-summary", userId, subTeamFilter],
    queryFn: () => apiFetch<TeamSummaryData>("/api/team-summary", apiParams),
  });

  const { data: subTeams = [] } = useQuery<SubTeam[]>({
    queryKey: ["sub-teams"],
    queryFn: () => apiFetch<SubTeam[]>("/api/sub-teams"),
    enabled: isLeadView,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <p>Error loading data.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {isLeadView
        ? <LeadSummary data={data} subTeams={subTeams} subTeamFilter={subTeamFilter} onSubTeamChange={setSubTeamFilter} />
        : <TeammateSummary data={data} />
      }
    </AppLayout>
  );
}
