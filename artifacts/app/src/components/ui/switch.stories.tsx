import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./switch";
import { Label } from "./label";

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Binary toggle for immediate-effect settings (Radix Switch).",
          "**When to use**: Settings that take effect on toggle without needing a save — dark mode, weekly reminder on/off, notification preferences. Use Checkbox for \"save on submit\" multi-select.",
          "**Key props**: `checked`, `defaultChecked`, `onCheckedChange`, `disabled`.",
          "**Where in the app**: Sidebar theme toggle, Pulse Setup reminder enable, notification settings.",
          "**Related**: Checkbox (form multi-select), Toggle (single pressable button).",
        ].join("\n\n"),
      },
    },
  },
};
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
