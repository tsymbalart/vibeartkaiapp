import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  in_work: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  in_review: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  archived: "bg-muted text-muted-foreground",
  inactive: "bg-muted text-muted-foreground",
  new: "bg-primary/10 text-primary",
  open: "bg-primary/10 text-primary",
};

const LABELS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
  inactive: "Inactive",
  new: "New",
  open: "Open",
  in_work: "In Work",
  in_review: "In Review",
  done: "Done",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.open;
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        style,
        className
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
