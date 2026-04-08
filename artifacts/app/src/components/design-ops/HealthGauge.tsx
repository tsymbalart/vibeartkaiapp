import { cn } from "@/lib/utils";

interface Segment {
  key: string;
  count: number;
  bar: string;
  dot: string;
}

interface StackedBarProps {
  total: number;
  segments: Segment[];
  label: string;
  labelMap: Record<string, string>;
}

function StackedBar({ total, segments, label, labelMap }: StackedBarProps) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-3xl font-medium text-foreground leading-tight" data-testid={`stat-count-${label}`}>
          {total}
        </span>
        <span className="text-sm text-muted-foreground leading-relaxed">{label}</span>
      </div>

      <div className="flex items-center w-full gap-[5px]">
        {segments.map((seg) => {
          const pct = total === 0 ? 0 : (seg.count / total) * 100;
          const adjustedPct =
            total === 0
              ? "0%"
              : `calc(${pct}% - ${(5 * (segments.length - 1) * (1 - seg.count / total)) / segments.length}px)`;
          return (
            <div
              key={seg.key}
              className={cn("h-[5px] rounded-full transition-all duration-300", seg.bar)}
              style={{ width: adjustedPct, minWidth: "6px" }}
              data-testid={`bar-${seg.key}-${label}`}
            />
          );
        })}
        {total === 0 && <div className="h-[5px] w-full rounded-full bg-border opacity-40" />}
      </div>

      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground leading-relaxed">
        {segments.map((seg) => (
          <span key={seg.key} className="flex items-center gap-1.5" data-testid={`legend-${seg.key}-${label}`}>
            <span className={cn("w-2 h-2 rounded-full", seg.dot)} />
            <span>{labelMap[seg.key]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

interface HealthGaugeProps {
  total: number;
  counts: { green: number; yellow: number; red: number; none: number };
  label: string;
}

export function HealthGauge({ total, counts, label }: HealthGaugeProps) {
  const segments: Segment[] = [];
  if (counts.red > 0) segments.push({ key: "red", count: counts.red, bar: "bg-red-500", dot: "bg-red-500" });
  if (counts.yellow > 0) segments.push({ key: "yellow", count: counts.yellow, bar: "bg-amber-500", dot: "bg-amber-500" });
  if (counts.none > 0) segments.push({ key: "none", count: counts.none, bar: "bg-border", dot: "bg-border" });
  if (counts.green > 0) segments.push({ key: "green", count: counts.green, bar: "bg-emerald-500", dot: "bg-emerald-500" });

  const labelMap: Record<string, string> = {
    red: "Danger",
    yellow: "Need Attention",
    green: "All good",
    none: "No data",
  };

  return <StackedBar total={total} segments={segments} label={label} labelMap={labelMap} />;
}

interface LevelBarProps {
  total: number;
  counts: { high: number; medium: number; low: number };
  label: string;
  variant?: "risk" | "opportunity";
}

export function LevelBar({ total, counts, label, variant = "risk" }: LevelBarProps) {
  const isOpp = variant === "opportunity";

  const segments: Segment[] = [];
  if (counts.high > 0) {
    segments.push({
      key: "high",
      count: counts.high,
      bar: isOpp ? "bg-primary" : "bg-red-500",
      dot: isOpp ? "bg-primary" : "bg-red-500",
    });
  }
  if (counts.medium > 0) {
    segments.push({
      key: "medium",
      count: counts.medium,
      bar: isOpp ? "bg-emerald-600" : "bg-amber-500",
      dot: isOpp ? "bg-emerald-600" : "bg-amber-500",
    });
  }
  if (counts.low > 0) {
    segments.push({
      key: "low",
      count: counts.low,
      bar: "bg-border",
      dot: "bg-border",
    });
  }

  const labelMap: Record<string, string> = isOpp
    ? { high: "High", medium: "Medium", low: "Low" }
    : { high: "Danger", medium: "Need Attention", low: "All good" };

  return <StackedBar total={total} segments={segments} label={label} labelMap={labelMap} />;
}
