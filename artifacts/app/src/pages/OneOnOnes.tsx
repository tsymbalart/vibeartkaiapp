import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { apiFetch, apiUrl, fetchWithAuth } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  BiSolidUser,
  BiSolidPencil,
  BiSolidCalendar,
} from "react-icons/bi";

type TeamUser = {
  id: number;
  name: string;
  email: string | null;
  role: string;
  avatarUrl: string | null;
  subTeamIds: number[];
  teamId: number;
};

type SubTeam = {
  id: number;
  name: string;
  color: string;
  teamId: number;
  memberCount: number;
};

type OneOnOneStatus = {
  id: number;
  lastOneOnOneDate: string | null;
  intervalWeeks: number;
  reminderStatus: "on_track" | "nudge_due" | "overdue" | "off";
  nextDate: string | null;
  noteCount: number;
};

type MemberRow = {
  id: number;
  name: string;
  role: string;
  avatarUrl: string | null;
  subTeams: SubTeam[];
  lastOneOnOneDate: string | null;
  intervalWeeks: number;
  reminderStatus: "on_track" | "nudge_due" | "overdue" | "off";
  nextDate: string | null;
  noteCount: number;
};

function formatNextDate(dateStr: string | null): string {
  if (!dateStr) return "Set date";
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getNextDateState(
  nextDate: string | null
): "neutral" | "amber" | "red" | "muted" {
  if (!nextDate) return "muted";

  const date = new Date(nextDate + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "red";
  if (diffDays <= 1) return "amber";
  return "neutral";
}

const nextDateStyles = {
  neutral: "bg-secondary text-foreground border-border",
  amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  muted: "bg-secondary text-muted-foreground border-border",
};

export default function OneOnOnes() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [teamFilter, setTeamFilter] = useState<number | null>(null);
  const [editingDateId, setEditingDateId] = useState<number | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = useCallback((memberId: number) => {
    setEditingDateId(memberId);
    setTimeout(() => {
      dateInputRef.current?.focus();
      dateInputRef.current?.click();
    }, 50);
  }, []);

  const { data: users = [], isLoading: usersLoading } = useQuery<TeamUser[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch<TeamUser[]>("/api/users"),
  });

  const { data: subTeams = [] } = useQuery<SubTeam[]>({
    queryKey: ["sub-teams"],
    queryFn: () => apiFetch<SubTeam[]>("/api/sub-teams"),
  });

  const { data: oneOnOneStatuses = [], isLoading: statusesLoading } = useQuery<OneOnOneStatus[]>({
    queryKey: ["one-on-one-members"],
    queryFn: () => apiFetch<OneOnOneStatus[]>("/api/one-on-ones/members"),
  });

  const isLoading = usersLoading || statusesLoading;

  const subTeamMap = new Map(subTeams.map((st) => [st.id, st]));
  const statusMap = new Map(oneOnOneStatuses.map((s) => [s.id, s]));

  const members: MemberRow[] = users
    .filter((u) => statusMap.has(u.id))
    .map((u) => {
      const status = statusMap.get(u.id);
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        avatarUrl: u.avatarUrl ?? null,
        subTeams: u.subTeamIds.map((id) => subTeamMap.get(id)).filter((st): st is SubTeam => Boolean(st)),
        lastOneOnOneDate: status?.lastOneOnOneDate ?? null,
        intervalWeeks: status?.intervalWeeks ?? 4,
        reminderStatus: status?.reminderStatus ?? "off",
        nextDate: status?.nextDate ?? null,
        noteCount: status?.noteCount ?? 0,
      };
    });

  const allSubTeamsList: SubTeam[] = [];
  const seenIds = new Set<number>();
  for (const m of members) {
    for (const st of m.subTeams) {
      if (!seenIds.has(st.id)) {
        seenIds.add(st.id);
        allSubTeamsList.push(st);
      }
    }
  }
  const filteredMembers = teamFilter
    ? members.filter((m) => m.subTeams.some((st) => st.id === teamFilter))
    : members;

  const reminderMutation = useMutation({
    mutationFn: async ({ memberId, nextDate }: { memberId: number; nextDate: string }) => {
      const resp = await fetchWithAuth(apiUrl(`/api/one-on-ones/members/${memberId}/reminder`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextDate }),
      });
      if (!resp.ok) throw new Error("Failed to update reminder");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["one-on-one-members"] });
    },
  });

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-foreground">1:1 Records</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your one-on-one meetings and keep notes for each team member.
          </p>
        </div>

        {allSubTeamsList.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={teamFilter === null ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setTeamFilter(null)}
            >
              All ({members.length})
            </Button>
            {allSubTeamsList.map((st) => {
              const count = members.filter((m) => m.subTeams.some((s) => s.id === st.id)).length;
              return (
                <Button
                  key={st.id}
                  variant={teamFilter === st.id ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setTeamFilter(teamFilter === st.id ? null : st.id)}
                >
                  <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: st.color }} />
                  {st.name} ({count})
                </Button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BiSolidUser className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No team members found.</p>
            </CardContent>
          </Card>
        ) : filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No members in this team.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {filteredMembers.map((member) => {
              const dateState = getNextDateState(member.nextDate);

              return (
                <Card
                  key={member.id}
                  className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => navigate(`/one-on-ones/${member.id}`)}
                >
                  <CardContent className="px-5 py-4">
                    <div className="flex items-center gap-3 mb-2.5">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center flex-shrink-0 text-sm font-medium text-violet-600 dark:text-violet-400">
                          {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{member.name}</span>
                          <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                        </div>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {member.subTeams.length > 0 ? (
                            member.subTeams.map((st) => (
                              <span
                                key={st.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-secondary text-xs font-medium"
                              >
                                <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: st.color }} />
                                {st.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground/50">No teams</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pl-[52px]">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          Last 1:1: {formatDate(member.lastOneOnOneDate)}
                        </span>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-secondary text-foreground border-border">
                          {member.noteCount} {member.noteCount === 1 ? "note" : "notes"}
                        </span>

                        {editingDateId === member.id ? (
                          <input
                            ref={dateInputRef}
                            type="date"
                            defaultValue={member.nextDate ?? ""}
                            className="h-5 rounded-lg border border-border bg-background px-2 text-[10px] text-foreground"
                            onClick={(e) => e.stopPropagation()}
                            onBlur={() => setEditingDateId(null)}
                            onChange={(e) => {
                              if (e.target.value) {
                                reminderMutation.mutate({ memberId: member.id, nextDate: e.target.value });
                                setEditingDateId(null);
                              }
                            }}
                          />
                        ) : (
                          <button
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border cursor-pointer hover:opacity-80 transition-opacity",
                              nextDateStyles[dateState]
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDatePicker(member.id);
                            }}
                          >
                            <BiSolidCalendar className="w-3 h-3" />
                            {dateState === "red" ? "Overdue" : "Next"}: {formatNextDate(member.nextDate)}
                          </button>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/one-on-ones/${member.id}?log=1`);
                        }}
                      >
                        <BiSolidPencil className="w-3 h-3 mr-1" />
                        Log 1:1
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
