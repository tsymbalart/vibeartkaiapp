export const PILLAR_WEIGHTS: Record<string, number> = {
  wellness: 0.18,
  alignment: 0.15,
  management: 0.15,
  growth: 0.13,
  design_courage: 0.12,
  collaboration: 0.10,
  recognition: 0.09,
  belonging: 0.08,
};

export const PILLAR_LABELS: Record<string, string> = {
  wellness: "Wellness",
  alignment: "Alignment",
  management: "Management",
  growth: "Growth & Learning",
  design_courage: "Design Courage",
  collaboration: "Collaboration",
  recognition: "Recognition & Impact",
  belonging: "Belonging",
};

export const ALL_PILLARS = Object.keys(PILLAR_WEIGHTS);

export function normalizeScore(
  inputType: string,
  opts: {
    numericValue?: number | null;
    emojiValue?: string | null;
    trafficLight?: string | null;
  }
): number | null {
  if (inputType === "likert_5" || inputType === "frequency_5") {
    if (opts.numericValue == null) return null;
    return ((opts.numericValue - 1) / 4) * 100;
  }
  if (inputType === "traffic_light") {
    if (!opts.trafficLight) return null;
    if (opts.trafficLight === "green") return 100;
    if (opts.trafficLight === "yellow") return 50;
    return 0;
  }
  if (inputType === "emoji_5") {
    if (opts.numericValue == null) return null;
    return ((opts.numericValue - 1) / 4) * 100;
  }
  if (inputType === "yes_no") {
    if (opts.numericValue == null) return null;
    return opts.numericValue === 1 ? 100 : 0;
  }
  if (inputType === "numeric_10") {
    if (opts.numericValue == null) return null;
    return ((opts.numericValue - 1) / 9) * 100;
  }
  return null;
}

export function computeStatus(score: number): "green" | "yellow" | "red" {
  if (score >= 75) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

export function computeTrend(current: number, previous: number | null): "up" | "stable" | "down" {
  if (previous == null) return "stable";
  const diff = current - previous;
  if (diff >= 5) return "up";
  if (diff <= -5) return "down";
  return "stable";
}

export function computeComposite(
  pillarScores: { pillar: string; score: number }[]
): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const ps of pillarScores) {
    const w = PILLAR_WEIGHTS[ps.pillar] ?? 0;
    weightedSum += ps.score * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
}
