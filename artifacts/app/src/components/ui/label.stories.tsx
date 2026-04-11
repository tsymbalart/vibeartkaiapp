import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./label";
import { Input } from "./input";
import { Checkbox } from "./checkbox";

const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Accessible form label built on Radix Label.",
          "**When to use**: Every single form control — always pair an input with a `Label` via `htmlFor={id}` for screen-reader and click-target support.",
          "**Key props**: `htmlFor` (required to link to an input), styling via Tailwind `className`.",
          "**Where in the app**: Used everywhere — sign-in form, invite, pulse editor, settings, Kanban detail panel.",
          "**Related**: Field (label + input + description wrapper), Form (RHF integration).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Label>;

export const WithInput: Story = {
  render: () => (
    <div className="grid w-[300px] gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="name@artk.ai" />
    </div>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};
