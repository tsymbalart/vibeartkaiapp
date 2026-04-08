import { useRef } from "react";
import { Link } from "wouter";
import {
  BiSolidCalendar,
  BiSolidErrorCircle,
  BiSolidBulb,
  BiDotsVerticalRounded,
  BiArchive,
  BiLinkExternal,
  BiSolidUser,
  BiMenu,
} from "react-icons/bi";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface KanbanItem {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  source: "project" | "user";
  sourceName: string;
  sourceLink: string;
  computedScore: number;
  computedLevel: string;
  dueDate?: string | null;
  itemType?: "risk" | "opportunity";
  impact?: number | null;
  probability?: number | null;
  confidence?: number | null;
  value?: number | null;
  createdAt?: string | null;
  responsibleUserName?: string | null;
  responsibleUserId?: number | null;
  priority?: number;
}

export const ACCENT_LABELS: Record<string, Record<string, string>> = {
  risk: { high: "Danger", medium: "Need Attention", low: "All good" },
  opportunity: { high: "High", medium: "Medium", low: "Low" },
};

interface ItemCardProps {
  item: KanbanItem;
  isDragging?: boolean;
  draggable?: boolean;
  showSource?: boolean;
  onArchive?: () => void;
  onClick: () => void;
}

export function ItemCard({
  item,
  isDragging = false,
  draggable = true,
  showSource = true,
  onArchive,
  onClick,
}: ItemCardProps) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const wasDragged = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    wasDragged.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStart.current) return;
    const dx = Math.abs(e.clientX - pointerStart.current.x);
    const dy = Math.abs(e.clientY - pointerStart.current.y);
    if (dx > 5 || dy > 5) wasDragged.current = true;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging || wasDragged.current) return;
    const target = e.target as HTMLElement;
    if (target.closest("a")) return;
    onClick();
  };

  const isRisk = item.itemType === "risk";
  const accentLabel = ACCENT_LABELS[isRisk ? "risk" : "opportunity"][item.computedLevel] ?? "—";

  return (
    <div
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className={cn(
        "bg-card border border-border rounded-2xl overflow-hidden cursor-pointer transition-all group",
        isDragging
          ? "shadow-lg ring-2 ring-primary/20 cursor-grabbing"
          : "hover:shadow-md hover:border-muted-foreground/30"
      )}
      data-testid={`kanban-card-${item.source}-${item.id}`}
    >
      <div
        className={cn(
          "px-3 py-2 flex items-center justify-between",
          isRisk ? "bg-red-50/60 dark:bg-red-950/20" : "bg-emerald-50/60 dark:bg-emerald-950/20"
        )}
      >
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium",
            isRisk ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"
          )}
        >
          {isRisk ? <BiSolidErrorCircle className="w-3 h-3" /> : <BiSolidBulb className="w-3 h-3" />}
          {isRisk ? "Risk" : "Opportunity"} · {accentLabel}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {item.dueDate && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <BiSolidCalendar className="w-2.5 h-2.5" />
              {format(new Date(item.dueDate + "T00:00:00"), "MMM d")}
            </span>
          )}
          {onArchive && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-all"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`button-card-menu-${item.id}`}
                >
                  <BiDotsVerticalRounded className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                  data-testid={`button-card-archive-${item.id}`}
                >
                  <BiArchive className="w-3.5 h-3.5 mr-2" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="px-3 py-3 space-y-2.5">
        <div className="flex items-start gap-2">
          {draggable && (
            <div className="mt-0.5 shrink-0 opacity-40 group-hover:opacity-70 transition-opacity cursor-grab">
              <BiMenu className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          )}
          <h4 className="text-[13px] font-medium text-foreground leading-[1.4] flex-1 line-clamp-2">{item.title}</h4>
        </div>

        {showSource ? (
          <div className={cn("space-y-2", draggable && "ml-[22px]")}>
            <Link href={item.sourceLink} className="flex items-center gap-1.5 group/link w-fit">
              <span className="text-[10px] px-1.5 py-[2px] rounded font-medium shrink-0 bg-secondary text-foreground">
                {item.source === "project" ? "Project" : "Team"}
              </span>
              <span className="text-[12px] font-medium text-foreground group-hover/link:text-primary">
                {item.sourceName}
              </span>
              <BiLinkExternal className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover/link:opacity-100 shrink-0" />
            </Link>
            {item.responsibleUserName && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <BiSolidUser className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-[11px] text-muted-foreground">{item.responsibleUserName}</span>
              </div>
            )}
          </div>
        ) : (
          item.responsibleUserName && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <BiSolidUser className="w-3 h-3 text-muted-foreground" />
              </div>
              <span className="text-[11px] text-muted-foreground">{item.responsibleUserName}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
