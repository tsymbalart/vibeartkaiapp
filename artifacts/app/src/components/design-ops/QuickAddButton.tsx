import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { ToastAction } from "@/components/ui/toast";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ScoreSelector,
  ScoreGrid,
  ComputedHealthDisplay,
  RiskLevelBadge,
  OppLevelBadge,
} from "@/components/design-ops/ScoreSelector";
import {
  BiPlus,
  BiSolidHeart,
  BiSolidErrorCircle,
  BiSolidBulb,
  BiArrowBack,
  BiChevronRight,
  BiX,
  BiSolidFolder,
  BiSolidUser,
  BiSolidCalendar,
} from "react-icons/bi";
import {
  PROJECT_HEALTH_DIMS,
  PERSON_HEALTH_DIMS,
  computeRiskScore,
  computeOpportunityScore,
} from "@workspace/scoring";
import { cn } from "@/lib/utils";

type EntryType =
  | "project-health"
  | "user-health"
  | "project-risk"
  | "user-risk"
  | "project-opportunity"
  | "user-opportunity";
type EntryCategory = "health" | "risk" | "opportunity";
type Scope = "project" | "user";
type Step = 1 | 2 | 3 | 4;

function resolveEntryType(category: EntryCategory, scope: Scope): EntryType {
  if (category === "health") return scope === "project" ? "project-health" : "user-health";
  if (category === "risk") return scope === "project" ? "project-risk" : "user-risk";
  return scope === "project" ? "project-opportunity" : "user-opportunity";
}

const LINKED_TO_MAP: Record<EntryType, "project" | "user"> = {
  "project-health": "project",
  "user-health": "user",
  "project-risk": "project",
  "user-risk": "user",
  "project-opportunity": "project",
  "user-opportunity": "user",
};

const REGISTER_TYPE_MAP: Partial<Record<EntryType, "risk" | "opportunity">> = {
  "project-risk": "risk",
  "user-risk": "risk",
  "project-opportunity": "opportunity",
  "user-opportunity": "opportunity",
};

interface ProjectLite {
  id: number;
  name: string;
  status: string;
}
interface UserLite {
  id: number;
  name: string;
  roleTitle?: string | null;
  employmentStatus?: string;
}

