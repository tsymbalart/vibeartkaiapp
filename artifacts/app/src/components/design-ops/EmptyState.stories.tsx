import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./EmptyState";
import { BiSolidGroup, BiSolidFolder } from "react-icons/bi";

const meta: Meta<typeof EmptyState> = {
  title: "Design Ops/EmptyState",
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Centered placeholder block shown when a list/board has no items yet.",
          "**When to use**: Any data surface that could legitimately be empty — first-time user view on Design Team, no projects yet, empty Kanban column (whole board level). Always give a clear next-action.",
          "**Key props**: `icon` (react-icons component), `title`, `description`, optional `action` slot.",
          "**Where in the app**: Design Team roster (no members yet), Projects page (no projects), Kanban boards (no risks/opportunities), OneOnOnes (no sessions).",
          "**Related**: Skeleton (loading vs empty), Empty (UI primitive), Alert (inline notice).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

export const People: Story = {
  args: { icon: BiSolidGroup, title: "No people found", description: "Invite your first team member via Settings" },
};
export const Projects: Story = {
  args: { icon: BiSolidFolder, title: "No projects yet", description: "Create your first project to get started" },
};
