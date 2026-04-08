import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/api";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  BiPlus,
  BiSolidFolder,
  BiSearch,
  BiArchive,
  BiTrash,
  BiDotsHorizontalRounded,
} from "react-icons/bi";

import { AppLayout } from "@/components/layout/AppLayout";
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

interface ProjectListItem {
  id: number;
  name: string;
  clientName: string;
  leadUserId: number;
  status: string;
  description: string | null;
  reviewDate: string | null;
  trend: string | null;
  createdAt: string;
  updatedAt: string;
  latestHealth: {
    healthScore: number;
    overallHealth: "green" | "yellow" | "red";
  } | null;
  assignedUserIds: number[];
  riskCount: number;
  oppCount: number;
}

interface UserListItem {
  id: number;
  name: string;
  role: string;
  roleTitle: string | null;
  employmentStatus: string;
}

export default function Projects() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects, isLoading } = useQuery<ProjectListItem[]>({
    queryKey: ["/api/projects"],
    queryFn: () => apiFetch<ProjectListItem[]>("/api/projects"),
  });
  const { data: users } = useQuery<UserListItem[]>({
    queryKey: ["/api/design-team"],
    queryFn: () => apiFetch<UserListItem[]>("/api/design-team"),
  });

  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [healthFilter, setHealthFilter] = useState("all");
  const [leadFilter, setLeadFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectListItem | null>(null);

  const filtered = (projects || []).filter((p) => {
    if (
      search &&
      !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !p.clientName.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (!showArchived && p.status === "archived") return false;
    if (showArchived && p.status !== "archived") return false;
    if (healthFilter !== "all" && p.latestHealth?.overallHealth !== healthFilter) return false;
    if (leadFilter !== "all" && String(p.leadUserId) !== leadFilter) return false;
    return true;
  });

  const leads = useMemo(
    () => (users || []).filter((u) => u.role === "lead" || u.role === "director"),
    [users]
  );
  const userMap = useMemo(() => new Map((users || []).map((u) => [u.id, u])), [users]);

  const archiveMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await apiRequest("PATCH", `/api/projects/${projectId}`, { status: "archived" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project archived" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await apiRequest("PATCH", `/api/projects/${projectId}`, { status: "active" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project restored" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project deleted" });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <AppLayout>
      <div className="space-y-4">
        <Breadcrumbs segments={[{ label: "Dashboard", href: "/" }, { label: "Projects" }]} />

        <Sheet open={createOpen} onOpenChange={setCreateOpen}>
          <SheetContent
            side="right"
            className="w-[440px] sm:max-w-[440px] overflow-y-auto"
            aria-describedby={undefined}
          >
            <SheetHeader className="pb-4 border-b border-border mb-4">
              <SheetTitle>Create Project</SheetTitle>
            </SheetHeader>
            <ProjectForm leads={leads} onClose={() => setCreateOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-projects"
            />
          </div>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-[130px]" data-testid="select-health-filter">
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
            <SelectTrigger className="w-[160px]" data-testid="select-lead-filter">
              <SelectValue placeholder="Project Lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Project Leads</SelectItem>
              {leads.map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.name}
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
                data-testid="tab-active-projects"
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
                data-testid="tab-archived-projects"
              >
                <BiArchive className="w-3.5 h-3.5" />
                Archived
              </button>
            </div>
            <Button data-testid="button-create-project" onClick={() => setCreateOpen(true)} className="h-10">
              <BiPlus className="w-4 h-4 mr-1" /> New Project
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BiSolidFolder}
            title={showArchived ? "No archived projects" : "No projects found"}
            description={
              search || healthFilter !== "all"
                ? "Try adjusting your filters"
                : showArchived
                ? "Archived projects will appear here"
                : "Create your first project to get started"
            }
          />
        ) : (
          <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="relative">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-md">
                  <tr className="border-b border-border">
                    <th className="py-2.5 px-4 pl-5 text-xs font-medium text-muted-foreground capitalize min-w-[140px]">
                      Project
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize">Client</th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize whitespace-nowrap">
                      Health
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize">Lead</th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize">Team</th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize text-center">
                      Trend
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize text-center">
                      Risks
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize text-center">
                      Opps
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground capitalize hidden md:table-cell">
                      Next Review
                    </th>
                    <th className="py-2.5 px-4 pr-5 text-xs font-medium text-muted-foreground capitalize text-right w-[60px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((p) => {
                    const lead = userMap.get(p.leadUserId);
                    const TrendIcon = p.trend ? trendIcons[p.trend] : null;
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
                    const isArchived = p.status === "archived";
                    const teamMembers = p.assignedUserIds
                      .map((uid) => userMap.get(uid))
                      .filter((u): u is UserListItem => !!u);
                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          "group cursor-pointer hover:bg-secondary/40 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isArchived && "opacity-60"
                        )}
                        tabIndex={0}
                        role="link"
                        data-testid={`row-project-${p.id}`}
                        onClick={() => navigate(`/projects/${p.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/projects/${p.id}`);
                          }
                        }}
                      >
                        <td className="py-3 px-4 pl-5 align-middle">
                          <span className="text-sm font-medium text-foreground">{p.name}</span>
                        </td>
                        <td className="py-3 px-4 text-[13px] text-foreground align-middle whitespace-nowrap">
                          {p.clientName || <span className="text-muted-foreground/50">—</span>}
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
                        <td className="py-3 px-4 text-[13px] text-foreground whitespace-nowrap align-middle">
                          {lead ? lead.name : <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {teamMembers.slice(0, 2).map((m) => (
                              <span
                                key={m.id}
                                className="inline-block px-2 py-0.5 rounded-md bg-secondary text-[11px] font-medium text-muted-foreground whitespace-nowrap"
                              >
                                {m.name.split(" ")[0]}
                              </span>
                            ))}
                            {teamMembers.length > 2 && (
                              <span className="text-[11px] text-muted-foreground font-medium">
                                +{teamMembers.length - 2}
                              </span>
                            )}
                            {teamMembers.length === 0 && (
                              <span className="text-[13px] text-muted-foreground/50">—</span>
                            )}
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
                              p.riskCount > 0
                                ? p.riskCount > 2
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-foreground"
                                : "text-muted-foreground/50"
                            )}
                          >
                            {p.riskCount > 0 ? p.riskCount : "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle text-center">
                          <span
                            className={cn(
                              "text-[13px] font-medium",
                              p.oppCount > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground/50"
                            )}
                          >
                            {p.oppCount > 0 ? p.oppCount : "—"}
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
                                data-testid={`button-actions-project-${p.id}`}
                              >
                                <BiDotsHorizontalRounded className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              {isArchived ? (
                                <DropdownMenuItem
                                  onClick={() => unarchiveMutation.mutate(p.id)}
                                  data-testid={`button-unarchive-project-${p.id}`}
                                >
                                  <BiArchive className="w-3.5 h-3.5 mr-2" /> Restore
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => archiveMutation.mutate(p.id)}
                                  data-testid={`button-archive-project-${p.id}`}
                                >
                                  <BiArchive className="w-3.5 h-3.5 mr-2" /> Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(p)}
                                data-testid={`button-delete-project-${p.id}`}
                              >
                                <BiTrash className="w-3.5 h-3.5 mr-2" /> Delete
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
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{deleteTarget?.name}&quot; and all related health checks,
                risks, and opportunities. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-project">Cancel</AlertDialogCancel>
              <AlertDialogAction
                data-testid="button-confirm-delete-project"
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}

