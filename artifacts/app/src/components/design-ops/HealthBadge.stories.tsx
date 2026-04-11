import type { Meta, StoryObj } from "@storybook/react-vite";
import { HealthBadge } from "./HealthBadge";

const meta: Meta<typeof HealthBadge> = {
  title: "Design Ops/HealthBadge",
  component: HealthBadge,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Traffic-light colour pill summarising a single computed health score.",
          "**When to use**: Compact health indicator next to a person or project name — in roster rows, dashboard widgets, one-on-one lists. Encodes traffic-light semantics (green OK, yellow watch, red problem, null no data).",
          "**Key props**: `status`: `\"green\" | \"yellow\" | \"red\" | null`. Computed by the API from the four health dimensions.",
          "**Where in the app**: Design Team roster rows, DesignOpsWidgets top-worst lists, ProjectCard header, OneOnOnes participant list.",
          "**Related**: HealthGauge (aggregated across a group), StatusBadge (Kanban status), Badge (generic).",
        ].join("\n\n"),
      },
    },
  },
  argTypes: {
    status: { control: "select", options: ["green", "yellow", "red", null] },
  },
};
export default meta;

type Story = StoryObj<typeof HealthBadge>;

export const Green: Story = { args: { status: "green" } };
export const Yellow: Story = { args: { status: "yellow" } };
export const Red: Story = { args: { status: "red" } };
export const NoData: Story = { args: { status: null } };
