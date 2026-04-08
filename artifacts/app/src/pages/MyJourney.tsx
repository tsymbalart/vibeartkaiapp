import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DimensionBadge, getPillarLabel, getPillarColor, getPillarIcon } from "@/components/ui/dimension-badge";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { BiSolidAward, BiSolidFlame, BiSolidCalendar, BiSolidMessageRounded, BiSolidTime, BiSolidCheckCircle, BiSolidChevronDown, BiSolidChevronRight, BiSolidRightArrow } from "react-icons/bi";
import { cn, scoreColor } from "@/lib/utils";
import { useRole } from "@/context/RoleContext";
import { apiFetch } from "@/lib/api";
import type { CheckIn } from "@workspace/api-client-react";

const ALL_PILLARS = [
  "wellness", "alignment", "management", "growth",
  "design_courage", "collaboration", "recognition", "belonging",
];

type CheckInHistoryItem = {
  id: number;
  date: string;
  responses: {
    questionText: string;
    pillar: string;
    inputType: string;
    numericValue: number | null;
    normalizedScore: number | null;
    displayValue: string;
  }[];
};

type JourneyData = {
  totalCheckIns: number;
  currentStreak: number;
  pillarTimelines: Record<string, { date: string; value: number }[]>;
  pillarAverages: { pillar: string; score: number; status: string }[];
  recentReflections: { id: number; questionText: string; response: string; pillar: string; date: string }[];
  checkInHistory: CheckInHistoryItem[];
};

function ScoreDot({ score }: { score: number | null }) {
  if (score == null) return null;
  const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", color)} />;
}

