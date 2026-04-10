import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./switch";
import { Label } from "./label";

const meta: Meta<typeof Switch> = { title: "UI/Switch", component: Switch };
export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="mode" />
      <Label htmlFor="mode">Enable reminders</Label>
    </div>
  ),
};
