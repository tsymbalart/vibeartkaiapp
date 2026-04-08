import { cn } from "@/lib/utils";
import {
  BiSolidHeart,
  BiSolidCompass,
  BiSolidCog,
  BiSolidLeaf,
  BiSolidFlame,
  BiSolidGroup,
  BiSolidAward,
  BiSolidConversation,
} from "react-icons/bi";
import type { IconType } from "react-icons";

interface DimensionBadgeProps {
  dimension: string;
  className?: string;
}

const PILLAR_COLORS: Record<string, string> = {
  wellness: "bg-emerald-100 text-emerald-700 border-emerald-200",
  alignment: "bg-blue-100 text-blue-700 border-blue-200",
  management: "bg-violet-100 text-violet-700 border-violet-200",
  growth: "bg-amber-100 text-amber-700 border-amber-200",
  design_courage: "bg-rose-100 text-rose-700 border-rose-200",
  collaboration: "bg-cyan-100 text-cyan-700 border-cyan-200",
  recognition: "bg-orange-100 text-orange-700 border-orange-200",
  belonging: "bg-pink-100 text-pink-700 border-pink-200",
};

const PILLAR_ICONS: Record<string, IconType> = {
  wellness: BiSolidHeart,
  alignment: BiSolidCompass,
  management: BiSolidCog,
  growth: BiSolidLeaf,
  design_courage: BiSolidFlame,
  collaboration: BiSolidConversation,
  recognition: BiSolidAward,
  belonging: BiSolidGroup,
};

const PILLAR_LABELS: Record<string, string> = {
  wellness: "Wellness",
  alignment: "Alignment",
  management: "Management",
  growth: "Growth & Learning",
  design_courage: "Design Courage",
  collaboration: "Collaboration",
  recognition: "Recognition & Impact",
  belonging: "Belonging",
};

export function DimensionBadge({ dimension, className }: DimensionBadgeProps) {
  const colorClass = PILLAR_COLORS[dimension.toLowerCase()] || "bg-secondary text-secondary-foreground border-border";
  const label = PILLAR_LABELS[dimension.toLowerCase()] || dimension;

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-lg text-xs font-medium border uppercase tracking-wider",
      colorClass,
      className
    )}>
      {label}
    </span>
  );
}

export function getPillarLabel(pillar: string): string {
  return PILLAR_LABELS[pillar] || pillar;
}

export function getPillarIcon(pillar: string): IconType {
  return PILLAR_ICONS[pillar.toLowerCase()] || BiSolidHeart;
}

export function getPillarColor(pillar: string): string {
  const colors: Record<string, string> = {
    wellness: "hsl(160, 60%, 45%)",
    alignment: "hsl(220, 70%, 50%)",
    management: "hsl(270, 60%, 55%)",
    growth: "hsl(40, 80%, 50%)",
    design_courage: "hsl(350, 65%, 55%)",
    collaboration: "hsl(190, 70%, 45%)",
    recognition: "hsl(25, 80%, 50%)",
    belonging: "hsl(330, 65%, 55%)",
  };
  return colors[pillar] || "hsl(0, 0%, 50%)";
}
