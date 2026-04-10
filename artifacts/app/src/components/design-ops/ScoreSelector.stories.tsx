import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScoreSelector, ComputedHealthDisplay, RiskLevelBadge, OppLevelBadge, GuidancePanel } from "./ScoreSelector";

export default { title: "Design Ops/ScoreSelector" } as Meta;

export const HealthMode: StoryObj<typeof ScoreSelector> = {
  render: () => (
    <div className="w-[350px]">
      <ScoreSelector
        label="Capacity"
        question="Do we have enough design capacity?"
        value={2}
        onChange={() => {}}
      />
    </div>
  ),
};

export const NumericMode: StoryObj<typeof ScoreSelector> = {
  render: () => (
    <div className="w-[350px]">
      <ScoreSelector
        label="Impact"
        question="How big is the potential impact?"
        value={3}
        onChange={() => {}}
        mode="numeric"
      />
    </div>
  ),
};

export const HealthDisplay: StoryObj<typeof ComputedHealthDisplay> = {
  render: () => (
    <div className="flex gap-4">
      <ComputedHealthDisplay dims={[3, 3, 2, 3]} />
      <ComputedHealthDisplay dims={[2, 2, 1, 2]} />
      <ComputedHealthDisplay dims={[1, 1, 1, 1]} />
    </div>
  ),
};

export const RiskBadges: StoryObj = {
  render: () => (
    <div className="flex gap-2">
      <RiskLevelBadge level="low" />
      <RiskLevelBadge level="medium" />
      <RiskLevelBadge level="high" />
    </div>
  ),
};

export const OppBadges: StoryObj = {
  render: () => (
    <div className="flex gap-2">
      <OppLevelBadge level="low" />
      <OppLevelBadge level="medium" />
      <OppLevelBadge level="high" />
    </div>
  ),
};

export const Guidance: StoryObj<typeof GuidancePanel> = {
  render: () => (
    <GuidancePanel
      items={[
        "Evaluate the last 1–2 weeks, not \"in general\"",
        "Assess current state, not personality",
        "If unsure between two scores, choose the lower one",
      ]}
    />
  ),
};
