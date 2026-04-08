/**
 * Pure utility package for design-ops health scoring.
 * - Project dimensions: capacity, client satisfaction, team satisfaction, quality
 * - Person dimensions: energy, workload balance, role clarity, level fit, engagement, support
 * - Risk: probability × impact
 * - Opportunity: confidence × value
 *
 * All scales are 1-3 with Green/Yellow/Red status bands.
 * No runtime dependencies (no db, no browser APIs) — importable from either side.
 */

export const PROJECT_HEALTH_DIMS = [
  {
    key: "capacity",
    label: "Capacity",
    question: "Do we have enough design capacity for this project?",
    helper: "Look at available design time, team size, and whether the team's seniority matches the project's complexity.",
    guidance: {
      3: "We have enough time, people, and the right level of support.",
      2: "Capacity is tight or the setup may not fully match the project.",
      1: "The project clearly lacks enough design capacity or the right level of support.",
    },
  },
  {
    key: "clientSatisfaction",
    label: "Client Satisfaction",
    question: "Is collaboration with the client healthy?",
    helper: "Look at responsiveness, clarity of feedback, expectations, and the overall quality of collaboration.",
    guidance: {
      3: "Communication is smooth, feedback is clear, and expectations feel realistic.",
      2: "There are some delays, unclear feedback, or signs of tension.",
      1: "Client collaboration is causing serious friction or delivery risk.",
    },
  },
  {
    key: "teamSatisfaction",
    label: "Team Satisfaction",
    question: "Is internal collaboration around this project working well?",
    helper: "Look at teamwork with developers, handoffs, internal communication, and general team morale on the project.",
    guidance: {
      3: "The team works together smoothly and collaboration feels productive.",
      2: "There are some blockers, delays, or collaboration issues.",
      1: "Internal friction is clearly slowing the work down.",
    },
  },
  {
    key: "quality",
    label: "Quality",
    question: "Do we feel confident about the design quality on this project?",
    helper: "This is an early signal, not a final verdict. Use it to flag when quality may be slipping and needs deeper review.",
    guidance: {
      3: "Quality feels strong and there are no major concerns.",
      2: "There are some doubts about quality or consistency.",
      1: "Quality risk is high and the work needs review or support.",
    },
  },
] as const;

export const PERSON_HEALTH_DIMS = [
  {
    key: "energy",
    label: "Energy",
    question: "Does this person have enough energy to work effectively?",
    helper: "Look for stress, fatigue, burnout signals, and overall energy level.",
    guidance: {
      3: "They seem energized and stable.",
      2: "There are some signs of stress, fatigue, or reduced energy.",
      1: "Low energy or burnout risk is clearly affecting them.",
    },
  },
  {
    key: "workloadBalance",
    label: "Workload Balance",
    question: "Is this person's workload well-balanced?",
    helper: "Consider both extremes: are they stretched too thin across too many projects, or do they lack enough meaningful work to stay productive?",
    guidance: {
      3: "Their workload is well-balanced — enough to stay productive without being stretched.",
      2: "Workload feels off — either leaning toward too much or not enough.",
      1: "Clearly imbalanced — either overloaded or significantly underutilized.",
    },
  },
  {
    key: "roleClarity",
    label: "Role Clarity",
    question: "Does this person clearly understand their responsibilities?",
    helper: "Look at whether they understand what they own, where their responsibility starts and ends, and what is expected from them.",
    guidance: {
      3: "Responsibilities and expectations are clear.",
      2: "Some responsibilities or boundaries are unclear.",
      1: "They do not clearly understand their role.",
    },
  },
  {
    key: "levelFit",
    label: "Level Fit",
    question: "Is the work they're doing a good match for their seniority and skills?",
    helper: "Consider whether they're stretched beyond their experience (too complex) or bored with tasks that don't challenge them (too simple).",
    guidance: {
      3: "The work matches their seniority and skills well.",
      2: "The work is somewhat too complex or too simple for them.",
      1: "There is a clear mismatch that affects their confidence or output.",
    },
  },
  {
    key: "engagement",
    label: "Engagement",
    question: "How engaged is this person in the project?",
    helper: "Look at motivation, initiative, ownership, and willingness to improve the work.",
    guidance: {
      3: "They are motivated, involved, and proactive.",
      2: "Engagement feels inconsistent or lower than expected.",
      1: "They seem disengaged or disconnected from the work.",
    },
  },
  {
    key: "support",
    label: "Support",
    question: "Does this person have enough support?",
    helper: "Look at whether they receive feedback when needed, have access to help, and feel supported by the team and manager.",
    guidance: {
      3: "They have the support they need.",
      2: "They may need more feedback, help, or manager attention.",
      1: "Lack of support is clearly affecting them.",
    },
  },
] as const;

export type HealthStatus = "green" | "yellow" | "red";
export type ItemLevel = "low" | "medium" | "high";

export const SCORE_LABELS: Record<number, { label: string; color: HealthStatus }> = {
  3: { label: "Healthy", color: "green" },
  2: { label: "Needs Attention", color: "yellow" },
  1: { label: "Action Needed", color: "red" },
};

/**
 * Compute overall health from 4 (project) or 6 (person) dimensions.
 * Safety rules:
 *  - Any dim=1 → cannot be green
 *  - 2+ dims=1 → must be red
 *  - Otherwise: avg >= 2.6 green, 1.8-2.5 yellow, <1.8 red
 */
export function computeHealthStatus(dims: number[]): { score: number; status: HealthStatus } {
  const validDims = dims.filter((d) => d != null && !Number.isNaN(d));
  if (validDims.length === 0) return { score: 0, status: "red" };

  const avg = validDims.reduce((a, b) => a + b, 0) / validDims.length;
  const score = Math.round(avg * 10) / 10;
  const redCount = validDims.filter((d) => d === 1).length;

  if (redCount >= 2) return { score, status: "red" };
  if (redCount >= 1 && avg >= 2.6) return { score, status: "yellow" };
  if (avg >= 2.6) return { score, status: "green" };
  if (avg >= 1.8) return { score, status: "yellow" };
  return { score, status: "red" };
}

export function computeRiskScore(probability: number, impact: number): { score: number; level: ItemLevel } {
  const score = probability * impact;
  if (score >= 6) return { score, level: "high" };
  if (score >= 3) return { score, level: "medium" };
  return { score, level: "low" };
}

export function computeOpportunityScore(confidence: number, value: number): { score: number; level: ItemLevel } {
  const score = confidence * value;
  if (score >= 6) return { score, level: "high" };
  if (score >= 3) return { score, level: "medium" };
  return { score, level: "low" };
}

export const HEALTH_GUIDANCE = [
  "Evaluate the last 1–2 weeks, not \"in general\"",
  "Assess current state, not personality",
  "If unsure between two scores, choose the lower one",
  "If yellow or red, add a next action",
  "Keep notes short and action-oriented",
] as const;

export const REGISTER_STATUSES = ["new", "in_work", "in_review", "done"] as const;
export type RegisterStatus = typeof REGISTER_STATUSES[number];

export const REGISTER_STATUS_LABELS: Record<RegisterStatus, string> = {
  new: "New",
  in_work: "In Work",
  in_review: "In Review",
  done: "Done",
};
