import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "./separator";

const meta: Meta<typeof Separator> = { title: "UI/Separator", component: Separator };
export default meta;

type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <p className="text-sm font-medium">Section A</p>
      <Separator />
      <p className="text-sm font-medium">Section B</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center gap-4 text-sm">
      <span>Dashboard</span>
      <Separator orientation="vertical" />
      <span>Settings</span>
      <Separator orientation="vertical" />
      <span>Help</span>
    </div>
  ),
};
