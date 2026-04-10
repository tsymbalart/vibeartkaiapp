import type { Meta, StoryObj } from "@storybook/react-vite";
import { HealthBadge } from "./HealthBadge";

const meta: Meta<typeof HealthBadge> = {
  title: "Design Ops/HealthBadge",
  component: HealthBadge,
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
