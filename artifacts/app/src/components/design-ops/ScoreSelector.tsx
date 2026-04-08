import { cn } from "@/lib/utils";
import { computeHealthStatus, SCORE_LABELS } from "@workspace/scoring";

const HEALTH_STYLES: Record<number, { chip: string; dot: string; ring: string }> = {
  3: {
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
  },
  2: {
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
  },
  1: {
    chip: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    dot: "bg-red-500",
    ring: "ring-red-500/30",
  },
};

const NUMERIC_STYLES: Record<number, { chip: string; dot: string; ring: string; label: string }> = {
  1: {
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    label: "Low",
  },
  2: {
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
    label: "Medium",
  },
  3: {
    chip: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    dot: "bg-red-500",
    ring: "ring-red-500/30",
    label: "High",
  },
};

const COLUMN_LABELS: Record<number, string> = { 3: "Good", 2: "Watch", 1: "Act" };

type ScoreDimension = {
  readonly key: string;
  readonly label: string;
  readonly question: string;
  readonly helper: string;
  readonly guidance: Readonly<Record<number, string>>;
};

export function ScoreGrid({
  dimensions,
  values,
  onChange,
}: {
  dimensions: readonly ScoreDimension[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}) {
  return (
    <div className="space-y-5">
      {dimensions.map((dim) => {
        const val = values[dim.key];
        return (
          <div key={dim.key} className="flex flex-col gap-2.5">
            <div className="text-[13px] leading-snug">
              <span className="font-medium text-foreground">{dim.label}</span>
              {dim.question && (
                <>
                  <span className="text-muted-foreground mx-1.5">—</span>
                  <span className="text-foreground">{dim.question}</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {([3, 2, 1] as const).map((score) => {
                const isSel = val === score;
                const style = HEALTH_STYLES[score];
                return (
                  <button
                    key={score}
                    type="button"
                    data-testid={`score-grid-${dim.key}-${score}`}
                    onClick={() => onChange(dim.key, score)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-full text-[13px] font-medium transition-all duration-200 border",
                      isSel
                        ? cn(style.chip, "border-transparent")
                        : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground"
                    )}
                  >
                    {COLUMN_LABELS[score]}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ScoreSelector({
  value,
  onChange,
  label,
  helperText,
  question,
  mode = "health",
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  helperText?: string;
  question?: string;
  guidance?: Record<number, string>;
  mode?: "health" | "numeric";
}) {
  const isNumeric = mode === "numeric";
  const options = isNumeric ? ([1, 2, 3] as const) : ([3, 2, 1] as const);

  const subtitle = question || helperText;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[13px] leading-snug">
        <span className="font-medium text-foreground">{label}</span>
        {subtitle && (
          <>
            <span className="text-muted-foreground mx-1.5">—</span>
            <span className="text-foreground">{subtitle}</span>
          </>
        )}
      </div>
      <div className="flex gap-2">
        {options.map((score) => {
          const isSelected = value === score;
          const style = isNumeric ? NUMERIC_STYLES[score] : HEALTH_STYLES[score];
          const buttonLabel = isNumeric ? NUMERIC_STYLES[score].label : SCORE_LABELS[score].label;
          return (
            <button
              key={score}
              type="button"
              data-testid={`score-select-${label.toLowerCase().replace(/\s+/g, "-")}-${score}`}
              onClick={() => onChange(score)}
              className={cn(
                "flex-1 py-2 px-3 rounded-full text-[13px] font-medium transition-all duration-200 border",
                isSelected
                  ? cn(style.chip, "border-transparent")
                  : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground"
              )}
            >
              {buttonLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ComputedHealthDisplay({ dims, className }: { dims: number[]; className?: string }) {
  if (dims.length === 0) return null;
  const { score, status } = computeHealthStatus(dims);
  const statusNum = status === "green" ? 3 : status === "yellow" ? 2 : 1;
  const style = HEALTH_STYLES[statusNum];
  return (
    <div className={cn("flex items-center gap-2 p-3 rounded-2xl", style.chip, className)}>
      <span className={cn("w-3 h-3 rounded-full", style.dot)} />
      <span className="text-lg font-medium">{score.toFixed(1)}</span>
      <span className="text-sm">{SCORE_LABELS[statusNum].label}</span>
    </div>
  );
}

const RISK_LABELS: Record<string, string> = {
  low: "All good",
  medium: "Need Attention",
  high: "Danger",
};

const RISK_STYLES: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  high: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

export function RiskLevelBadge({ level, className }: { level: string; score?: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        RISK_STYLES[level] ?? RISK_STYLES.low,
        className
      )}
    >
      {RISK_LABELS[level] ?? level}
    </span>
  );
}

const OPP_STYLES: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  high: "bg-primary/10 text-primary",
};

export function OppLevelBadge({ level, className }: { level: string; score?: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        OPP_STYLES[level] ?? OPP_STYLES.low,
        className
      )}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

export function GuidancePanel({ items }: { items: string[] }) {
  return (
    <div className="bg-secondary/40 rounded-2xl p-3 space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Guidance</p>
      {items.map((item, i) => (
        <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
          <span className="text-primary mt-0.5 shrink-0">·</span> {item}
        </p>
      ))}
    </div>
  );
}