export function QuickAddButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState<EntryCategory | null>(null);
  const [scope, setScope] = useState<Scope | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [selectedTargetName, setSelectedTargetName] = useState<string>("");

  const entryType = category && scope ? resolveEntryType(category, scope) : null;

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setCategory(null);
      setScope(null);
      setStep(1);
      setSelectedTargetId("");
      setSelectedTargetName("");
    }, 300);
  };

  const handleBack = () => {
    if (step === 4) {
      setStep(3);
      setSelectedTargetId("");
      setSelectedTargetName("");
    } else if (step === 3) {
      setStep(2);
      setScope(null);
    } else if (step === 2) {
      setStep(1);
      setCategory(null);
    }
  };

  const handleCategorySelect = (cat: EntryCategory) => {
    setCategory(cat);
    setStep(2);
  };

  const handleScopeSelect = (s: Scope) => {
    setScope(s);
    setStep(3);
  };

  const handleTargetSelect = (id: string, name: string) => {
    setSelectedTargetId(id);
    setSelectedTargetName(name);
    setStep(4);
  };

  const linkedTo = entryType ? LINKED_TO_MAP[entryType] : "project";
  const registerType = entryType ? REGISTER_TYPE_MAP[entryType] : undefined;
  const isRegisterItem = !!registerType;

  const STEP_TITLES: Record<Step, string> = {
    1: "New Entry",
    2: "Project or Team Member?",
    3: scope === "project" ? "Select Project" : "Select Team Member",
    4: entryType === "project-health"
      ? "Project Health Check"
      : entryType === "user-health"
      ? "Team Member Health Check"
      : entryType === "project-risk"
      ? "Project Risk"
      : entryType === "user-risk"
      ? "Team Risk"
      : entryType === "project-opportunity"
      ? "Project Opportunity"
      : "Team Opportunity",
  };

  return (
    <>
      <Button data-testid="button-quick-add" onClick={() => setOpen(true)}>
        <BiPlus className="w-4 h-4 mr-1" /> New Entry
      </Button>

      <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <SheetContent
          side="right"
          className="w-[440px] sm:max-w-[440px] p-0 flex flex-col bg-card border-l border-border"
          aria-describedby={undefined}
        >
          <SheetTitle className="sr-only">{STEP_TITLES[step]}</SheetTitle>
          <div className="flex items-center justify-between px-6 h-16 shrink-0 border-b border-border">
            <div className="flex items-center gap-2.5">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  data-testid="button-quick-add-back"
                >
                  <BiArrowBack className="w-4 h-4" />
                </button>
              )}
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <h2 className="text-[15px] font-medium text-foreground">{STEP_TITLES[step]}</h2>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              data-testid="button-quick-add-close"
            >
              <BiX className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {step === 1 && <CategoryPicker onSelect={handleCategorySelect} />}
            {step === 2 && <ScopePicker onSelect={handleScopeSelect} />}
            {step === 3 && scope === "project" && <ProjectPicker onSelect={handleTargetSelect} />}
            {step === 3 && scope === "user" && <UserPicker onSelect={handleTargetSelect} />}
            {step === 4 && entryType === "project-health" && (
              <QuickProjectHealth
                onClose={handleClose}
                defaultProjectId={selectedTargetId}
                targetName={selectedTargetName}
              />
            )}
            {step === 4 && entryType === "user-health" && (
              <QuickUserHealth
                onClose={handleClose}
                defaultUserId={selectedTargetId}
                targetName={selectedTargetName}
              />
            )}
            {step === 4 && isRegisterItem && (
              <QuickRegisterItem
                type={registerType!}
                onClose={handleClose}
                defaultLinkedTo={linkedTo}
                defaultTargetId={selectedTargetId}
                targetName={selectedTargetName}
              />
            )}
          </div>

          <div className="px-6 py-3 border-t border-border shrink-0">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={cn(
                    "w-6 h-1 rounded-full transition-colors",
                    step === s ? "bg-primary" : "bg-border"
                  )}
                />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function CategoryPicker({ onSelect }: { onSelect: (category: EntryCategory) => void }) {
  const options: {
    value: EntryCategory;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    desc: string;
    accent: string;
  }[] = [
    {
      value: "health",
      icon: BiSolidHeart,
      label: "Health Check",
      desc: "Evaluate current health and wellbeing",
      accent: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    {
      value: "risk",
      icon: BiSolidErrorCircle,
      label: "Risk",
      desc: "Flag a potential issue or threat",
      accent: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    },
    {
      value: "opportunity",
      icon: BiSolidBulb,
      label: "Opportunity",
      desc: "Capture a growth or improvement idea",
      accent: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
    },
  ];

  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          data-testid={`button-quick-add-${opt.value}`}
          className="w-full group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-border hover:bg-secondary/40 transition-all duration-200 text-left"
        >
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
              opt.accent
            )}
          >
            <opt.icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-medium text-foreground">{opt.label}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{opt.desc}</p>
          </div>
          <BiChevronRight className="w-4 h-4 text-border group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
        </button>
      ))}
    </div>
  );
}

function ScopePicker({ onSelect }: { onSelect: (scope: Scope) => void }) {
  const options = [
    { value: "project" as const, icon: BiSolidFolder, label: "Project", desc: "Link to a project" },
    { value: "user" as const, icon: BiSolidUser, label: "Team Member", desc: "Link to a team member" },
  ];

  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          data-testid={`button-quick-scope-${opt.value}`}
          className="w-full group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-border hover:bg-secondary/40 transition-all duration-200 text-left"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-secondary text-foreground transition-transform group-hover:scale-105">
            <opt.icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-medium text-foreground">{opt.label}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{opt.desc}</p>
          </div>
          <BiChevronRight className="w-4 h-4 text-border group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
        </button>
      ))}
    </div>
  );
}

