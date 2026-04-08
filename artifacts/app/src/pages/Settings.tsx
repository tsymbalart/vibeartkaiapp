import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRole } from "@/context/RoleContext";
import { apiFetch, apiUrl, fetchWithAuth } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  BiSolidCog,
  BiSolidCalculator,
  BiSolidGroup,
  BiSolidLayer,
  BiPlus,
  BiSolidTrash,
  BiX,
  BiCheck,
  BiSolidPencil,
  BiSolidChevronDown,
  BiSolidEnvelope,
  BiSolidShield,
  BiSolidCrown,
  BiSolidUser,
  BiCopy,
} from "react-icons/bi";
import { useAuth } from "@/context/AuthContext";

interface SubTeam {
  id: number;
  name: string;
  color: string;
  teamId: number;
  memberCount: number;
}

interface TeamUser {
  id: number;
  name: string;
  email: string | null;
  role: string;
  subTeamIds: number[];
  teamId: number;
}

interface Invitation {
  id: number;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface PulseSettings {
  id: number | null;
  teamId: number;
  sessionSize: number;
  pillarWeights: Record<string, string>;
  scoringMode: string;
}

const SUB_TEAM_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
];

interface AllowedEmail {
  id: number;
  email: string;
  teamId: number | null;
  invitedByUserId: number | null;
  createdAt: string;
}

