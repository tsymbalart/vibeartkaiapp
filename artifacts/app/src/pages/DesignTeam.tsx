import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  BiPlus,
  BiSolidGroup,
  BiSearch,
  BiArchive,
  BiTrash,
  BiDotsHorizontalRounded,
} from "react-icons/bi";

import { AppLayout } from "@/components/layout/AppLayout";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { EmptyState } from "@/components/design-ops/EmptyState";
import { Breadcrumbs } from "@/components/design-ops/Breadcrumbs";
import { trendIcons, trendColors } from "@/lib/designOpsConstants";
import { cn } from "@/lib/utils";

interface DesignTeamMemberItem {
  id: number;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  role: string;
  roleTitle: string | null;
  leadUserId: number | null;
  employmentStatus: string;
  isActive: boolean;
  notes: string | null;
  reviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  latestHealth: {
    healthScore: number;
    overallHealth: "green" | "yellow" | "red";
  } | null;
  trend: string | null;
  projectIds: number[];
  riskCount: number;
  oppCount: number;
}

interface ProjectLite {
  id: number;
  name: string;
  status: string;
}

interface TeamMemberRaw {
  id: number;
  name: string;
  email: string | null;
  role: string;
  avatarUrl: string | null;
  roleTitle: string | null;
  leadUserId: number | null;
  employmentStatus: string;
  isActive: boolean;
}

