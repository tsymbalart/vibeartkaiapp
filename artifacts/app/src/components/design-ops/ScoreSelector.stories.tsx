import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScoreSelector, ComputedHealthDisplay, RiskLevelBadge, OppLevelBadge, GuidancePanel } from "./ScoreSelector";

export default {
  title: "Design Ops/ScoreSelector",
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: 1–3 score picker with contextual question, guidance and computed-health helpers. Also exports `ComputedHealthDisplay`, `RiskLevelBadge`, `OppLevelBadge`, and `GuidancePanel`.",
          "**When to use**: Pulse check-ins (each dimension scored 1–3) and Design Ops risk/opportunity scoring. Health mode colour-codes 1=red, 2=yellow, 3=green; numeric mode shows raw numbers for abstract metrics.",
          "**Key props**: `label`, `question`, `value: 1|2|3`, `onChange`, `mode?: \"health\"|\"numeric\"`. The component renders inline guidance when provided.",
          "**Where in the app**: Pulse Feedback check-in, Design Ops risk/opportunity scoring, Quick Add multi-step form.",
          "**Related**: Slider (continuous numeric), RadioGroup (generic picker), HealthBadge (rendered output).",
        ].join("\n\n"),
      },
    },
  },
} as Meta;

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