export default function MyJourney() {
  const { userId } = useRole();
  const [expandedCheckIn, setExpandedCheckIn] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery<JourneyData>({
    queryKey: ["my-journey", userId],
    queryFn: () => apiFetch<JourneyData>("/api/my-journey", { days: 90 }),
  });

  const { data: checkIns } = useQuery<CheckIn[]>({
    queryKey: ["check-ins", userId],
    queryFn: () => apiFetch<CheckIn[]>("/api/check-ins", { limit: 20 }),
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

  const timelines = data.pillarTimelines as Record<string, { date: string; value: number }[]>;
  const allDates = new Set<string>();
  for (const pillar of ALL_PILLARS) {
    for (const pt of timelines[pillar] || []) {
      allDates.add(pt.date);
    }
  }

  const sortedDates = [...allDates].sort();
  const chartData = sortedDates.map((date) => {
    const row: Record<string, any> = { date };
    for (const pillar of ALL_PILLARS) {
      const pt = (timelines[pillar] || []).find((p) => p.date === date);
      if (pt) row[pillar] = pt.value;
    }
    return row;
  });

  const validAverages = data.pillarAverages.filter((p) => p.status !== "insufficient");
  const topPillar = validAverages.length > 0
    ? validAverages.reduce((max, d) => (d.score > max.score ? d : max), validAverages[0])
    : null;

  const completedCheckIns = (checkIns || []).filter((c) => c.status === "completed");
  const checkInHistory = data.checkInHistory || [];

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <header>
          <h1 className="text-3xl font-medium">My Journey</h1>
          <p className="text-muted-foreground mt-2">
            Your personal pulse history across 8 health pillars. Only you can see this.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-secondary text-foreground rounded-xl">
                <BiSolidCalendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Check-ins</p>
                <p className="text-3xl font-medium text-foreground">{data.totalCheckIns}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-secondary text-foreground rounded-xl">
                <BiSolidFlame className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-3xl font-medium text-foreground">{data.currentStreak} days</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-secondary text-foreground rounded-xl">
                <BiSolidAward className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Strongest Pillar</p>
                <p className="text-xl font-medium text-foreground">
                  {topPillar ? getPillarLabel(topPillar.pillar) : "\u2014"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {checkInHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BiSolidTime className="w-5 h-5 text-muted-foreground" />
                Your Responses
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Tap a check-in to recall your answers. Only you can see these.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {checkInHistory.map((ci, idx) => {
                  const date = new Date(ci.date);
                  const isExpanded = expandedCheckIn === ci.id;
                  const isFirst = idx === 0;
                  return (
                    <div key={ci.id}>
                      <button
                        onClick={() => setExpandedCheckIn(isExpanded ? null : ci.id)}
                        className={cn(
                          "w-full flex items-center gap-4 py-3 px-2 -mx-2 rounded-xl transition-colors text-left",
                          "hover:bg-secondary/50",
                          isExpanded && "bg-secondary/30"
                        )}
                      >
                        <div className="relative flex flex-col items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            isFirst ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                          )}>
                            <BiSolidCheckCircle className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            Pulse Check — {ci.responses.length} questions
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(date, "EEEE, MMMM d, yyyy")} at {format(date, "h:mm a")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isFirst && (
                            <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-lg bg-primary/10 text-primary">
                              Latest
                            </span>
                          )}
                          {isExpanded ? (
                            <BiSolidChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <BiSolidChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="ml-14 mb-4 mt-1 space-y-2 animate-in slide-in-from-top-2 duration-200">
                          {ci.responses.map((r, rIdx) => (
                            <div
                              key={rIdx}
                              className="flex items-start gap-3 p-3 rounded-xl bg-card border"
                            >
                              <ScoreDot score={r.normalizedScore} />
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                  {getPillarLabel(r.pillar)}
                                </p>
                                <p className="text-sm text-foreground leading-snug">
                                  {r.questionText}
                                </p>
                                <p className={cn(
                                  "text-sm font-medium",
                                  r.normalizedScore != null ? scoreColor(r.normalizedScore) : "text-foreground"
                                )}>
                                  {r.displayValue}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pillar Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
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
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                      labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                      formatter={(value: number, name: string) => [`${Math.round(value)}%`, getPillarLabel(name)]}
                    />
                    <ReferenceLine y={75} stroke="hsl(var(--border))" strokeDasharray="3 3" label={{ value: "75% target", position: "right", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    {ALL_PILLARS.map((pillar) => (
                      <Line
                        key={pillar}
                        type="monotone"
                        dataKey={pillar}
                        name={pillar}
                        stroke={getPillarColor(pillar)}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 mt-6 justify-center">
                {ALL_PILLARS.map((pillar) => {
                  const PIco = getPillarIcon(pillar);
                  return (
                    <div key={pillar} className="flex items-center gap-2 text-sm font-medium">
                      <PIco className="w-3.5 h-3.5" style={{ color: getPillarColor(pillar) }} />
                      {getPillarLabel(pillar)}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {data.totalCheckIns > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {data.pillarAverages.map((pa) => (
            <Card key={pa.pillar} className="text-center">
              <CardContent className="p-4">
                <p className="text-2xl font-medium text-foreground">
                  {pa.status === "insufficient" ? "\u2014" : `${Math.round(pa.score)}%`}
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-1">{getPillarLabel(pa.pillar)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {data.recentReflections.length > 0 && (
          <div>
            <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
              <BiSolidMessageRounded className="w-5 h-5 text-muted-foreground" />
              Recent Reflections
            </h3>
            <div className="space-y-4">
              {data.recentReflections.map((ref) => (
                <Card key={ref.id} className="border-l-4" style={{ borderLeftColor: getPillarColor(ref.pillar) }}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <DimensionBadge dimension={ref.pillar} />
                      <span className="text-xs text-muted-foreground font-medium">
                        {format(new Date(ref.date), "MMMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-2">{ref.questionText}</p>
                    <p className="text-muted-foreground leading-relaxed">"{ref.response}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {data.totalCheckIns === 0 && (
          <Card className="overflow-hidden">
            <div className="p-10 md:p-14 text-center space-y-6">
              <div className="text-6xl">🌱</div>
              <div className="space-y-3 max-w-lg mx-auto">
                <h2 className="text-2xl font-medium text-foreground">Your story starts with one check-in</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This space is yours alone. Track how you're feeling across wellness, growth, belonging,
                  and more. Spot your own patterns over time — only you can see your journey.
                </p>
              </div>
              <Link href="/check-in">
                <Button size="lg" className="font-medium px-8 shadow-lg shadow-primary/20">
                  Plant the First Seed <BiSolidRightArrow className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