function AllowedEmailsSection() {
  const [newEmail, setNewEmail] = useState("");
  const queryClient = useQueryClient();

  const { data: allowed } = useQuery<AllowedEmail[]>({
    queryKey: ["allowed-emails"],
    queryFn: () => apiFetch<AllowedEmail[]>("/api/allowed-emails"),
  });

  const addMutation = useMutation({
    mutationFn: async (email: string) => {
      const resp = await fetchWithAuth(apiUrl("/api/allowed-emails"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to add email");
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allowed-emails"] });
      setNewEmail("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const resp = await fetchWithAuth(apiUrl(`/api/allowed-emails/${id}`), { method: "DELETE" });
      if (!resp.ok) throw new Error("Failed to delete email");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allowed-emails"] });
    },
  });

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <BiSolidEnvelope className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-medium">Allowed Emails</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Whitelist of emails that can sign in</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newEmail.trim()) addMutation.mutate(newEmail.trim().toLowerCase());
          }}
          className="flex gap-2"
        >
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="name@artk.ai"
            className="flex-1"
            data-testid="input-allowed-email"
          />
          <Button type="submit" disabled={addMutation.isPending || !newEmail.trim()} data-testid="button-add-allowed-email">
            <BiPlus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </form>
        {addMutation.error && (
          <p className="text-xs text-destructive">{(addMutation.error as Error).message}</p>
        )}
        <div className="space-y-1.5">
          {(allowed || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No emails allowed yet</p>
          ) : (
            (allowed || []).map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-secondary/40 border border-border"
                data-testid={`allowed-email-${row.id}`}
              >
                <span className="text-sm font-medium text-foreground truncate">{row.email}</span>
                <button
                  onClick={() => deleteMutation.mutate(row.id)}
                  disabled={deleteMutation.isPending}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  aria-label={`Remove ${row.email}`}
                  data-testid={`button-remove-allowed-email-${row.id}`}
                >
                  <BiSolidTrash className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ScoringSection({ settings, onUpdate }: { settings: PulseSettings; onUpdate: (mode: string) => void }) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <BiSolidCalculator className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-medium">Scoring Logic</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">How pulse scores are calculated</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <button
          onClick={() => onUpdate("latest_only")}
          className={cn(
            "w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left",
            settings.scoringMode === "latest_only"
              ? "border-primary/40 bg-primary/5"
              : "border-border/60 hover:border-border"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-lg border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors",
            settings.scoringMode === "latest_only"
              ? "border-primary bg-primary"
              : "border-muted-foreground/30"
          )}>
            {settings.scoringMode === "latest_only" && <BiCheck className="w-3 h-3 text-primary-foreground" />}
          </div>
          <div>
            <p className="text-sm font-medium">Latest Response Only</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Only each member's most recent check-in contributes to the team score. Best for tracking current sentiment.
            </p>
          </div>
        </button>
        <button
          onClick={() => onUpdate("average_all")}
          className={cn(
            "w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left",
            settings.scoringMode === "average_all"
              ? "border-primary/40 bg-primary/5"
              : "border-border/60 hover:border-border"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-lg border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors",
            settings.scoringMode === "average_all"
              ? "border-primary bg-primary"
              : "border-muted-foreground/30"
          )}>
            {settings.scoringMode === "average_all" && <BiCheck className="w-3 h-3 text-primary-foreground" />}
          </div>
          <div>
            <p className="text-sm font-medium">Average All Responses</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              All check-ins within the time window are averaged. Better for capturing trends over time.
            </p>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}

function TeammatesSection({ users, subTeams }: { users: TeamUser[]; subTeams: SubTeam[] }) {
  const queryClient = useQueryClient();
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  const addToSubTeam = useMutation({
    mutationFn: async ({ userId, subTeamId }: { userId: number; subTeamId: number }) => {
      const resp = await fetchWithAuth(apiUrl(`/api/users/${userId}/sub-teams`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subTeamId }),
      });
      if (!resp.ok) throw new Error("Failed to add to sub-team");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["sub-teams"] });
    },
  });

  const removeFromSubTeam = useMutation({
    mutationFn: async ({ userId, subTeamId }: { userId: number; subTeamId: number }) => {
      const resp = await fetchWithAuth(apiUrl(`/api/users/${userId}/sub-teams/${subTeamId}`), {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error("Failed to remove from sub-team");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["sub-teams"] });
    },
  });

  const toggleSubTeam = (userId: number, subTeamId: number, isAssigned: boolean) => {
    if (isAssigned) {
      removeFromSubTeam.mutate({ userId, subTeamId });
    } else {
      addToSubTeam.mutate({ userId, subTeamId });
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <BiSolidGroup className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-medium">Teammates</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{users.length} members · Assign to teams &amp; projects</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {users.map((user) => {
            const userSTs = subTeams.filter((st) => user.subTeamIds.includes(st.id));
            const isExpanded = expandedUserId === user.id;
            return (
              <div key={user.id}>
                <div
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{getRoleLabel(user.role)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {userSTs.length > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {userSTs.map((st) => (
                          <span
                            key={st.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-secondary text-xs font-medium"
                          >
                            <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: st.color }} />
                            {st.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">No teams</span>
                    )}
                    <BiSolidChevronDown className={cn(
                      "w-3.5 h-3.5 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </div>
                </div>
                {isExpanded && subTeams.length > 0 && (
                  <div className="ml-14 mr-3 mb-2 flex flex-wrap gap-1.5">
                    {subTeams.map((st) => {
                      const isAssigned = user.subTeamIds.includes(st.id);
                      return (
                        <button
                          key={st.id}
                          onClick={() => toggleSubTeam(user.id, st.id, isAssigned)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                            isAssigned
                              ? "border-primary/30 bg-primary/5 text-primary"
                              : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                          )}
                        >
                          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: st.color }} />
                          {st.name}
                          {isAssigned && <BiCheck className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                {isExpanded && subTeams.length === 0 && (
                  <div className="ml-14 mr-3 mb-2">
                    <p className="text-xs text-muted-foreground/60">Create sub-teams above first, then assign members here</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SubTeamsSection({ subTeams }: { subTeams: SubTeam[] }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(SUB_TEAM_COLORS[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const createSubTeam = useMutation({
    mutationFn: async () => {
      const resp = await fetchWithAuth(apiUrl("/api/sub-teams"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, color: newColor }),
      });
      if (!resp.ok) throw new Error("Failed to create sub-team");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-teams"] });
      setNewName("");
      setNewColor(SUB_TEAM_COLORS[(subTeams.length + 1) % SUB_TEAM_COLORS.length]);
      setIsAdding(false);
    },
  });

  const updateSubTeam = useMutation({
    mutationFn: async ({ id, name, color }: { id: number; name: string; color: string }) => {
      const resp = await fetchWithAuth(apiUrl(`/api/sub-teams/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (!resp.ok) throw new Error("Failed to update sub-team");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-teams"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingId(null);
    },
  });

  const deleteSubTeam = useMutation({
    mutationFn: async (id: number) => {
      const resp = await fetchWithAuth(apiUrl(`/api/sub-teams/${id}`), { method: "DELETE" });
      if (!resp.ok) throw new Error("Failed to delete sub-team");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-teams"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BiSolidLayer className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-medium">Sub-teams</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Group teammates for filtered insights</p>
            </div>
          </div>
          {!isAdding && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(true);
                setNewColor(SUB_TEAM_COLORS[subTeams.length % SUB_TEAM_COLORS.length]);
              }}
              className="rounded-xl h-8 text-xs gap-1.5"
            >
              <BiPlus className="w-3.5 h-3.5" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {subTeams.map((st) => {
            const isEditing = editingId === st.id;
            if (isEditing) {
              return (
                <div key={st.id} className="flex items-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/5">
                  <div className="flex gap-1">
                    {SUB_TEAM_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={cn(
                          "w-5 h-5 rounded-md transition-all",
                          editColor === c ? "ring-2 ring-primary ring-offset-1" : ""
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-sm rounded-lg flex-1"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => updateSubTeam.mutate({ id: st.id, name: editName, color: editColor })}
                    disabled={!editName.trim()}
                    className="h-8 rounded-xl px-3"
                  >
                    <BiCheck className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                    className="h-8 rounded-xl px-2"
                  >
                    <BiX className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            }
            return (
              <div
                key={st.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: st.color }} />
                  <span className="text-sm font-medium">{st.name}</span>
                  <span className="text-xs text-muted-foreground">{st.memberCount} member{st.memberCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingId(st.id);
                      setEditName(st.name);
                      setEditColor(st.color);
                    }}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                  >
                    <BiSolidPencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteSubTeam.mutate(st.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"
                  >
                    <BiSolidTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {isAdding && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/5">
              <div className="flex gap-1">
                {SUB_TEAM_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "w-5 h-5 rounded-md transition-all",
                      newColor === c ? "ring-2 ring-primary ring-offset-1" : ""
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Sub-team name"
                className="h-8 text-sm rounded-lg flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newName.trim()) createSubTeam.mutate();
                }}
              />
              <Button
                size="sm"
                onClick={() => createSubTeam.mutate()}
                disabled={!newName.trim()}
                className="h-8 rounded-xl px-3"
              >
                <BiCheck className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAdding(false)}
                className="h-8 rounded-xl px-2"
              >
                <BiX className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {subTeams.length === 0 && !isAdding && (
            <div className="text-center py-8">
              <BiSolidLayer className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No sub-teams yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create sub-teams to filter dashboard insights by group</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MemberRoleIcon({ role }: { role: string }) {
  if (role === "director") return <BiSolidCrown className="w-3.5 h-3.5 text-primary" />;
  if (role === "lead") return <BiSolidShield className="w-3.5 h-3.5 text-primary" />;
  return <BiSolidUser className="w-3.5 h-3.5 text-primary" />;
}

function getRoleLabel(role: string) {
  if (role === "director") return "Director";
  if (role === "lead") return "Team Lead";
  return "Teammate";
}

const ROLE_OPTIONS = [
  { value: "member", label: "Teammate" },
  { value: "lead", label: "Team Lead" },
  { value: "director", label: "Director" },
];

function TeamMembersManagement({ members, invitations }: { members: TeamUser[]; invitations: Invitation[] }) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const pendingInvites = invitations.filter((i) => i.status === "pending");

  const copyInviteLink = (inv: Invitation) => {
    const link = `${window.location.origin}/api/login?returnTo=/`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const resp = await fetchWithAuth(apiUrl(`/api/team/members/${id}/role`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Failed to change role");
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (id: number) => {
      const resp = await fetchWithAuth(apiUrl(`/api/team/members/${id}`), {
        method: "DELETE",
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Failed to remove member");
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setConfirmRemoveId(null);
    },
  });

  const sendInvite = useMutation({
    mutationFn: async () => {
      const resp = await fetchWithAuth(apiUrl("/api/invitations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Failed to send invitation");
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      setInviteEmail("");
      setInviteRole("member");
      setShowInviteForm(false);
    },
  });

  const cancelInvite = useMutation({
    mutationFn: async (id: number) => {
      const resp = await fetchWithAuth(apiUrl(`/api/invitations/${id}`), {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error("Failed to cancel invitation");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });

  const canChangeRole = (member: TeamUser) => {
    if (member.id === currentUser?.id) return false;
    if (currentUser?.role === "director") return true;
    if (currentUser?.role === "lead" && member.role !== "director") return true;
    return false;
  };

  const canRemove = (member: TeamUser) => {
    if (member.id === currentUser?.id) return false;
    if (currentUser?.role === "director") return true;
    if (currentUser?.role === "lead" && member.role === "member") return true;
    return false;
  };

  const availableRoles = currentUser?.role === "director"
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((r) => r.value !== "director");

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BiSolidGroup className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-medium">Team Members</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{members.length} members · Manage roles &amp; invitations</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5 text-xs"
            onClick={() => setShowInviteForm(!showInviteForm)}
          >
            <BiSolidEnvelope className="w-3.5 h-3.5" />
            Invite
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showInviteForm && (
          <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
            <p className="text-sm font-medium">Invite a new member</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 rounded-lg text-sm"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                {availableRoles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-xs"
                onClick={() => { setShowInviteForm(false); setInviteEmail(""); }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-lg text-xs gap-1.5"
                onClick={() => sendInvite.mutate()}
                disabled={!inviteEmail.includes("@") || sendInvite.isPending}
              >
                <BiSolidEnvelope className="w-3 h-3" />
                {sendInvite.isPending ? "Sending…" : "Send Invite"}
              </Button>
            </div>
            {sendInvite.isError && (
              <p className="text-xs text-destructive">{(sendInvite.error as Error).message}</p>
            )}
          </div>
        )}

        {pendingInvites.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-3 pb-1">Pending Invitations</p>
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <BiSolidEnvelope className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">{getRoleLabel(inv.role)} · Pending</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyInviteLink(inv)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Copy invite link"
                  >
                    {copiedId === inv.id ? <BiCheck className="w-4 h-4 text-emerald-500" /> : <BiCopy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => cancelInvite.mutate(inv.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Cancel invitation"
                  >
                    <BiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MemberRoleIcon role={member.role} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{member.name}</p>
                    {member.id === currentUser?.id && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">You</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{member.email || "No email"} · {getRoleLabel(member.role)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {canChangeRole(member) && (
                  <select
                    value={member.role}
                    onChange={(e) => changeRole.mutate({ id: member.id, role: e.target.value })}
                    className="px-2 py-1 rounded-lg border border-border/60 bg-background text-xs cursor-pointer"
                  >
                    {availableRoles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                )}
                {canRemove(member) && (
                  <>
                    {confirmRemoveId === member.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => removeMember.mutate(member.id)}
                          className="p-1.5 rounded-lg text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
                          title="Confirm remove"
                        >
                          <BiCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmRemoveId(null)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                          title="Cancel"
                        >
                          <BiX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemoveId(member.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove member"
                      >
                        <BiSolidTrash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { role } = useRole();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery<PulseSettings>({
    queryKey: ["pulse-settings"],
    queryFn: () => apiFetch("/api/pulse-settings"),
  });

  const { data: subTeams = [] } = useQuery<SubTeam[]>({
    queryKey: ["sub-teams"],
    queryFn: () => apiFetch("/api/sub-teams"),
  });

  const { data: users = [] } = useQuery<TeamUser[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch("/api/users"),
  });

  const { data: teamMembers = [] } = useQuery<TeamUser[]>({
    queryKey: ["team-members"],
    queryFn: () => apiFetch("/api/team/members"),
  });

  const { data: invitations = [] } = useQuery<Invitation[]>({
    queryKey: ["invitations"],
    queryFn: () => apiFetch("/api/invitations"),
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<PulseSettings>) => {
      const resp = await fetchWithAuth(apiUrl("/api/pulse-settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!resp.ok) throw new Error("Failed to update settings");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pulse-settings"] });
    },
  });

  if (role !== "lead" && role !== "director") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <BiSolidCog className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-lg font-medium text-foreground">Lead Access Only</p>
            <p className="text-sm text-muted-foreground mt-1">This page is restricted to team leads</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!settings) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-16">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure scoring, manage teammates, and organize sub-teams</p>
        </div>

        <TeamMembersManagement members={teamMembers} invitations={invitations} />

        <ScoringSection
          settings={settings}
          onUpdate={(mode) => updateSettings.mutate({ scoringMode: mode })}
        />

        <SubTeamsSection subTeams={subTeams} />

        <TeammatesSection users={users} subTeams={subTeams} />

        {role === "director" && <AllowedEmailsSection />}
      </div>
    </AppLayout>
  );
}
