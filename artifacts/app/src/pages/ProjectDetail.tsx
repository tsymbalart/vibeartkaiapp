import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import {
  BiSolidPencil,
  BiTime,
  BiTrash,
  BiDotsHorizontalRounded,
  BiArchive,
  BiPlus,
  BiSolidGridAlt,
  BiSave,
  BiX,
} from "react-icons/bi";

import { AppLayout } from "@/components/layout/AppLayout";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

import { HealthBadge } from "@/components/design-ops/HealthBadge";
import { ScoreGrid, ComputedHealthDisplay } from "@/components/design-ops/ScoreSelector";
import { Breadcrumbs } from "@/components/design-ops/Breadcrumbs";
import { KanbanBoard, type KanbanItem } from "@/components/design-ops/KanbanBoard";
import { QuickProjectHealth, QuickRegisterItem } from "@/components/design-ops/QuickAddButton";
import { trendIcons, trendColors } from "@/lib/designOpsConstants";
import { ProjectForm } from "./Projects";
import { PROJECT_HEALTH_DIMS, computeRiskScore, computeOpportunityScore } from "@workspace/scoring";
import { cn } from "@/lib/utils";

interface ProjectHealthCheck {
  id: number;
  capacity: number;
  clientSatisfaction: number;
  teamSatisfaction: number;
  quality: number;
  summaryNote: string | null;
  createdAt: string;
  healthScore: number;
  overallHealth: "green" | "yellow" | "red";
  [k: string]: unknown;
}

interface RegisterItemRaw {
  id: number;
  type: "risk" | "opportunity";
  linkedTo: "project" | "user";
  projectId: number | null;
  userId: number | null;
  title: string;
  description: string | null;
  status: string;
  impact: number | null;
  probability: number | null;
  confidence: number | null;
  value: number | null;
  dueDate: string | null;
  responsibleUserId: number | null;
  priority: number;
  createdAt: string;
}

interface ProjectDetailData {
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
  latestHealth: ProjectHealthCheck | null;
  assignedUserIds: number[];
  registerItems: RegisterItemRaw[];
  healthChecks: ProjectHealthCheck[];
}

interface UserListItem {
  id: number;
  name: string;
  role: string;
  roleTitle: string | null;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery<ProjectDetailData>({
    queryKey: [`/api/projects/${id}`],
    queryFn: () => apiFetch<ProjectDetailData>(`/api/projects/${id}`),
  });

  const { data: users } = useQuery<UserListItem[]>({
    queryKey: ["/api/team/members"],
    queryFn: () => apiFetch<UserListItem[]>("/api/team/members"),
  });

