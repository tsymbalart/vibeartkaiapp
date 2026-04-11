import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const meta: Meta<typeof RadioGroup> = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Group of mutually exclusive radio options (Radix RadioGroup).",
          "**When to use**: When exactly one of 2–5 visible options must be chosen — scoring mode (latest vs. average), period filter, role picker. Use Select for longer lists.",
          "**Composition**: `RadioGroup` with `defaultValue` wraps `RadioGroupItem`s, each paired with a `<Label htmlFor>`.",
          "**Where in the app**: Pulse Setup scoring-mode selector, Design Ops period filter, settings choices.",
          "**Related**: Checkbox (multi-select), Select (long lists), ToggleGroup (segmented control style).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="latest_only">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="latest_only" id="r1" />
        <Label htmlFor="r1">Latest check-in only</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="average_all" id="r2" />
        <Label htmlFor="r2">Average all check-ins</Label>
      </div>
    </RadioGroup>
  ),
};
