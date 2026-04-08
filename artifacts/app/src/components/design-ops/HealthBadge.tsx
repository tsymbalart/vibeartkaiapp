import { cn } from "@/lib/utils";

const STYLES = {
  green: {
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    dot: "bg-emerald-500",
    filled: "bg-emerald-600 text-white",
  },
  yellow: {
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    dot: "bg-amber-500",
    filled: "bg-amber-600 text-white",
  },
  red: {
    chip: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    dot: "bg-red-500",
    filled: "bg-red-600 text-white",
  },
} as const;

const STATUS_LABELS_SHORT: Record<string, string> = {
  green: "Healthy",
  yellow: "Attention",
  red: "At Risk",
};

const STATUS_LABELS_LONG: Record<string, string> = {
  green: "All good",
  yellow: "Need Attention",
  red: "Danger",
};

export function HealthBadge({
  status,
  className,
  variant = "default",
}: {
  status: string | null | undefined;
  score?: number | null;
  className?: string;
  variant?: "default" | "filled";
}) {
  if (!status) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground",
          className
        )}
      >
        No data
      </span>
    );
  }

  const style = STYLES[status as keyof typeof STYLES] ?? STYLES.green;

  if (variant === "filled") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-medium shadow-sm whitespace-nowrap",
          style.filled,
          className
        )}
      >
        {STATUS_LABELS_SHORT[status] ?? status}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        style.chip,
        className
      )}
    >
      <span className={cn("w-[5px] h-[5px] rounded-full", style.dot)} />
      {STATUS_LABELS_LONG[status] ?? status}
    </span>
  );
}