  const [editOpen, setEditOpen] = useState(false);
  const [deleteHcId, setDeleteHcId] = useState<number | null>(null);
  const [addHealthOpen, setAddHealthOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState<"risk" | "opportunity" | null>(null);
  const [editHc, setEditHc] = useState<ProjectHealthCheck | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteHealthCheckMutation = useMutation({
    mutationFn: async (checkId: number) => {
      await apiRequest("DELETE", `/api/projects/${id}/health-checks/${checkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      toast({ title: "Health check deleted" });
      setDeleteHcId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete health check", description: error.message, variant: "destructive" });
    },
  });

  const updateHealthCheckMutation = useMutation({
    mutationFn: async ({ checkId, data }: { checkId: number; data: Record<string, unknown> }) => {
      await apiRequest("PATCH", `/api/projects/${id}/health-checks/${checkId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      toast({ title: "Health check updated" });
      setEditHc(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update health check", description: error.message, variant: "destructive" });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project deleted",
        description: "The project and all related data have been removed.",
      });
      navigate("/projects");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete project", description: error.message, variant: "destructive" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PATCH", `/api/projects/${id}`, { status });
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: status === "archived" ? "Project archived" : "Project restored" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update project", description: error.message, variant: "destructive" });
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ item, newStatus }: { item: KanbanItem; newStatus: string }) => {
      await apiRequest("PATCH", `/api/register-items/${item.id}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/register-items"] });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const leads = useMemo(
    () => (users || []).filter((u) => u.role === "lead" || u.role === "director"),
    [users]
  );

  const userMap = useMemo(() => new Map((users || []).map((u) => [u.id, u])), [users]);

  const kanbanItems: KanbanItem[] = useMemo(() => {
    if (!project) return [];
    return project.registerItems.map((item) => {
      const isRisk = item.type === "risk";
      const scoreInfo =
        isRisk && item.probability != null && item.impact != null
          ? computeRiskScore(item.probability, item.impact)
          : !isRisk && item.confidence != null && item.value != null
          ? computeOpportunityScore(item.confidence, item.value)
          : null;
      const responsibleUser = item.responsibleUserId ? userMap.get(item.responsibleUserId) : null;
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status,
        source: "project" as const,
        sourceName: project.name,
        sourceLink: `/projects/${project.id}`,
        computedScore: scoreInfo?.score || 0,
        computedLevel: scoreInfo?.level || "low",
        dueDate: item.dueDate,
        itemType: item.type,
        impact: item.impact,
        probability: item.probability,
        confidence: item.confidence,
        value: item.value,
        createdAt: item.createdAt,
        responsibleUserName: responsibleUser?.name ?? null,
        responsibleUserId: item.responsibleUserId,
        priority: item.priority,
      };
    });
  }, [project, userMap]);

  if (isLoading) return <DetailSkeleton />;
  if (!project)
    return (
      <AppLayout>
        <div className="text-center text-muted-foreground py-12">Project not found</div>
      </AppLayout>
    );

  const lead = userMap.get(project.leadUserId);
  const latestHealth = project.latestHealth;
  const TrendIcon = project.trend ? trendIcons[project.trend] : null;

  return (
    <AppLayout>
      <div className="space-y-4">
        <Breadcrumbs
          segments={[
            { label: "Dashboard", href: "/" },
            { label: "Projects", href: "/projects" },
            { label: project.name },
          ]}
        />

        <div className="bg-card border border-border shadow-sm rounded-3xl overflow-hidden">
          <div className="px-8 py-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-medium text-foreground leading-tight" data-testid="text-project-name">
                    {project.name}
                  </h1>
                  {project.status === "archived" && (
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[11px] uppercase tracking-[0.08em] font-medium border border-border">
                      Archived
                    </span>
                  )}
                  {TrendIcon && (
                    <div
                      className={cn(
                        "flex items-center justify-center p-1.5 rounded-full",
                        project.trend === "down"
                          ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                          : project.trend === "up"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      <TrendIcon className="w-4 h-4" />
                    </div>
                  )}
                  {latestHealth && (
                    <HealthBadge status={latestHealth.overallHealth} score={latestHealth.healthScore} />
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span
                    className="px-2.5 py-1 rounded-full bg-secondary text-[12px] font-medium text-foreground border border-border"
                    data-testid="text-client-name"
                  >
                    <span className="text-muted-foreground mr-1">Client</span>
                    {project.clientName}
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-full bg-secondary text-[12px] font-medium text-foreground border border-border"
                    data-testid="chip-lead"
                  >
                    <span className="text-muted-foreground mr-1">Lead</span>
                    {lead ? lead.name : "Unassigned"}
                  </span>
                  {project.reviewDate ? (
                    <span
                      className="px-2.5 py-1 rounded-full bg-secondary text-[12px] font-medium text-foreground border border-border"
                      data-testid="text-review-date"
                    >
                      <span className="text-muted-foreground mr-1">Next Review</span>
                      {format(new Date(project.reviewDate + "T00:00:00"), "MMM d, yyyy")}
                    </span>
                  ) : null}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-secondary rounded-full shrink-0"
                    data-testid="button-project-actions"
                  >
                    <BiDotsHorizontalRounded className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)} data-testid="button-edit-project">
                    <BiSolidPencil className="w-3.5 h-3.5 mr-2" /> Edit
                  </DropdownMenuItem>
                  {project.status === "archived" ? (
                    <DropdownMenuItem
                      onClick={() => archiveMutation.mutate("active")}
                      data-testid="button-unarchive-project"
                    >
                      <BiArchive className="w-3.5 h-3.5 mr-2" /> Restore
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => archiveMutation.mutate("archived")}
                      data-testid="button-archive-project"
                    >
                      <BiArchive className="w-3.5 h-3.5 mr-2" /> Archive
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                    data-testid="button-delete-project"
                  >
                    <BiTrash className="w-3.5 h-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <Sheet open={editOpen} onOpenChange={setEditOpen}>
          <SheetContent
            side="right"
            className="w-[440px] sm:max-w-[440px] overflow-y-auto"
            aria-describedby={undefined}
          >
            <SheetHeader className="pb-4 border-b border-border mb-4">
              <SheetTitle>Edit Project</SheetTitle>
            </SheetHeader>
            <ProjectForm
              leads={leads.map((l) => ({
                id: l.id,
                name: l.name,
                role: l.role,
                roleTitle: l.roleTitle,
                employmentStatus: "active",
              }))}
              onClose={() => setEditOpen(false)}
              editData={project as never}
            />
          </SheetContent>
        </Sheet>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{project.name}&quot; and all related health checks, risks,
                and opportunities. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-project">Cancel</AlertDialogCancel>
              <AlertDialogAction
                data-testid="button-confirm-delete-project"
                onClick={() => deleteProjectMutation.mutate()}
                disabled={deleteProjectMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="bg-card border border-border shadow-sm rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase font-medium tracking-[0.08em] text-muted-foreground">
              Latest Health Check
            </p>
            <button
              onClick={() => setAddHealthOpen(true)}
              data-testid="button-inline-add-health"
              className="flex items-center px-3 py-1.5 rounded-full border border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors text-[13px] font-medium"
            >
              <BiPlus className="w-3.5 h-3.5 mr-1" />
              New Health Check
            </button>
          </div>
          {latestHealth && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-secondary/40 border border-border rounded-2xl p-3 text-center space-y-1">
                  <div className="text-[11px] uppercase font-medium tracking-[0.08em] text-muted-foreground">
                    Overall
                  </div>
                  <HealthBadge status={latestHealth.overallHealth} score={latestHealth.healthScore} />
                </div>
                {PROJECT_HEALTH_DIMS.map((dim) => {
                  const value = (latestHealth as Record<string, unknown>)[dim.key] as number;
                  return (
                    <Tooltip key={dim.key}>
                      <TooltipTrigger asChild>
                        <div className="bg-secondary/40 border border-border rounded-2xl p-3 text-center space-y-1 cursor-help">
                          <div className="text-[11px] uppercase font-medium tracking-[0.08em] text-muted-foreground">
                            {dim.label}
                          </div>
                          <HealthBadge
                            status={value === 3 ? "green" : value === 2 ? "yellow" : "red"}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[220px] text-center">
                        <p>{dim.helper}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
              {latestHealth.summaryNote && (
                <p className="text-sm font-medium text-muted-foreground mt-4 pt-4 border-t border-border">
                  {latestHealth.summaryNote}
                </p>
              )}
              <p className="text-[13px] font-medium text-muted-foreground mt-2">
                <BiTime className="w-3 h-3 inline mr-1" />
                {formatDistanceToNow(new Date(latestHealth.createdAt), { addSuffix: true })}
              </p>
            </>
          )}
          {!latestHealth && (
            <p className="text-sm text-muted-foreground py-4 text-center">No health checks recorded yet</p>
          )}
        </div>

        {project.healthChecks && project.healthChecks.length >= 1 && (
          <div className="bg-card border border-border shadow-sm rounded-3xl p-6">
            <p className="text-xs uppercase font-medium tracking-[0.08em] text-muted-foreground mb-4">
              Health History
            </p>
            <div className="space-y-2">
              {project.healthChecks.map((hc) => (
                <div
                  key={hc.id}
                  className="flex items-center gap-4 py-2.5 px-4 bg-secondary/40 border border-border rounded-2xl"
                >
                  <div className="text-[13px] text-foreground w-28 shrink-0 font-medium">
                    {format(new Date(hc.createdAt), "MMM d, yyyy")}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap flex-1">
                    <HealthBadge status={hc.overallHealth} score={hc.healthScore} />
                    <span className="text-[13px] font-medium text-muted-foreground truncate">
                      {hc.summaryNote || "No note"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-edit-health-check-${hc.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditHc(hc);
                      }}
                    >
                      <BiSolidPencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-delete-health-check-${hc.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteHcId(hc.id);
                      }}
                    >
                      <BiTrash className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Sheet
          open={editHc !== null}
          onOpenChange={(v) => {
            if (!v) setEditHc(null);
          }}
        >
          <SheetContent
            side="right"
            className="w-[440px] sm:max-w-[440px] p-0 flex flex-col"
            aria-describedby={undefined}
          >
            {editHc && (
              <EditProjectHealthCheck
                key={editHc.id}
                hc={editHc}
                onSave={(data) => updateHealthCheckMutation.mutate({ checkId: editHc.id, data })}
                onClose={() => setEditHc(null)}
                isPending={updateHealthCheckMutation.isPending}
              />
            )}
          </SheetContent>
        </Sheet>

        <AlertDialog
          open={deleteHcId !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteHcId(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Health Check</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this health check? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-health-check">Cancel</AlertDialogCancel>
              <AlertDialogAction
                data-testid="button-confirm-delete-health-check"
                onClick={() => {
                  if (deleteHcId !== null) deleteHealthCheckMutation.mutate(deleteHcId);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteHealthCheckMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="bg-card border border-border shadow-sm rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <BiSolidGridAlt className="w-4 h-4 text-foreground" />
              <span className="text-xs uppercase font-medium tracking-[0.08em] text-muted-foreground">
                Operational Tasks
              </span>
              <span className="text-[13px] font-medium text-muted-foreground">({kanbanItems.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAddTaskOpen("risk")}
                data-testid="button-inline-add-risk"
                className="flex items-center px-3 py-1.5 rounded-full border border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors text-[13px] font-medium"
              >
                <BiPlus className="w-3.5 h-3.5 mr-1" />
                Risk
              </button>
              <button
                onClick={() => setAddTaskOpen("opportunity")}
                data-testid="button-inline-add-opportunity"
                className="flex items-center px-3 py-1.5 rounded-full border border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors text-[13px] font-medium"
              >
                <BiPlus className="w-3.5 h-3.5 mr-1" />
                Opportunity
              </button>
            </div>
          </div>
          {kanbanItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No operational tasks recorded</p>
          ) : (
            <KanbanBoard
              items={kanbanItems}
              onMove={(item, newStatus) => moveMutation.mutate({ item, newStatus })}
              onArchive={(item) => moveMutation.mutate({ item, newStatus: "done" })}
            />
          )}
        </div>

        <Sheet open={addHealthOpen} onOpenChange={setAddHealthOpen}>
          <SheetContent
            side="right"
            className="w-[440px] sm:max-w-[440px] p-0 flex flex-col"
            aria-describedby={undefined}
          >
            <SheetTitle className="sr-only">New Project Health Check</SheetTitle>
            <div className="flex items-center justify-between px-6 h-16 shrink-0 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h2 className="text-[15px] font-medium text-foreground">New Health Check</h2>
              </div>
              <button
                onClick={() => setAddHealthOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                data-testid="button-close-add-health"
              >
                <BiX className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <QuickProjectHealth onClose={() => setAddHealthOpen(false)} defaultProjectId={String(projectId)} />
            </div>
          </SheetContent>
        </Sheet>

        <Sheet
          open={addTaskOpen !== null}
          onOpenChange={(v) => {
            if (!v) setAddTaskOpen(null);
          }}
        >
          <SheetContent
            side="right"
            className="w-[440px] sm:max-w-[440px] p-0 flex flex-col"
            aria-describedby={undefined}
          >
            <SheetTitle className="sr-only">New {addTaskOpen === "risk" ? "Risk" : "Opportunity"}</SheetTitle>
            <div className="flex items-center justify-between px-6 h-16 shrink-0 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    addTaskOpen === "risk" ? "bg-red-500" : "bg-emerald-500"
                  )}
                />
                <h2 className="text-[15px] font-medium text-foreground">
                  New {addTaskOpen === "risk" ? "Risk" : "Opportunity"}
                </h2>
              </div>
              <button
                onClick={() => setAddTaskOpen(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                data-testid="button-close-add-task"
              >
                <BiX className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {addTaskOpen && (
                <QuickRegisterItem
                  type={addTaskOpen}
                  onClose={() => setAddTaskOpen(null)}
                  defaultLinkedTo="project"
                  defaultTargetId={String(projectId)}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}

function DetailSkeleton() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-60 w-full rounded-3xl" />
      </div>
    </AppLayout>
  );
}

function EditProjectHealthCheck({
  hc,
  onSave,
  onClose,
  isPending,
}: {
  hc: ProjectHealthCheck;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({
    capacity: hc.capacity,
    clientSatisfaction: hc.clientSatisfaction,
    teamSatisfaction: hc.teamSatisfaction,
    quality: hc.quality,
    summaryNote: hc.summaryNote || "",
  });

  const dims = [form.capacity, form.clientSatisfaction, form.teamSatisfaction, form.quality];

  return (
    <div className="flex flex-col h-full">
      <SheetTitle className="sr-only">Edit Health Check</SheetTitle>
      <div className="flex items-center justify-between px-6 h-16 shrink-0 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <h2 className="text-[15px] font-medium text-foreground">Edit Health Check</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          data-testid="button-close-health-edit"
        >
          <BiX className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <div className="text-[13px] text-muted-foreground">{format(new Date(hc.createdAt), "MMM d, yyyy")}</div>
        <ComputedHealthDisplay dims={dims} />
        <ScoreGrid
          dimensions={PROJECT_HEALTH_DIMS}
          values={form as unknown as Record<string, number>}
          onChange={(key, value) => setForm({ ...form, [key]: value })}
        />
        <div className="space-y-2">
          <Label>Summary Note</Label>
          <Textarea
            value={form.summaryNote}
            onChange={(e) => setForm({ ...form, summaryNote: e.target.value })}
            placeholder="Brief summary..."
            data-testid="input-edit-health-note"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-health-edit">
            Cancel
          </Button>
          <Button onClick={() => onSave(form)} disabled={isPending} data-testid="button-save-health-edit">
            <BiSave className="w-3.5 h-3.5 mr-1" />
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
