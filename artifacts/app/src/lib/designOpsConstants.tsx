import { BiTrendingUp, BiTrendingDown, BiMinus } from "react-icons/bi";

export const trendIcons: Record<string, typeof BiTrendingUp> = {
  up: BiTrendingUp,
  down: BiTrendingDown,
  stable: BiMinus,
};

export const trendColors: Record<string, string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-red-600 dark:text-red-400",
  stable: "text-muted-foreground",
};
