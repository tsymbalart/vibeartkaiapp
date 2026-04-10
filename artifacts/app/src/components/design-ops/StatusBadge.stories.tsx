import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBadge } from "./StatusBadge";

const meta: Meta<typeof StatusBadge> = {
  title: "Design Ops/StatusBadge",
  component: StatusBadge,
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
