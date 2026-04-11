import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Small labelled pill for compact metadata (shadcn/ui).",
          "**When to use**: Status labels, counts, tags, role titles, dimension names, or any short inline classifier that doesn't need to be interactive.",
          "**Variants**: `default` (primary), `secondary` (muted), `destructive` (error), `outline` (neutral border only).",
          "**Where in the app**: Role tags on Design Team, status chips on Kanban cards, category labels in Pulse Feedback, active/invited state on team roster.",
          "**Related**: StatusBadge (semantic project status), HealthBadge (health-score colour), RiskLevelBadge (risk/opportunity).",
        ].join("\n\n"),
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["default", "secondary", "destructive", "outline"] },
  },
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: { children: "Badge" } };
export const Secondary: Story = { args: { variant: "secondary", children: "Secondary" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Error" } };
export const Outline: Story = { args: { variant: "outline", children: "Outline" } };
