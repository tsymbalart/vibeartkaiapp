import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./EmptyState";
import { BiSolidGroup, BiSolidFolder } from "react-icons/bi";

const meta: Meta<typeof EmptyState> = { title: "Design Ops/EmptyState", component: EmptyState };
export default meta;

type Story = StoryObj<typeof EmptyState>;

export const People: Story = {
  args: { icon: BiSolidGroup, title: "No people found", description: "Invite your first team member via Settings" },
};
export const Projects: Story = {
  args: { icon: BiSolidFolder, title: "No projects yet", description: "Create your first project to get started" },
};