interface ProjectFormProps {
  leads: UserListItem[];
  onClose: () => void;
  editData?: ProjectListItem | null;
}

export function ProjectForm({ leads, onClose, editData }: ProjectFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: editData?.name || "",
    clientName: editData?.clientName || "",
    leadUserId: editData?.leadUserId ? String(editData.leadUserId) : leads[0] ? String(leads[0].id) : "",
    description: editData?.description || "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        clientName: form.clientName,
        leadUserId: Number(form.leadUserId),
        description: form.description,
      };
      if (editData) {
        await apiRequest("PATCH", `/api/projects/${editData.id}`, payload);
      } else {
        await apiRequest("POST", "/api/projects", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"], exact: true });
      if (editData) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${editData.id}`] });
      }
      toast({ title: editData ? "Project updated" : "Project created" });
      onClose();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>Project Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          data-testid="input-project-name"
        />
      </div>
      <div className="space-y-2">
        <Label>Client Name</Label>
        <Input
          value={form.clientName}
          onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          required
          data-testid="input-client-name"
        />
      </div>
      <div className="space-y-2">
        <Label>Project Lead</Label>
        <Select value={form.leadUserId} onValueChange={(v) => setForm({ ...form, leadUserId: v })}>
          <SelectTrigger data-testid="select-lead">
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
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          data-testid="input-description"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-project">
          {mutation.isPending ? "Saving..." : editData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
