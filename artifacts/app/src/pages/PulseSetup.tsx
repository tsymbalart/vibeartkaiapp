import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BiSolidCog, BiPlus, BiSolidChevronDown, BiSolidChevronRight, BiSolidPencil, BiSolidTrash, BiSolidDashboard, BiSolidBookOpen } from "react-icons/bi";
import { cn } from "@/lib/utils";
import { getPillarLabel } from "@/components/ui/dimension-badge";
import { apiUrl, fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/context/RoleContext";

const PILLARS = [
  "wellness", "alignment", "management", "growth",
  "design_courage", "collaboration", "recognition", "belonging",
] as const;

const INPUT_TYPES = [
  { value: "likert_5", label: "Likert (1-5)" },
  { value: "frequency_5", label: "Frequency (1-5)" },
  { value: "traffic_light", label: "Traffic Light" },
  { value: "yes_no", label: "Yes / No" },
  { value: "open_text", label: "Open Text" },
];

const FREQUENCY_CLASSES = [
  { value: "core", label: "Core" },
  { value: "high", label: "High" },
  { value: "standard", label: "Standard" },
  { value: "deep", label: "Deep" },
];

const FOCUS_LEVELS = [
  { value: "focus", label: "Focus", color: "bg-secondary text-foreground" },
  { value: "normal", label: "Normal", color: "bg-secondary text-foreground" },
  { value: "reduced", label: "Reduced", color: "bg-secondary text-foreground" },
  { value: "off", label: "Off", color: "bg-secondary text-foreground" },
];

const PILLAR_COLORS: Record<string, string> = {
  wellness: "border-l-primary/30",
  alignment: "border-l-primary/30",
  management: "border-l-primary/30",
  growth: "border-l-primary/30",
  design_courage: "border-l-primary/30",
  collaboration: "border-l-primary/30",
  recognition: "border-l-primary/30",
  belonging: "border-l-primary/30",
};

const PILLAR_BG: Record<string, string> = {
  wellness: "bg-card",
  alignment: "bg-card",
  management: "bg-card",
  growth: "bg-card",
  design_courage: "bg-card",
  collaboration: "bg-card",
  recognition: "bg-card",
  belonging: "bg-card",
};

interface Question {
  id: number;
  pillar: string;
  questionText: string;
  inputType: string;
  options: string[] | null;
  order: number;
  impactWeight: number;
  frequencyClass: string;
  isCore: boolean;
  isRequired: boolean;
  source: string | null;
  followUpLogic: any;
}

interface PulseSettings {
  id: number | null;
  teamId: number;
  sessionSize: number;
  pillarWeights: Record<string, string>;
}

interface QuestionFormData {
  pillar: string;
  questionText: string;
  inputType: string;
  frequencyClass: string;
  impactWeight: number;
  isCore: boolean;
  isRequired: boolean;
  options: string[];
}

const defaultFormData: QuestionFormData = {
  pillar: "wellness",
  questionText: "",
  inputType: "likert_5",
  frequencyClass: "standard",
  impactWeight: 1.0,
  isCore: false,
  isRequired: true,
  options: [],
};

export default function PulseSetup() {
  const { role } = useRole();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set(PILLARS));
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(defaultFormData);

  const { data: settings, isLoading: settingsLoading } = useQuery<PulseSettings>({
    queryKey: ["pulse-settings"],
    queryFn: async () => {
      const resp = await fetchWithAuth(apiUrl("/api/pulse-settings"));
      if (!resp.ok) throw new Error("Failed to load settings");
      return resp.json();
    },
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["questions-all"],
    queryFn: async () => {
      const resp = await fetchWithAuth(apiUrl("/api/questions"));
      if (!resp.ok) throw new Error("Failed to load questions");
      return resp.json();
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<PulseSettings>) => {
      const resp = await fetchWithAuth(apiUrl("/api/pulse-settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error("Failed to update settings");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pulse-settings"] });
      toast({ title: "Settings updated" });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const payload = { ...data, options: data.options.length > 0 ? data.options : null };
      const resp = await fetchWithAuth(apiUrl("/api/questions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error("Failed to create question");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions-all"] });
      setAddDialogOpen(false);
      setFormData(defaultFormData);
      toast({ title: "Question added" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<QuestionFormData> }) => {
      const payload = { ...data, options: data.options && data.options.length > 0 ? data.options : null };
      const resp = await fetchWithAuth(apiUrl(`/api/questions/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error("Failed to update question");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions-all"] });
      setEditingQuestion(null);
      toast({ title: "Question updated" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const resp = await fetchWithAuth(apiUrl(`/api/questions/${id}`), { method: "DELETE" });
      if (!resp.ok) throw new Error("Failed to delete question");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions-all"] });
      setDeleteQuestion(null);
      toast({ title: "Question deleted" });
    },
  });

  const togglePillar = (pillar: string) => {
    setExpandedPillars((prev) => {
      const next = new Set(prev);
      if (next.has(pillar)) next.delete(pillar);
      else next.add(pillar);
      return next;
    });
  };

  const questionsByPillar = PILLARS.reduce((acc, pillar) => {
    acc[pillar] = questions.filter((q) => q.pillar === pillar);
    return acc;
  }, {} as Record<string, Question[]>);

  const currentWeights = settings?.pillarWeights ?? {};
  const sessionSize = settings?.sessionSize ?? 8;

  const getSessionPreview = () => {
    const activePillars = PILLARS.filter((p) => (currentWeights[p] ?? "normal") !== "off");
    const totalWeight = activePillars.reduce((sum, p) => {
      const level = currentWeights[p] ?? "normal";
      const mult = level === "focus" ? 2.0 : level === "reduced" ? 0.5 : 1.0;
      return sum + mult;
    }, 0);

    return activePillars.map((p) => {
      const level = currentWeights[p] ?? "normal";
      const mult = level === "focus" ? 2.0 : level === "reduced" ? 0.5 : 1.0;
      const proportion = totalWeight > 0 ? mult / totalWeight : 0;
      const estimated = Math.round(proportion * sessionSize * 10) / 10;
      return { pillar: p, estimated, level };
    });
  };

  if (role !== "lead" && role !== "director") {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center text-center">
          <div className="space-y-3">
            <BiSolidCog className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-medium text-foreground">Lead Access Required</h2>
            <p className="text-muted-foreground">This page is restricted to team leads and directors.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (settingsLoading || questionsLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const preview = getSessionPreview();

  return (
    <AppLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <section className="text-center max-w-xl mx-auto space-y-4 pt-4">
          <div className="w-14 h-14 bg-primary/10 rounded-xl mx-auto flex items-center justify-center">
            <BiSolidCog className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
            Pulse Set-up
          </h1>
          <p className="text-muted-foreground">
            Configure how your team's pulse sessions are composed and manage the question bank.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BiSolidDashboard className="w-5 h-5 text-primary" />
              Session Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Questions per session</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">How many questions teammates answer each check-in</p>
                </div>
                <span className="text-3xl font-medium text-primary tabular-nums">{sessionSize}</span>
              </div>
              <Slider
                value={[sessionSize]}
                min={3}
                max={20}
                step={1}
                onValueChange={([val]) => {
                  updateSettingsMutation.mutate({ sessionSize: val });
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3 (quick)</span>
                <span>20 (comprehensive)</span>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Category Focus</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Control how many questions from each pillar appear in sessions.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PILLARS.map((pillar) => {
                  const level = currentWeights[pillar] ?? "normal";
                  return (
                    <div key={pillar} className={cn("flex items-center justify-between p-3 rounded-xl border", PILLAR_BG[pillar])}>
                      <span className="text-sm font-medium">{getPillarLabel(pillar)}</span>
                      <Select
                        value={level}
                        onValueChange={(val) => {
                          updateSettingsMutation.mutate({
                            pillarWeights: { ...currentWeights, [pillar]: val },
                          });
                        }}
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FOCUS_LEVELS.map((fl) => (
                            <SelectItem key={fl.value} value={fl.value}>
                              <span className={cn("px-1.5 py-0.5 rounded-lg text-xs font-medium", fl.color)}>
                                {fl.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-4">
              <Label className="text-sm font-medium">Session Composition Preview</Label>
              <div className="bg-secondary/50 rounded-xl p-5">
                <div className="flex h-5 rounded-lg overflow-hidden mb-4">
                  {preview.filter(p => p.estimated > 0).map((p) => (
                    <div
                      key={p.pillar}
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${(p.estimated / sessionSize) * 100}%`,
                        backgroundColor: getPillarBarColor(p.pillar),
                      }}
                      title={`${getPillarLabel(p.pillar)}: ~${p.estimated.toFixed(1)} questions`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                  {preview.map((p) => (
                    <div key={p.pillar} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getPillarBarColor(p.pillar) }}
                      />
                      <span className="text-muted-foreground truncate">{getPillarLabel(p.pillar)}</span>
                      <span className="font-medium ml-auto tabular-nums">~{p.estimated.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BiSolidBookOpen className="w-5 h-5 text-primary" />
                Question Bank
              </CardTitle>
              <Button
                onClick={() => {
                  setFormData(defaultFormData);
                  setAddDialogOpen(true);
                }}
                size="sm"
              >
                <BiPlus className="w-4 h-4 mr-1" /> Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {PILLARS.map((pillar) => {
              const pillarQuestions = questionsByPillar[pillar] || [];
              const isExpanded = expandedPillars.has(pillar);

              return (
                <Collapsible key={pillar} open={isExpanded} onOpenChange={() => togglePillar(pillar)}>
                  <CollapsibleTrigger className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border-l-4 transition-all hover:bg-secondary/50",
                    PILLAR_COLORS[pillar]
                  )}>
                    <div className="flex items-center gap-3">
                      {isExpanded ? <BiSolidChevronDown className="w-4 h-4" /> : <BiSolidChevronRight className="w-4 h-4" />}
                      <span className="font-medium">{getPillarLabel(pillar)}</span>
                    </div>
                    <Badge variant="secondary">
                      {pillarQuestions.length}
                    </Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 mt-2 space-y-2">
                      {pillarQuestions.map((q) => (
                        <div
                          key={q.id}
                          className="group p-4 rounded-xl border bg-card hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <p className="text-sm leading-relaxed">{q.questionText}</p>
                              <div className="flex flex-wrap gap-1.5">
                                <Badge variant="outline" className="text-[10px]">
                                  {INPUT_TYPES.find(t => t.value === q.inputType)?.label || q.inputType}
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">
                                  {q.frequencyClass}
                                </Badge>
                                {q.isCore && (
                                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                    Core
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingQuestion(q);
                                  setFormData({
                                    pillar: q.pillar,
                                    questionText: q.questionText,
                                    inputType: q.inputType,
                                    frequencyClass: q.frequencyClass,
                                    impactWeight: q.impactWeight,
                                    isCore: q.isCore,
                                    isRequired: q.isRequired,
                                    options: q.options || [],
                                  });
                                }}
                              >
                                <BiSolidPencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteQuestion(q)}
                              >
                                <BiSolidTrash className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {pillarQuestions.length === 0 && (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                          No questions in this category.
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>Create a custom question for your pulse sessions.</DialogDescription>
          </DialogHeader>
          <QuestionForm
            formData={formData}
            onChange={setFormData}
            onSubmit={() => createQuestionMutation.mutate(formData)}
            isLoading={createQuestionMutation.isPending}
            submitLabel="Add Question"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>Update this question's text and properties.</DialogDescription>
          </DialogHeader>
          <QuestionForm
            formData={formData}
            onChange={setFormData}
            onSubmit={() => {
              if (editingQuestion) {
                updateQuestionMutation.mutate({ id: editingQuestion.id, data: formData });
              }
            }}
            isLoading={updateQuestionMutation.isPending}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteQuestion} onOpenChange={(open) => !open && setDeleteQuestion(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground italic py-2">
            "{deleteQuestion?.questionText}"
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteQuestion(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteQuestion && deleteQuestionMutation.mutate(deleteQuestion.id)}
              disabled={deleteQuestionMutation.isPending}
            >
              {deleteQuestionMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function QuestionForm({
  formData,
  onChange,
  onSubmit,
  isLoading,
  submitLabel,
}: {
  formData: QuestionFormData;
  onChange: (data: QuestionFormData) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pillar</Label>
        <Select value={formData.pillar} onValueChange={(val) => onChange({ ...formData, pillar: val })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PILLARS.map((p) => (
              <SelectItem key={p} value={p}>{getPillarLabel(p)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Question Text</Label>
        <Input
          value={formData.questionText}
          onChange={(e) => onChange({ ...formData, questionText: e.target.value })}
          placeholder="Enter the question..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Input Type</Label>
          <Select value={formData.inputType} onValueChange={(val) => onChange({ ...formData, inputType: val })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INPUT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Frequency Class</Label>
          <Select value={formData.frequencyClass} onValueChange={(val) => onChange({ ...formData, frequencyClass: val })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_CLASSES.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {["frequency_5", "traffic_light"].includes(formData.inputType) && (
        <div className="space-y-2">
          <Label>Answer Options</Label>
          <p className="text-xs text-muted-foreground">
            Comma-separated list of options (e.g. "Never, Rarely, Sometimes, Often, Always")
          </p>
          <Input
            value={formData.options.join(", ")}
            onChange={(e) => {
              const opts = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
              onChange({ ...formData, options: opts });
            }}
            placeholder="Option 1, Option 2, Option 3..."
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Impact Weight ({formData.impactWeight})</Label>
        <Slider
          value={[formData.impactWeight]}
          min={0.1}
          max={2.0}
          step={0.1}
          onValueChange={([val]) => onChange({ ...formData, impactWeight: Math.round(val * 10) / 10 })}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0.1 (low)</span>
          <span>2.0 (high)</span>
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isCore}
            onChange={(e) => onChange({ ...formData, isCore: e.target.checked })}
            className="rounded border-gray-300"
          />
          Core Question
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isRequired}
            onChange={(e) => onChange({ ...formData, isRequired: e.target.checked })}
            className="rounded border-gray-300"
          />
          Required
        </label>
      </div>

      <DialogFooter>
        <Button onClick={onSubmit} disabled={isLoading || !formData.questionText.trim()}>
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );
}

function getPillarBarColor(pillar: string): string {
  const colors: Record<string, string> = {
    wellness: "#10b981",
    alignment: "#3b82f6",
    management: "#8b5cf6",
    growth: "#f59e0b",
    design_courage: "#f43f5e",
    collaboration: "#06b6d4",
    recognition: "#f97316",
    belonging: "#ec4899",
  };
  return colors[pillar] || "#6b7280";
}
