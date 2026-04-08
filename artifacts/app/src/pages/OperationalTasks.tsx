import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  BiSolidGridAlt,
  BiSearch,
  BiPlus,
  BiArchive,
  BiRevision,
  BiTrash,
  BiSolidErrorCircle,
  BiSolidBulb,
  BiSolidCalendar,
  BiSolidUser,
} from "react-icons/bi";

import { AppLayout } from "@/components/layout/AppLayout";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
import { KanbanBoard, type KanbanItem } from "@/components/design-ops/KanbanBoard";
import { MultiStepRegisterPanel } from "@/components/design-ops/QuickAddButton";
import { computeRiskScore, computeOpportunityScore } from "@workspace/scoring";
import { cn } from "@/lib/utils";

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

interface ProjectLite {
  id: number;
  name: string;
}

interface UserLite {
  id: number;
  name: string;
}

export default function OperationalTasks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: registerItems, isLoading } = useQuery<RegisterItemRaw[]>({
    queryKey: ["/api/register-items"],
    queryFn: () => apiFetch<RegisterItemRaw[]>("/api/register-items"),
  });
  const { data: projects } = useQuery<ProjectLite[]>({
    queryKey: ["/api/projects"],
    queryFn: () => apiFetch<ProjectLite[]>("/api/projects"),
  });
  const { data: users } = useQuery<UserLite[]>({
    queryKey: ["/api/team/members"],
    queryFn: () => apiFetch<UserLite[]>("/api/team/members"),
  });

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KanbanItem | null>(null);

  const projectMap = useMemo(() => new Map((projects || []).map((p) => [p.id, p])), [projects]);
  const userMap = useMemo(() => new Map((users || []).map((u) => [u.id, u])), [users]);

  const moveMutation = useMutation({
    mutationFn: async ({ item, newStatus }: { item: KanbanItem; newStatus: string }) => {
      await apiRequest("PATCH", `/api/register-items/${item.id}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/register-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-ops/dashboard"] });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/register-items/${id}`, { status: "new" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/register-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-ops/dashboard"] });
      toast({ title: "Task restored" });
    },
    onError: () => {
      toast({ title: "Failed to restore", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/register-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/register-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-ops/dashboard"] });
      toast({ title: "Task deleted" });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: "Failed to delete", variant: "destructive" });
      setDeleteTarget(null);
    },
  });

  const allItems: KanbanItem[] = useMemo(() => {
    return (registerItems || [])
      .map((r) => {
        const isRisk = r.type === "risk";
        const info = isRisk
          ? computeRiskScore(r.probability || 2, r.impact || 2)
          : computeOpportunityScore(r.confidence || 2, r.value || 2);
        const isProject = r.linkedTo === "project";
        const responsible = r.responsibleUserId ? userMap.get(r.responsibleUserId) : null;
        return {
          id: r.id,
          title: r.title,
          description: r.description,
          status: r.status,
          source: isProject ? ("project" as const) : ("user" as const),
          sourceName: isProject
            ? projectMap.get(r.projectId!)?.name || "Unknown"
            : userMap.get(r.userId!)?.name || "Unknown",
          sourceLink: isProject ? `/projects/${r.projectId}` : `/design-team/${r.userId}`,
          computedScore: info.score,
          computedLevel: info.level,
          dueDate: r.dueDate,
          itemType: r.type,
          impact: r.impact,
          probability: r.probability,
          confidence: r.confidence,
          value: r.value,
          createdAt: r.createdAt,
          responsibleUserName: responsible?.name ?? null,
          responsibleUserId: r.responsibleUserId,
          priority: r.priority,
        };
      })
      .sort((a, b) => b.computedScore - a.computedScore);
  }, [registerItems, projectMap, userMap]);

  const activeItems = allItems.filter((i) => i.status !== "done");
  const archivedItems = allItems.filter((i) => i.status === "done");

  const displayItems = showArchived ? archivedItems : activeItems;

  const filtered = displayItems.filter((r) => {
    if (
      search &&
      !r.title.toLowerCase().includes(search.toLowerCase()) &&
      !r.sourceName.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (typeFilter !== "all" && r.itemType !== typeFilter) return false;
    if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
    if (levelFilter !== "all" && r.computedLevel !== levelFilter) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-4">
        <Breadcrumbs segments={[{ label: "Dashboard", href: "/" }, { label: "Operational Tasks" }]} />

        <Sheet open={showCreate} onOpenChange={(v) => { if (!v) setShowCreate(false); }}>
          <SheetContent
            side="right"
            className="w-[440px] sm:max-w-[440px] p-0 flex flex-col bg-card border-l border-border"
            aria-describedby={undefined}
          >
            {showCreate && <MultiStepRegisterPanel onClose={() => setShowCreate(false)} />}
          </SheetContent>
        </Sheet>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-tasks"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-task-type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="risk">Risks</SelectItem>
              <SelectItem value="opportunity">Opportunities</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[130px]" data-testid="select-task-source">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="project">Projects</SelectItem>
              <SelectItem value="user">People</SelectItem>
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[130px]" data-testid="select-task-level">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
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
                data-testid="tab-active-tasks"
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
                data-testid="tab-archived-tasks"
              >
                <BiArchive className="w-3.5 h-3.5" />
                Archived
                {archivedItems.length > 0 && (
                  <span className="text-[11px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">
                    {archivedItems.length}
                  </span>
                )}
              </button>
            </div>
            <Button data-testid="button-create-task" onClick={() => setShowCreate(true)} className="h-10">
              <BiPlus className="w-4 h-4 mr-1" /> New Task
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ))}
          </div>
        ) : showArchived ? (
          filtered.length === 0 ? (
            <EmptyState icon={BiArchive} title="No archived tasks" description="Archived tasks will appear here" />
          ) : (
            <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
              <div className="divide-y divide-border">
                {filtered.map((item) => {
                  const isRisk = item.itemType === "risk";
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/40 transition-colors"
                      data-testid={`archived-task-${item.id}`}
                    >
                      <div className={cn("shrink-0", isRisk ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                        {isRisk ? <BiSolidErrorCircle className="w-4 h-4" /> : <BiSolidBulb className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{item.sourceName}</p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        {item.responsibleUserName && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <BiSolidUser className="w-3 h-3" />
                            {item.responsibleUserName}
                          </span>
                        )}
                        {item.dueDate && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <BiSolidCalendar className="w-3 h-3" />
                            {format(new Date(item.dueDate + "T00:00:00"), "MMM d")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreMutation.mutate(item.id)}
                          disabled={restoreMutation.isPending}
                          data-testid={`button-restore-task-${item.id}`}
                        >
                          <BiRevision className="w-3.5 h-3.5 mr-1" /> Restore
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(item)}
                          data-testid={`button-delete-archived-task-${item.id}`}
                        >
                          <BiTrash className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BiSolidGridAlt}
            title="No operational tasks found"
            description={
              search || typeFilter !== "all" || sourceFilter !== "all" || levelFilter !== "all"
                ? "Try adjusting your filters"
                : "No risks or opportunities recorded yet"
            }
          />
        ) : (
          <div className="bg-card border border-border shadow-sm rounded-3xl p-6">
            <KanbanBoard
              items={filtered}
              onMove={(item, newStatus) => moveMutation.mutate({ item, newStatus })}
              onArchive={(item) => moveMutation.mutate({ item, newStatus: "done" })}
            />
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
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete &quot;{deleteTarget?.title}&quot;? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-archived-task">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete-archived-task"
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
