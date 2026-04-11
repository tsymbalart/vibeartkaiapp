import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Binary on/off control built on Radix Checkbox (shadcn/ui).",
          "**When to use**: Multi-select lists where more than one option can be chosen, terms acceptance, bulk-selection headers in tables, include/exclude filters.",
          "**Key props**: `checked`, `defaultChecked`, `disabled`, `onCheckedChange`. Always pair with `<Label>` for accessibility.",
          "**Where in the app**: Pulse Setup question selection, bulk-invite form, assignment pickers.",
          "**Related**: Switch (for immediate-effect toggles), RadioGroup (for mutually-exclusive options).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};