function ProjectPicker({ onSelect }: { onSelect: (id: string, name: string) => void }) {
  const { data: projects, isLoading } = useQuery<ProjectLite[]>({
    queryKey: ["/api/projects"],
    queryFn: () => apiFetch<ProjectLite[]>("/api/projects"),
  });
  const activeProjects = (projects || []).filter((p) => p.status === "active");

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading projects...</div>;
  if (activeProjects.length === 0)
    return <div className="py-8 text-center text-sm text-muted-foreground">No active projects available.</div>;

  return (
    <div className="space-y-2">
      {activeProjects.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(String(p.id), p.name)}
          data-testid={`button-pick-project-${p.id}`}
          className="w-full group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-border hover:bg-secondary/40 transition-all duration-200 text-left"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-secondary text-foreground transition-transform group-hover:scale-105">
            <BiSolidFolder className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-foreground truncate">{p.name}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5 capitalize">{p.status}</p>
          </div>
          <BiChevronRight className="w-4 h-4 text-border group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      ))}
    </div>
  );
}

function UserPicker({ onSelect }: { onSelect: (id: string, name: string) => void }) {
  const { data: users, isLoading } = useQuery<UserLite[]>({
    queryKey: ["/api/design-team"],
    queryFn: () => apiFetch<UserLite[]>("/api/design-team"),
  });
  const activeUsers = (users || []).filter((u) => u.employmentStatus === "active");

  if (isLoading)
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading team members...</div>;
  if (activeUsers.length === 0)
    return <div className="py-8 text-center text-sm text-muted-foreground">No active team members available.</div>;

  return (
    <div className="space-y-2">
      {activeUsers.map((u) => (
        <button
          key={u.id}
          onClick={() => onSelect(String(u.id), u.name)}
          data-testid={`button-pick-user-${u.id}`}
          className="w-full group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-border hover:bg-secondary/40 transition-all duration-200 text-left"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-secondary text-foreground transition-transform group-hover:scale-105">
            <BiSolidUser className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-foreground truncate">{u.name}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5 capitalize">{u.roleTitle || "Team member"}</p>
          </div>
          <BiChevronRight className="w-4 h-4 text-border group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      ))}
    </div>
  );
}

export function QuickProjectHealth({
  onClose,
  defaultProjectId,
  targetName,
}: {
  onClose: () => void;
  defaultProjectId?: string;
  targetName?: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: projects, isLoading } = useQuery<ProjectLite[]>({
    queryKey: ["/api/projects"],
    queryFn: () => apiFetch<ProjectLite[]>("/api/projects"),
  });
  const [projectId, setProjectId] = useState<string>(defaultProjectId || "");
  const [form, setForm] = useState({
    capacity: 3,
    clientSatisfaction: 3,
    teamSatisfaction: 3,
    quality: 3,
    summaryNote: "",
  });

  const dims = [form.capacity, form.clientSatisfaction, form.teamSatisfaction, form.quality];

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/projects/${projectId}/health-checks`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-ops/dashboard"] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      }
      toast({ title: "Health check recorded" });
      onClose();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const activeProjects = (projects || []).filter((p) => p.status === "active");

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading projects...</div>;
  if (activeProjects.length === 0)
    return <div className="py-8 text-center text-sm text-muted-foreground">No active projects available.</div>;

  const resolvedName = targetName || activeProjects.find((p) => String(p.id) === projectId)?.name;

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      {defaultProjectId && resolvedName ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary text-foreground">
            <BiSolidFolder className="w-4 h-4" />
          </div>
          <span className="text-[14px] font-medium text-foreground">{resolvedName}</span>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Project</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger data-testid="select-quick-project">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {activeProjects.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {projectId && (
        <>
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
              placeholder="Brief summary of current state..."
              data-testid="input-quick-health-note"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 pb-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !projectId}
              data-testid="button-quick-submit-project-health"
            >
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

export function QuickUserHealth({
  onClose,
  defaultUserId,
  targetName,
}: {
  onClose: () => void;
  defaultUserId?: string;
  targetName?: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery<UserLite[]>({
    queryKey: ["/api/design-team"],
    queryFn: () => apiFetch<UserLite[]>("/api/design-team"),
  });
  const [userId, setUserId] = useState<string>(defaultUserId || "");
  const [form, setForm] = useState({
    energy: 3,
    workloadBalance: 3,
    roleClarity: 3,
    levelFit: 3,
    engagement: 3,
    support: 3,
    summaryNote: "",
  });

  const dims = [form.energy, form.workloadBalance, form.roleClarity, form.levelFit, form.engagement, form.support];

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/design-team/${userId}/health-checks`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-ops/dashboard"] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: [`/api/design-team/${userId}`] });
      }
      toast({ title: "Health check recorded" });
      onClose();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const activeUsers = (users || []).filter((u) => u.employmentStatus === "active");

  if (isLoading)
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading team members...</div>;
  if (activeUsers.length === 0)
    return <div className="py-8 text-center text-sm text-muted-foreground">No active team members available.</div>;

  const resolvedName = targetName || activeUsers.find((u) => String(u.id) === userId)?.name;

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      {defaultUserId && resolvedName ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary text-foreground">
            <BiSolidUser className="w-4 h-4" />
          </div>
          <span className="text-[14px] font-medium text-foreground">{resolvedName}</span>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Team Member</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger data-testid="select-quick-user">
              <SelectValue placeholder="Select a team member" />
            </SelectTrigger>
            <SelectContent>
              {activeUsers.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {userId && (
        <>
          <ComputedHealthDisplay dims={dims} />
          <ScoreGrid
            dimensions={PERSON_HEALTH_DIMS}
            values={form as unknown as Record<string, number>}
            onChange={(key, value) => setForm({ ...form, [key]: value })}
          />
          <div className="space-y-2">
            <Label>Summary Note</Label>
            <Textarea
              value={form.summaryNote}
              onChange={(e) => setForm({ ...form, summaryNote: e.target.value })}
              placeholder="Brief summary..."
              data-testid="input-quick-user-health-note"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 pb-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !userId}
              data-testid="button-quick-submit-user-health"
            >
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

export function QuickRegisterItem({
  type,
  onClose,
  defaultLinkedTo,
  defaultTargetId,
  targetName,
}: {
  type: "risk" | "opportunity";
  onClose: () => void;
  defaultLinkedTo?: "project" | "user";
  defaultTargetId?: string;
  targetName?: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const isRisk = type === "risk";

  const { data: projects, isLoading: loadingProjects } = useQuery<ProjectLite[]>({
    queryKey: ["/api/projects"],
    queryFn: () => apiFetch<ProjectLite[]>("/api/projects"),
  });
  const { data: users, isLoading: loadingUsers } = useQuery<UserLite[]>({
    queryKey: ["/api/design-team"],
    queryFn: () => apiFetch<UserLite[]>("/api/design-team"),
  });

  const [linkedTo, setLinkedTo] = useState<"project" | "user">(defaultLinkedTo || "project");
  const [targetId, setTargetId] = useState<string>(defaultTargetId || "");
  const [responsibleUserId, setResponsibleUserId] = useState<string>(
    authUser?.id ? String(authUser.id) : ""
  );

  useEffect(() => {
    if (authUser?.id && responsibleUserId === "") {
      setResponsibleUserId(String(authUser.id));
    }
  }, [authUser?.id, responsibleUserId]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    impact: 2,
    probability: 2,
    confidence: 2,
    value: 2,
  });

  const scoreInfo = isRisk
    ? computeRiskScore(form.probability, form.impact)
    : computeOpportunityScore(form.confidence, form.value);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description || undefined,
        type,
        linkedTo,
        status: "new",
        dueDate: form.dueDate || undefined,
        responsibleUserId: responsibleUserId ? Number(responsibleUserId) : undefined,
      };
      if (linkedTo === "project") payload.projectId = Number(targetId);
      if (linkedTo === "user") payload.userId = Number(targetId);
      if (isRisk) {
        payload.impact = form.impact;
        payload.probability = form.probability;
      } else {
        payload.confidence = form.confidence;
        payload.value = form.value;
      }
      const created = (await apiRequest("POST", "/api/register-items", payload)) as { id: number };
      return { created, linkedTo, targetId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        predicate: (q) => String(q.queryKey[0]).startsWith("/api/register-items"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/design-ops/dashboard"] });
      const itemId = data.created.id;
      const basePath =
        data.linkedTo === "project" ? `/projects/${data.targetId}` : `/design-team/${data.targetId}`;
      const viewUrl = `${basePath}?item=${itemId}`;
      toast({
        title: `${isRisk ? "Risk" : "Opportunity"} created`,
        action: (
          <ToastAction altText="View" onClick={() => { window.location.href = viewUrl; }}>
            View
          </ToastAction>
        ),
      });
      onClose();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const isLoadingData = loadingProjects || loadingUsers;
  const activeProjects = (projects || []).filter((p) => p.status === "active");
  const activeUsers = (users || []).filter((u) => u.employmentStatus === "active");

  if (isLoadingData) return <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>;

  const resolvedName =
    targetName ||
    (linkedTo === "project"
      ? activeProjects.find((p) => String(p.id) === targetId)?.name
      : activeUsers.find((u) => String(u.id) === targetId)?.name);

  const canSubmit = !!targetId && !!form.title;

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      {defaultTargetId && resolvedName ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary text-foreground">
            {linkedTo === "project" ? <BiSolidFolder className="w-4 h-4" /> : <BiSolidUser className="w-4 h-4" />}
          </div>
          <span className="text-[14px] font-medium text-foreground">{resolvedName}</span>
          <span className="text-[11px] text-muted-foreground ml-auto capitalize">{linkedTo}</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Linked To</Label>
            <Select
              value={linkedTo}
              onValueChange={(v) => {
                setLinkedTo(v as "project" | "user");
                setTargetId("");
              }}
            >
              <SelectTrigger data-testid="select-quick-linked-to">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="user">Team Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{linkedTo === "project" ? "Project" : "Team Member"}</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger data-testid="select-quick-target">
                <SelectValue placeholder={`Select ${linkedTo === "project" ? "project" : "person"}`} />
              </SelectTrigger>
              <SelectContent>
                {linkedTo === "project"
                  ? activeProjects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))
                  : activeUsers.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          data-testid="input-quick-item-title"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          data-testid="input-quick-item-description"
        />
      </div>

      {isRisk ? (
        <>
          <ScoreSelector
            label="Probability"
            value={form.probability}
            onChange={(v) => setForm({ ...form, probability: v })}
            helperText="How likely is this risk to happen?"
            mode="numeric"
          />
          <ScoreSelector
            label="Impact"
            value={form.impact}
            onChange={(v) => setForm({ ...form, impact: v })}
            helperText="How severe would the consequences be?"
            mode="numeric"
          />
        </>
      ) : (
        <>
          <ScoreSelector
            label="Confidence"
            value={form.confidence}
            onChange={(v) => setForm({ ...form, confidence: v })}
            helperText="How likely is this opportunity to be realized?"
            mode="numeric"
          />
          <ScoreSelector
            label="Value"
            value={form.value}
            onChange={(v) => setForm({ ...form, value: v })}
            helperText="How significant would the benefit be?"
            mode="numeric"
          />
        </>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{isRisk ? "Risk" : "Opportunity"} Score:</span>
        {isRisk ? <RiskLevelBadge level={scoreInfo.level} /> : <OppLevelBadge level={scoreInfo.level} />}
      </div>

      <div className="space-y-2">
        <Label>Due Date</Label>
        <div className="relative">
          <BiSolidCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            data-testid="input-quick-item-due-date"
            className="pl-9 [&::-webkit-calendar-picker-indicator]:hidden"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Responsible</Label>
        <Select value={responsibleUserId || undefined} onValueChange={setResponsibleUserId}>
          <SelectTrigger data-testid="select-quick-responsible-user">
            <SelectValue placeholder="Select responsible user" />
          </SelectTrigger>
          <SelectContent>
            {(users || []).map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-2 pb-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending || !canSubmit}
          data-testid="button-quick-submit-item"
        >
          {mutation.isPending ? "Saving..." : "Create"}
        </Button>
      </div>
    </form>
  );
}

export function MultiStepRegisterPanel({
  type: initialType,
  onClose,
}: {
  type?: "risk" | "opportunity";
  onClose: () => void;
}) {
  const needsTypeStep = initialType === undefined;
  const [selectedType, setSelectedType] = useState<"risk" | "opportunity" | null>(initialType ?? null);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(needsTypeStep ? 0 : 1);
  const [linkedTo, setLinkedTo] = useState<"project" | "user" | null>(null);
  const [targetId, setTargetId] = useState("");
  const [targetName, setTargetName] = useState("");

  const typeName = selectedType === "risk" ? "Risk" : selectedType === "opportunity" ? "Opportunity" : "Task";

  const stepTitles: Record<number, string> = {
    0: "New Task",
    1: `New ${typeName}`,
    2: linkedTo === "project" ? "Select Project" : "Select Team Member",
    3: linkedTo === "project" ? `Project ${typeName}` : `Team ${typeName}`,
  };

  const handleTargetSelect = (id: string, name: string) => {
    setTargetId(id);
    setTargetName(name);
    setStep(3);
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      setTargetId("");
      setTargetName("");
    } else if (step === 2) {
      setStep(1);
      setLinkedTo(null);
    } else if (step === 1 && needsTypeStep) {
      setStep(0);
      setSelectedType(null);
    }
  };

  const totalSteps = needsTypeStep ? 4 : 3;
  const stepDots = Array.from({ length: totalSteps }, (_, i) => (needsTypeStep ? i : i + 1));

  return (
    <>
      <SheetTitle className="sr-only">{stepTitles[step]}</SheetTitle>
      <div className="flex items-center justify-between px-6 h-16 shrink-0 border-b border-border">
        <div className="flex items-center gap-2.5">
          {((needsTypeStep && step > 0) || (!needsTypeStep && step > 1)) && (
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              data-testid="button-task-panel-back"
            >
              <BiArrowBack className="w-4 h-4" />
            </button>
          )}
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h2 className="text-[15px] font-medium text-foreground">{stepTitles[step]}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          data-testid="button-task-panel-close"
        >
          <BiX className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {step === 0 && <TaskTypePicker onSelect={(t) => { setSelectedType(t); setStep(1); }} />}
        {step === 1 && <LinkedToPicker onSelect={(lt) => { setLinkedTo(lt); setStep(2); }} />}
        {step === 2 && linkedTo === "project" && <ProjectPicker onSelect={handleTargetSelect} />}
        {step === 2 && linkedTo === "user" && <UserPicker onSelect={handleTargetSelect} />}
        {step === 3 && linkedTo && selectedType && (
          <QuickRegisterItem
            type={selectedType}
            onClose={onClose}
            defaultLinkedTo={linkedTo}
            defaultTargetId={targetId}
            targetName={targetName}
          />
        )}
      </div>

      <div className="px-6 py-3 border-t border-border shrink-0">
        <div className="flex items-center gap-2">
          {stepDots.map((s) => (
            <div
              key={s}
              className={cn("w-6 h-1 rounded-full transition-colors", step === s ? "bg-primary" : "bg-border")}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function TaskTypePicker({ onSelect }: { onSelect: (type: "risk" | "opportunity") => void }) {
  const options = [
    {
      value: "risk" as const,
      icon: BiSolidErrorCircle,
      label: "Risk",
      desc: "Track a potential issue or threat",
      accent: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    },
    {
      value: "opportunity" as const,
      icon: BiSolidBulb,
      label: "Opportunity",
      desc: "Capture a growth or improvement idea",
      accent: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
    },
  ];

  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          data-testid={`button-pick-type-${opt.value}`}
          className="w-full group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-border hover:bg-secondary/40 transition-all duration-200 text-left"
        >
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
              opt.accent
            )}
          >
            <opt.icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-medium text-foreground">{opt.label}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{opt.desc}</p>
          </div>
          <BiChevronRight className="w-4 h-4 text-border group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
        </button>
      ))}
    </div>
  );
}

function LinkedToPicker({ onSelect }: { onSelect: (linkedTo: "project" | "user") => void }) {
  const options = [
    { value: "project" as const, icon: BiSolidFolder, label: "Project", desc: "Link to a project" },
    { value: "user" as const, icon: BiSolidUser, label: "Team Member", desc: "Link to a team member" },
  ];

  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          data-testid={`button-pick-linked-${opt.value}`}
          className="w-full group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-border hover:bg-secondary/40 transition-all duration-200 text-left"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-secondary text-foreground transition-transform group-hover:scale-105">
            <opt.icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-medium text-foreground">{opt.label}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{opt.desc}</p>
          </div>
          <BiChevronRight className="w-4 h-4 text-border group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
        </button>
      ))}
    </div>
  );
}