export default function DesignTeam() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: people, isLoading } = useQuery<DesignTeamMemberItem[]>({
    queryKey: ["/api/design-team"],
    queryFn: () => apiFetch<DesignTeamMemberItem[]>("/api/design-team"),
  });
  const { data: teamMembers } = useQuery<TeamMemberRaw[]>({
    queryKey: ["/api/team/members"],
    queryFn: () => apiFetch<TeamMemberRaw[]>("/api/team/members"),
  });
  const { data: projects } = useQuery<ProjectLite[]>({
    queryKey: ["/api/projects"],
    queryFn: () => apiFetch<ProjectLite[]>("/api/projects"),
  });

  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [healthFilter, setHealthFilter] = useState("all");
  const [leadFilter, setLeadFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DesignTeamMemberItem | null>(null);

  const filtered = (people || []).filter((p) => {
    if (
      search &&
      !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !(p.roleTitle || "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (!showArchived && p.employmentStatus === "archived") return false;
    if (showArchived && p.employmentStatus !== "archived") return false;
    if (healthFilter !== "all" && p.latestHealth?.overallHealth !== healthFilter) return false;
    if (leadFilter !== "all" && String(p.leadUserId ?? "") !== leadFilter) return false;
    if (projectFilter !== "all") {
      if (projectFilter === "none" && p.projectIds.length > 0) return false;
      if (projectFilter !== "none" && !p.projectIds.includes(Number(projectFilter))) return false;
    }
    return true;
  });

  const leads = useMemo(
    () => (teamMembers || []).filter((u) => u.role === "lead" || u.role === "director"),
    [teamMembers]
  );
  const projectMap = useMemo(() => new Map((projects || []).map((p) => [p.id, p])), [projects]);
  const userMap = useMemo(() => new Map((teamMembers || []).map((u) => [u.id, u])), [teamMembers]);
  const untrackedUsers = useMemo(
    () => [] as TeamMemberRaw[],  // No longer used — all team members appear automatically
    []
  );

  const archiveMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("PATCH", `/api/design-team/${userId}`, { employmentStatus: "archived" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-team"] });
      toast({ title: "Person archived" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("PATCH", `/api/design-team/${userId}`, { employmentStatus: "active" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-team"] });
      toast({ title: "Person restored" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/team/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
      toast({ title: "Member removed from team" });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <AppLayout>
      <div className="space-y-4">
        <Breadcrumbs segments={[{ label: "Dashboard", href: "/" }, { label: "Design Team" }]} />

        <Sheet open={createOpen} onOpenChange={setCreateOpen}>
          <SheetContent
            side="right"
            className="w-[440px] sm:max-w-[440px] overflow-y-auto"
            aria-describedby={undefined}
          >
            <SheetHeader className="pb-4 border-b border-border mb-4">
              <SheetTitle>Edit Member Details</SheetTitle>
            </SheetHeader>
            <PersonForm
              leads={leads}
              projects={projects || []}
              onClose={() => setCreateOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-people"
            />
          </div>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-[130px]" data-testid="select-people-health">
              <SelectValue placeholder="Health" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Health</SelectItem>
              <SelectItem value="green">Healthy</SelectItem>
              <SelectItem value="yellow">Attention</SelectItem>
              <SelectItem value="red">Problem</SelectItem>
            </SelectContent>
          </Select>
          <Select value={leadFilter} onValueChange={setLeadFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-people-lead">
              <SelectValue placeholder="People Lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People Leads</SelectItem>
              {leads.map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-people-project">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="none">Unassigned</SelectItem>
              {(projects || []).map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-3">
            <div className="inline-flex items-center gap-0.5 bg-secondary border border-border rounded-2xl p-1 h-10">
              <button
                onClick={() => setShowArchived(false)}
                className={cn(
                  "px-3.5 h-8 text-sm font-medium rounded-xl transition-all flex items-center",
                  !showArchived
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid="tab-active-people"
              >
                Active
              </button>
              <button
                onClick={() => setShowArchived(true)}
                className={cn(
                  "px-3.5 h-8 text-sm font-medium rounded-xl transition-all flex items-center gap-1.5",
                  showArchived
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid="tab-archived-people"
              >
                <BiArchive className="w-3.5 h-3.5" />
                Archived
              </button>
            </div>
            <Button data-testid="button-create-person" onClick={() => navigate("/settings")} className="h-10" variant="outline">
              <BiPlus className="w-4 h-4 mr-1" /> Invite Member
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BiSolidGroup}
            title={showArchived ? "No archived people" : "No people found"}
            description={
              search
                ? "Try adjusting your search"
                : showArchived
                ? "Archived people will appear here"
                : "Invite your first team member via Settings"
            }
          />
        ) : (
          <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="relative">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-md">
                  <tr className="border-b border-border">
                    <th className="py-2.5 px-4 pl-5 text-xs font-medium text-muted-foreground capitalize min-w-[140px]">
                      Name
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize">Position</th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize whitespace-nowrap">
                      Lead
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize">Projects</th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize">Health</th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize text-center">
                      Trend
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize text-center">
                      Items
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize hidden md:table-cell">
                      Next Review
                    </th>
                    <th className="py-2.5 px-4 pr-5 text-xs font-medium text-muted-foreground capitalize text-right w-[60px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((p) => {
                    const lead = p.leadUserId ? userMap.get(p.leadUserId) : null;
                    const assignedProjects = p.projectIds
                      .map((pid) => projectMap.get(pid))
                      .filter((proj): proj is ProjectLite => !!proj);
                    const health = p.latestHealth?.overallHealth;
                    const healthScore = p.latestHealth?.healthScore;
                    const healthChip =
                      health === "red"
                        ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                        : health === "yellow"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                        : health === "green"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-secondary text-muted-foreground";
                    const healthDot =
                      health === "red"
                        ? "bg-red-500"
                        : health === "yellow"
                        ? "bg-amber-500"
                        : health === "green"
                        ? "bg-emerald-500"
                        : "bg-border";
                    const isArchived = p.employmentStatus === "archived";
                    const TrendIcon = p.trend ? trendIcons[p.trend] : null;
                    const itemsCount = p.riskCount + p.oppCount;
                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          "group cursor-pointer hover:bg-secondary/40 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isArchived && "opacity-60"
                        )}
                        tabIndex={0}
                        role="link"
                        data-testid={`row-person-${p.id}`}
                        onClick={() => navigate(`/design-team/${p.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/design-team/${p.id}`);
                          }
                        }}
                      >
                        <td className="py-3 px-4 pl-5 align-middle">
                          <span className="text-sm font-medium text-foreground">{p.name}</span>
                        </td>
                        <td className="py-3 px-4 text-[13px] text-muted-foreground align-middle whitespace-nowrap">
                          {p.roleTitle || <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="py-3 px-4 text-[13px] text-foreground whitespace-nowrap align-middle">
                          {lead ? lead.name : <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {assignedProjects.slice(0, 2).map((ap) => (
                              <span
                                key={ap.id}
                                className="inline-block px-2 py-0.5 rounded-md bg-secondary text-[11px] font-medium text-muted-foreground whitespace-nowrap"
                              >
                                {ap.name}
                              </span>
                            ))}
                            {assignedProjects.length > 2 && (
                              <span className="text-[11px] text-muted-foreground font-medium">
                                +{assignedProjects.length - 2}
                              </span>
                            )}
                            {assignedProjects.length === 0 && (
                              <span className="text-[13px] text-muted-foreground/50">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                                healthChip
                              )}
                            >
                              <span className={cn("w-[5px] h-[5px] rounded-full", healthDot)} />
                              {healthScore != null ? healthScore.toFixed(1) : "—"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle text-center">
                          <div className="flex justify-center">
                            {TrendIcon ? (
                              <TrendIcon className={cn("w-3.5 h-3.5", trendColors[p.trend!])} />
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle text-center">
                          <span
                            className={cn(
                              "text-[13px] font-medium",
                              itemsCount > 0 ? "text-foreground" : "text-muted-foreground/50"
                            )}
                          >
                            {itemsCount > 0 ? itemsCount : "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle hidden md:table-cell">
                          <span className="text-[13px] text-muted-foreground whitespace-nowrap">
                            {p.reviewDate ? (
                              format(new Date(p.reviewDate + "T00:00:00"), "MMM d")
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </span>
                        </td>
                        <td className="py-2 px-4 pr-5 align-middle text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="p-1 rounded-md opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-secondary transition-all"
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Actions for ${p.name}`}
                                data-testid={`button-actions-person-${p.id}`}
                              >
                                <BiDotsHorizontalRounded className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              {isArchived ? (
                                <DropdownMenuItem
                                  onClick={() => unarchiveMutation.mutate(p.id)}
                                  data-testid={`button-unarchive-person-${p.id}`}
                                >
                                  <BiArchive className="w-3.5 h-3.5 mr-2" /> Restore
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => archiveMutation.mutate(p.id)}
                                  data-testid={`button-archive-person-${p.id}`}
                                >
                                  <BiArchive className="w-3.5 h-3.5 mr-2" /> Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(p)}
                                data-testid={`button-delete-person-${p.id}`}
                              >
                                <BiTrash className="w-3.5 h-3.5 mr-2" /> Remove from team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <AlertDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from team</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove &quot;{deleteTarget?.name}&quot; from the team entirely. They will lose
                access to pulse check-ins and all Design Ops data. You can re-invite them later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-person">Cancel</AlertDialogCancel>
              <AlertDialogAction
                data-testid="button-confirm-delete-person"
                onClick={() => deleteTarget && removeMutation.mutate(deleteTarget.id)}
                disabled={removeMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {removeMutation.isPending ? "Removing..." : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}

interface PersonFormProps {
  leads: TeamMemberRaw[];
  projects: ProjectLite[];
  onClose: () => void;
  editData?: DesignTeamMemberItem | null;
}

export function PersonForm({ leads, projects, onClose, editData }: PersonFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    userId: editData?.id ? String(editData.id) : "",
    roleTitle: editData?.roleTitle || "",
    leadUserId: editData?.leadUserId ? String(editData.leadUserId) : leads[0] ? String(leads[0].id) : "",
    projectIds: (editData?.projectIds as number[]) || [],
    notes: editData?.notes || "",
  });

  const toggleProject = (projectId: number) => {
    setForm((prev) => ({
      ...prev,
      projectIds: prev.projectIds.includes(projectId)
        ? prev.projectIds.filter((id) => id !== projectId)
        : [...prev.projectIds, projectId],
    }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const userId = Number(form.userId);
      // PATCH user fields (track or update tracking)
      await apiRequest("PATCH", `/api/design-team/${userId}`, {
        roleTitle: form.roleTitle,
        leadUserId: form.leadUserId ? Number(form.leadUserId) : null,
        notes: form.notes,
        employmentStatus: "active",
      });

      // Sync project assignments — diff against existing
      const existingIds = new Set((editData?.projectIds as number[]) || []);
      const desiredIds = new Set(form.projectIds);
      const toAdd = [...desiredIds].filter((id) => !existingIds.has(id));
      const toRemove = [...existingIds].filter((id) => !desiredIds.has(id));
      await Promise.all([
        ...toAdd.map((projectId) =>
          apiRequest("POST", `/api/projects/${projectId}/assignments`, { userId })
        ),
        ...toRemove.map((projectId) =>
          apiRequest("DELETE", `/api/projects/${projectId}/assignments/${userId}`)
        ),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      if (editData) {
        queryClient.invalidateQueries({ queryKey: [`/api/design-team/${editData.id}`] });
      }
      toast({ title: "Member details updated" });
      onClose();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const canSubmit = !!form.userId;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="space-y-4"
    >
      {editData && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
          <span className="text-[14px] font-medium text-foreground">{editData.name}</span>
        </div>
      )}
      <div className="space-y-2">
        <Label>Job Title</Label>
        <Input
          value={form.roleTitle}
          onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
          data-testid="input-role-title"
          placeholder="e.g. Senior Designer (optional)"
        />
      </div>
      <div className="space-y-2">
        <Label>People Lead</Label>
        <Select value={form.leadUserId} onValueChange={(v) => setForm({ ...form, leadUserId: v })}>
          <SelectTrigger data-testid="select-people-lead-form">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {leads.map((l) => (
              <SelectItem key={l.id} value={String(l.id)}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Projects</Label>
        <div className="border border-border rounded-md p-2 space-y-1 max-h-48 overflow-y-auto">
          {projects.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 py-1 px-1 hover:bg-secondary/40 rounded cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={form.projectIds.includes(p.id)}
                onChange={() => toggleProject(p.id)}
                className="rounded border-border"
                data-testid={`checkbox-project-${p.id}`}
              />
              {p.name}
            </label>
          ))}
        </div>
        {form.projectIds.length === 0 && <p className="text-xs text-muted-foreground">No projects selected</p>}
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          data-testid="input-person-notes"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending || !canSubmit} data-testid="button-submit-person">
          {mutation.isPending ? "Saving..." : editData ? "Update" : "Track"}
        </Button>
      </div>
    </form>
  );
}
