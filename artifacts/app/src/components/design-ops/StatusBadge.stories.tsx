import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBadge } from "./StatusBadge";

const meta: Meta<typeof StatusBadge> = {
  title: "Design Ops/StatusBadge",
  component: StatusBadge,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Pill showing the current Kanban status of a risk/opportunity.",
          "**When to use**: Anywhere you display an item outside its column context — notification feed, related-item lists, detail panel header. Status values mirror the Kanban columns.",
          "**Key props**: `status`: `\"new\" | \"in_work\" | \"in_review\" | \"done\"`.",
          "**Where in the app**: ItemDetailPanel header, notification list, Design Ops widget top-issue lists.",
          "**Related**: HealthBadge (health score), Badge (generic), KanbanBoard (column source of truth).",
        ].join("\n\n"),
      },
    },
  },
  argTypes: {
    status: { control: "select", options: ["new", "in_work", "in_review", "done"] },
  },
};
export default meta;

type Story = StoryObj<typeof StatusBadge>;

export const New: Story = { args: { status: "new" } };
export const InWork: Story = { args: { status: "in_work" } };
export const InReview: Story = { args: { status: "in_review" } };
export const Done: Story = { args: { status: "done" } };
