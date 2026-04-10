import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "./progress";

const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  argTypes: { value: { control: { type: "range", min: 0, max: 100 } } },
};
export default meta;

type Story = StoryObj<typeof Progress>;

export const Empty: Story = { args: { value: 0 } };
export const Half: Story = { args: { value: 50 } };
export const Full: Story = { args: { value: 100 } };
export const Custom: Story = { args: { value: 73, className: "h-3" } };
