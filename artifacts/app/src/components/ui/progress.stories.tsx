import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "./progress";

const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Horizontal progress bar (Radix Progress).",
          "**When to use**: Showing determinate progress — pulse check-in completion %, onboarding steps, bulk-invite upload, dimension score fill.",
          "**Key props**: `value` (0–100), `className` (height/colour tweaks).",
          "**Where in the app**: Pulse Feedback completion bar, Setup wizard step indicator, Design Ops dimension fill.",
          "**Related**: Spinner (indeterminate loading), Slider (user-controlled value).",
        ].join("\n\n"),
      },
    },
  },
  argTypes: { value: { control: { type: "range", min: 0, max: 100 } } },
};
export default meta;

type Story = StoryObj<typeof Progress>;

export const Empty: Story = { args: { value: 0 } };
export const Half: Story = { args: { value: 50 } };
export const Full: Story = { args: { value: 100 } };
export const Custom: Story = { args: { value: 73, className: "h-3" } };
