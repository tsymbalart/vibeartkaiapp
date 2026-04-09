import { describe, it, expect } from "vitest";
import {
  computeHealthStatus,
  computeRiskScore,
  computeOpportunityScore,
  PROJECT_HEALTH_DIMS,
  PERSON_HEALTH_DIMS,
  SCORE_LABELS,
  REGISTER_STATUSES,
} from "./index";

describe("computeHealthStatus", () => {
  it("is red when there is no data", () => {
    expect(computeHealthStatus([])).toEqual({ score: 0, status: "red" });
  });

  it("averages valid dims and ignores null/NaN", () => {
    const result = computeHealthStatus([3, 3, 2, NaN]);
    // (3 + 3 + 2) / 3 = 2.67 -> 2.7 after rounding
    expect(result.score).toBe(2.7);
  });

  it("is green when the average is high and nothing is red", () => {
    expect(computeHealthStatus([3, 3, 3, 3])).toEqual({
      score: 3,
      status: "green",
    });
  });

  it("is yellow when one dim is red, even with a high average", () => {
    // 3 + 3 + 3 + 1 = 10 / 4 = 2.5 -> yellow (below 2.6 threshold anyway)
    const { status } = computeHealthStatus([3, 3, 3, 1]);
    expect(status).toBe("yellow");
  });

  it("is yellow with one red even when the rest are above the green threshold", () => {
    // Override with a hand-crafted dim set where avg >= 2.6 but red=1
    // avg = (3 + 3 + 3 + 3 + 3 + 1) / 6 = 2.67 -> yellow because of red guard
    const { status } = computeHealthStatus([3, 3, 3, 3, 3, 1]);
    expect(status).toBe("yellow");
  });

  it("is red when two or more dims are red", () => {
    const { status } = computeHealthStatus([3, 3, 1, 1]);
    expect(status).toBe("red");
  });

  it("is red when the average drops below 1.8", () => {
    const { status } = computeHealthStatus([2, 2, 1, 2]);
    expect(status).toBe("red");
  });
});

describe("computeRiskScore", () => {
  it("maps probability × impact into low/medium/high bands", () => {
    expect(computeRiskScore(1, 1)).toEqual({ score: 1, level: "low" });
    expect(computeRiskScore(1, 3)).toEqual({ score: 3, level: "medium" });
    expect(computeRiskScore(2, 2)).toEqual({ score: 4, level: "medium" });
    expect(computeRiskScore(3, 2)).toEqual({ score: 6, level: "high" });
    expect(computeRiskScore(3, 3)).toEqual({ score: 9, level: "high" });
  });
});

describe("computeOpportunityScore", () => {
  it("maps confidence × value into low/medium/high bands", () => {
    expect(computeOpportunityScore(1, 1)).toEqual({ score: 1, level: "low" });
    expect(computeOpportunityScore(2, 2)).toEqual({ score: 4, level: "medium" });
    expect(computeOpportunityScore(3, 2)).toEqual({ score: 6, level: "high" });
  });
});

describe("constants", () => {
  it("lists exactly 4 project health dimensions", () => {
    expect(PROJECT_HEALTH_DIMS).toHaveLength(4);
    expect(PROJECT_HEALTH_DIMS.map((d) => d.key)).toEqual([
      "capacity",
      "clientSatisfaction",
      "teamSatisfaction",
      "quality",
    ]);
  });

  it("lists exactly 6 person health dimensions", () => {
    expect(PERSON_HEALTH_DIMS).toHaveLength(6);
  });

  it("has score labels for 1, 2, 3", () => {
    expect(SCORE_LABELS[1].color).toBe("red");
    expect(SCORE_LABELS[2].color).toBe("yellow");
    expect(SCORE_LABELS[3].color).toBe("green");
  });

  it("register statuses include the expected values", () => {
    expect(REGISTER_STATUSES).toEqual(["new", "in_work", "in_review", "done"]);
  });
});
