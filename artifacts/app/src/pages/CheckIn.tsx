import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type ResponseInput } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { BiSolidRightArrow, BiSolidLeftArrow, BiSolidLock, BiSolidCheckCircle, BiSolidHome } from "react-icons/bi";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { DimensionBadge } from "@/components/ui/dimension-badge";
import { useRole } from "@/context/RoleContext";
import { apiFetch, apiUrl, fetchWithAuth } from "@/lib/api";

const LIKERT_OPTIONS = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];

const EMOJI_MAP = [
  { value: 1, emoji: "😫", label: "Terrible" },
  { value: 2, emoji: "🙁", label: "Bad" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "🤩", label: "Great" },
];

const FREQUENCY_LABELS = ["Not at all", "Rarely", "Sometimes", "Often", "Almost always"];

type FollowUpLogic = {
  trigger: string;
  threshold: number;
  question: string;
  type: string;
  options?: string[];
};

export default function CheckInFlow() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"intro" | "questions" | "followup" | "outro">("intro");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [checkInId, setCheckInId] = useState<number | null>(null);
  const [responses, setResponses] = useState<Record<number, ResponseInput>>({});
  const [followUpText, setFollowUpText] = useState("");
  const [followUpSelected, setFollowUpSelected] = useState<string[]>([]);
  const [followUpOtherEnabled, setFollowUpOtherEnabled] = useState(false);
  const [followUpOtherText, setFollowUpOtherText] = useState("");
  const [followUpComment, setFollowUpComment] = useState("");
  const { userId } = useRole();

  const createCheckInMutation = useMutation({
    mutationFn: async () => {
      const resp = await fetchWithAuth(apiUrl("/api/check-ins"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!resp.ok) throw new Error("Failed to create check-in");
      return resp.json();
    },
  });

  const submitResponsesMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { responses: ResponseInput[] } }) => {
      const resp = await fetchWithAuth(apiUrl(`/api/check-ins/${id}/responses`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error("Failed to submit responses");
      return resp.json();
    },
  });

  const completeCheckInMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const resp = await fetchWithAuth(apiUrl(`/api/check-ins/${id}/complete`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!resp.ok) throw new Error("Failed to complete check-in");
      return resp.json();
    },
  });

  const { data: questions, isLoading: loadingQuestions } = useQuery<any[]>({
    queryKey: ["session-questions", userId],
    queryFn: () => apiFetch<any[]>("/api/questions/session"),
    enabled: step === "questions" || step === "followup",
  });

  const startCheckIn = async () => {
    try {
      const result = await createCheckInMutation.mutateAsync();
      setCheckInId(result.id);
      setStep("questions");
    } catch (e) {
      console.error("Failed to start check-in", e);
    }
  };

  const shouldShowFollowUp = (): FollowUpLogic | null => {
    if (!questions) return null;
    const q = questions[currentQIndex];
    const fl = q.followUpLogic as FollowUpLogic | null;
    if (!fl) return null;

    const resp = responses[q.id];
    if (!resp) return null;

    const val = resp.numericValue;
    if (val == null) return null;

    if (fl.trigger === "lte" && val <= fl.threshold) return fl;
    if (fl.trigger === "gte" && val >= fl.threshold) return fl;

    return null;
  };

  const handleNext = async () => {
    if (!questions || !checkInId) return;

    if (step === "questions") {
      const fl = shouldShowFollowUp();
      if (fl) {
        setStep("followup");
        setFollowUpText("");
        setFollowUpSelected([]);
        setFollowUpOtherEnabled(false);
        setFollowUpOtherText("");
        setFollowUpComment("");
        return;
      }
    }

    let finalResponses = responses;
    if (step === "followup") {
      const fl = shouldShowFollowUp();
      let assembledText = followUpText;

      if (fl?.type === "multi_select") {
        const parts: string[] = [];
        if (followUpSelected.length > 0) {
          parts.push(`[Selected: ${followUpSelected.join(", ")}]`);
        }
        if (followUpOtherEnabled && followUpOtherText.trim()) {
          parts.push(`[Other: ${followUpOtherText.trim()}]`);
        }
        if (followUpComment.trim()) {
          parts.push(`[Comment: ${followUpComment.trim()}]`);
        }
        assembledText = parts.join(" ");
      }

      if (assembledText) {
        const q = questions[currentQIndex];
        const existing = responses[q.id];
        const updated = { ...responses, [q.id]: { ...existing!, textValue: assembledText } };
        finalResponses = updated;
        setResponses(updated);
      }
      setStep("questions");
    }

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      if (step === "followup") setStep("questions");
    } else {
      try {
        const responseArray = Object.values(finalResponses);
        await submitResponsesMutation.mutateAsync({
          id: checkInId,
          data: { responses: responseArray },
        });
        await completeCheckInMutation.mutateAsync({ id: checkInId });

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#07142D", "#2B59C3", "#10B981", "#FF9F43", "#8B5CF6"],
        });

        setStep("outro");
      } catch (e) {
        console.error("Failed to submit", e);
      }
    }
  };

  const saveResponse = (questionId: number, update: Partial<ResponseInput>) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        numericValue: null,
        textValue: null,
        emojiValue: null,
        selectedOptions: null,
        trafficLight: null,
        ...(prev[questionId] || {}),
        ...update,
      },
    }));
  };

  if (step === "intro") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-xl mx-auto flex items-center justify-center mb-6">
              <PulseIcon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-medium text-foreground tracking-tight">
              Weekly Pulse Check
            </h1>
            <p className="text-lg text-muted-foreground">
              8 quick questions across your team's health pillars. Takes under 3 minutes.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <Button
              size="lg"
              className="w-full justify-between group h-16 text-lg"
              onClick={startCheckIn}
              disabled={createCheckInMutation.isPending}
            >
              <div className="flex flex-col items-start leading-tight text-left">
                <span>Start Pulse Check</span>
                <span className="text-xs font-normal opacity-80">8 questions across 8 pillars</span>
              </div>
              <BiSolidRightArrow className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-8">
            <BiSolidLock className="w-4 h-4" />
            <span>Responses are anonymized — leads never see individual answers</span>
          </div>

          <div className="text-center pt-4">
            <Link href="/">
              <button className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <BiSolidLeftArrow className="w-4 h-4" />
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === "outro") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
            <BiSolidCheckCircle className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-medium text-primary">All done!</h1>
            <p className="text-lg text-muted-foreground">
              Thanks for sharing. Your input shapes a healthier team.
            </p>
          </div>
          <Button size="lg" className="w-full" onClick={() => setLocation("/")}>
            <BiSolidHome className="w-5 h-5 mr-2" /> Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (loadingQuestions || !questions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];
  const progress = ((currentQIndex + 1) / questions.length) * 100;
  const currentResponse = responses[currentQ.id];
  const hasAnswered = currentResponse !== undefined;

  const renderFollowUp = () => {
    const fl = shouldShowFollowUp();
    if (!fl) return null;

    return (
      <motion.div
        key="followup"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-3xl flex flex-col items-center text-center"
      >
        <div className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs font-medium mb-6">
          Follow-up
        </div>
        <h2 className="text-2xl md:text-3xl font-medium text-foreground leading-tight text-balance mb-8">
          {fl.question}
        </h2>
        {fl.type === "multi_select" && fl.options && (
          <div className="w-full max-w-lg space-y-5">
            <div className="flex flex-wrap gap-3 justify-center">
              {fl.options.filter((opt) => opt.toLowerCase() !== "other").map((opt) => {
                const selected = followUpSelected.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      const next = selected
                        ? followUpSelected.filter((x) => x !== opt)
                        : [...followUpSelected, opt];
                      setFollowUpSelected(next);
                      setFollowUpText(next.join(", "));
                    }}
                    className={cn(
                      "px-5 py-3 rounded-lg font-medium text-sm transition-all duration-200 border-2",
                      selected
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {selected && <BiSolidCheckCircle className="w-4 h-4 inline-block mr-2" />}
                    {opt}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setFollowUpOtherEnabled(!followUpOtherEnabled);
                  if (followUpOtherEnabled) setFollowUpOtherText("");
                }}
                className={cn(
                  "px-5 py-3 rounded-lg font-medium text-sm transition-all duration-200 border-2",
                  followUpOtherEnabled
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-foreground border-border hover:border-primary/50 border-dashed"
                )}
              >
                {followUpOtherEnabled && <BiSolidCheckCircle className="w-4 h-4 inline-block mr-2" />}
                Other...
              </button>
            </div>
            {followUpOtherEnabled && (
              <Textarea
                placeholder="Describe your option..."
                className="text-sm min-h-[80px] w-full"
                value={followUpOtherText}
                onChange={(e) => setFollowUpOtherText(e.target.value)}
                autoFocus
              />
            )}
            <div className="pt-1">
              <Textarea
                placeholder="Any additional comments? (optional)"
                className="text-sm min-h-[80px] w-full"
                value={followUpComment}
                onChange={(e) => setFollowUpComment(e.target.value)}
              />
            </div>
          </div>
        )}
        {fl.type === "open_text" && (
          <Textarea
            placeholder="Share your thoughts..."
            className="text-lg min-h-[150px] max-w-lg w-full"
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
          />
        )}
        {fl.type === "yes_no" && (
          <div className="flex gap-4">
            <Button
              variant={followUpText === "Yes" ? "default" : "outline"}
              size="lg"
              onClick={() => setFollowUpText("Yes")}
            >
              Yes
            </Button>
            <Button
              variant={followUpText === "No" ? "default" : "outline"}
              size="lg"
              onClick={() => setFollowUpText("No")}
            >
              No
            </Button>
          </div>
        )}
      </motion.div>
    );
  };

  const renderInput = () => {
    switch (currentQ.inputType) {
      case "likert_5":
        return (
          <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-2xl mx-auto mt-8">
            {LIKERT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => saveResponse(currentQ.id, { numericValue: opt.value })}
                className={cn(
                  "flex-1 p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2",
                  currentResponse?.numericValue === opt.value
                    ? "border-primary bg-primary/10 shadow-lg"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span className="text-2xl font-medium">{opt.value}</span>
                <span className="text-xs font-medium text-muted-foreground text-center leading-tight">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        );

      case "frequency_5":
        return (
          <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-2xl mx-auto mt-8">
            {(currentQ.options || FREQUENCY_LABELS).map((label, idx) => {
              const val = idx + 1;
              return (
                <button
                  key={val}
                  onClick={() => saveResponse(currentQ.id, { numericValue: val })}
                  className={cn(
                    "flex-1 p-4 rounded-xl border-2 transition-all duration-300 text-center",
                    currentResponse?.numericValue === val
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <span className="text-sm font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        );

      case "emoji_5":
        return (
          <div className="flex justify-between items-center w-full max-w-lg mx-auto gap-2 sm:gap-4 mt-8">
            {EMOJI_MAP.map((e) => (
              <button
                key={e.value}
                onClick={() =>
                  saveResponse(currentQ.id, { numericValue: e.value, emojiValue: e.label.toLowerCase() })
                }
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300",
                  currentResponse?.numericValue === e.value
                    ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20"
                    : "bg-card hover:bg-secondary text-foreground hover:-translate-y-1 shadow-sm border border-border"
                )}
              >
                <span className="text-4xl md:text-5xl filter drop-shadow-sm">{e.emoji}</span>
                <span className="text-xs font-medium">{e.label}</span>
              </button>
            ))}
          </div>
        );

      case "traffic_light": {
        const lights = [
          { val: "green" as const, color: "bg-green-500", label: currentQ.options?.[0] || "On Track" },
          { val: "yellow" as const, color: "bg-yellow-400", label: currentQ.options?.[1] || "At Risk" },
          { val: "red" as const, color: "bg-red-500", label: currentQ.options?.[2] || "Off Track" },
        ];

        return (
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-2xl mx-auto mt-8">
            {lights.map((l) => (
              <button
                key={l.val}
                onClick={() => saveResponse(currentQ.id, { trafficLight: l.val })}
                className={cn(
                  "flex-1 p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-4",
                  currentResponse?.trafficLight === l.val
                    ? "border-primary shadow-lg bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/30"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full shadow-inner",
                    l.color,
                    currentResponse?.trafficLight === l.val ? "animate-pulse" : "opacity-50"
                  )}
                />
                <span className="font-medium text-sm text-center">{l.label}</span>
              </button>
            ))}
          </div>
        );
      }

      case "yes_no":
        return (
          <div className="flex justify-center gap-6 mt-8">
            <button
              onClick={() => saveResponse(currentQ.id, { numericValue: 1 })}
              className={cn(
                "w-32 h-32 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2",
                currentResponse?.numericValue === 1
                  ? "border-green-500 bg-green-50 shadow-lg"
                  : "border-border bg-card hover:border-green-300"
              )}
            >
              <span className="text-4xl">✓</span>
              <span className="font-medium">Yes</span>
            </button>
            <button
              onClick={() => saveResponse(currentQ.id, { numericValue: 0 })}
              className={cn(
                "w-32 h-32 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2",
                currentResponse?.numericValue === 0
                  ? "border-red-500 bg-red-50 shadow-lg"
                  : "border-border bg-card hover:border-red-300"
              )}
            >
              <span className="text-4xl">✕</span>
              <span className="font-medium">No</span>
            </button>
          </div>
        );

      case "open_text":
        return (
          <div className="w-full max-w-2xl mx-auto mt-8">
            <Textarea
              placeholder="Share your thoughts here..."
              className="text-lg min-h-[200px]"
              value={currentResponse?.textValue || ""}
              onChange={(e) => saveResponse(currentQ.id, { textValue: e.target.value })}
            />
          </div>
        );

      case "numeric_10":
        return (
          <div className="w-full max-w-lg mx-auto mt-12 space-y-8">
            <div className="text-center text-5xl font-medium text-primary">
              {currentResponse?.numericValue || 5}
              <span className="text-2xl text-muted-foreground">/10</span>
            </div>
            <Slider
              defaultValue={[5]}
              max={10}
              min={1}
              step={1}
              value={[currentResponse?.numericValue || 5]}
              onValueChange={(vals) => saveResponse(currentQ.id, { numericValue: vals[0] })}
            />
            <div className="flex justify-between text-sm font-medium text-muted-foreground">
              <span>Not great</span>
              <span>Fantastic</span>
            </div>
          </div>
        );

      case "single_select":
        return (
          <div className="w-full max-w-lg mx-auto mt-8 flex flex-wrap gap-3 justify-center">
            {currentQ.options?.map((opt) => {
              const selected = currentResponse?.textValue === opt;
              return (
                <button
                  key={opt}
                  onClick={() => saveResponse(currentQ.id, { textValue: opt })}
                  className={cn(
                    "px-5 py-3 rounded-lg font-medium text-sm transition-all duration-200 border-2",
                    selected
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-6 max-w-4xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={() => setLocation("/")}
          className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
        >
          Cancel
        </button>
        <div className="w-1/2">
          <Progress value={progress} className="h-1.5 bg-primary/10" />
        </div>
        <span className="text-sm font-medium text-primary">
          {currentQIndex + 1} / {questions.length}
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === "followup" ? (
            renderFollowUp()
          ) : (
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full max-w-3xl flex flex-col items-center text-center"
            >
              <DimensionBadge dimension={currentQ.pillar} className="mb-6" />

              <h2 className="text-3xl md:text-5xl font-medium text-foreground leading-tight text-balance">
                {currentQ.questionText}
              </h2>

              {renderInput()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-6 max-w-4xl mx-auto w-full flex justify-between items-center bg-background/80 backdrop-blur-sm border-t border-border/50">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">
          <BiSolidLock className="w-3.5 h-3.5" /> Anonymous
        </div>

        <div className="flex gap-4">
          {!currentQ.isRequired && step !== "followup" && (
            <Button variant="ghost" onClick={handleNext} className="text-muted-foreground">
              Skip
            </Button>
          )}
          <Button
            size="lg"
            onClick={handleNext}
            disabled={
              (step === "questions" && currentQ.isRequired && !hasAnswered) ||
              submitResponsesMutation.isPending
            }
            className="min-w-[120px]"
          >
            {submitResponsesMutation.isPending ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : step === "followup" ? (
              "Continue"
            ) : currentQIndex === questions.length - 1 ? (
              "Finish"
            ) : (
              <>
                Next <BiSolidRightArrow className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function PulseIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
