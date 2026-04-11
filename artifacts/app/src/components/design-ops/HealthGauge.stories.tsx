import type { Meta, StoryObj } from "@storybook/react-vite";
import { HealthGauge } from "./HealthGauge";

const meta: Meta<typeof HealthGauge> = {
  title: "Design Ops/HealthGauge",
  component: HealthGauge,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Segmented horizontal bar summarising health across a group of items (projects or people).",
          "**When to use**: Dashboard widgets that roll up many HealthBadges — \"6 projects: 3 green / 2 yellow / 1 red\". Click-through usually links to the full list.",
          "**Key props**: `label`, `total`, `counts: { green, yellow, red, none }`. Segments are proportional to counts.",
          "**Where in the app**: Dashboard DesignOpsWidgets (Projects + People overview tiles), Design Team summary header.",
          "**Related**: HealthBadge (single-item view), Progress (generic single-value bar).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof HealthGauge>;

export const Projects: Story = {
  args: {
    label: "Projects",
    total: 6,
    counts: { green: 3, yellow: 2, red: 1, none: 0 },
  },
};

export const People: Story = {
  args: {
    label: "People",
    total: 8,
    counts: { green: 5, yellow: 1, red: 0, none: 2 },
  },
};

export const Empty: Story = {
  args: {
    label: "Projects",
    total: 0,
    counts: { green: 0, yellow: 0, red: 0, none: 0 },
  },
};
