import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export type ParsedFollowUp = {
  selected: string[];
  other: string | null;
  comment: string | null;
  isStructured: boolean;
};

export function parseFollowUpContent(content: string): ParsedFollowUp {
  const selectedMatch = content.match(/\[Selected:\s*(.+?)\]/);
  const otherMatch = content.match(/\[Other:\s*(.+?)\]/);
  const commentMatch = content.match(/\[Comment:\s*(.+?)\]/);

  if (!selectedMatch && !otherMatch && !commentMatch) {
    return { selected: [], other: null, comment: null, isStructured: false };
  }

  return {
    selected: selectedMatch ? selectedMatch[1].split(",").map((s) => s.trim()) : [],
    other: otherMatch ? otherMatch[1] : null,
    comment: commentMatch ? commentMatch[1] : null,
    isStructured: true,
  };
}
