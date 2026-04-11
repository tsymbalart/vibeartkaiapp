import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./slider";

const meta: Meta<typeof Slider> = {
  title: "UI/Slider",
  component: Slider,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Numeric input controlled by a draggable thumb (Radix Slider).",
          "**When to use**: Continuous or integer ranges where precision is less important than speed — score selectors, thresholds, capacity estimates. For two thumbs use a range `defaultValue={[min, max]}`.",
          "**Key props**: `value`/`defaultValue` (array), `min`, `max`, `step`, `onValueChange`.",
          "**Where in the app**: Quick-add score slider, Pulse Setup weighting, capacity estimator.",
          "**Related**: ScoreSelector (domain-specific 1–3 picker), Input type=number, Progress (read-only).",
        ].join("\n\n"),
      },
    },
  },
  argTypes: {
    defaultValue: { control: false },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
  },
};
export default meta;

type Story = StoryObj<typeof Slider>;

export const Default: Story = { args: { defaultValue: [50], max: 100, step: 1, className: "w-[300px]" } };
export const Range: Story = { args: { defaultValue: [25, 75], max: 100, step: 1, className: "w-[300px]" } };
export const Small: Story = { args: { defaultValue: [8], min: 3, max: 20, step: 1, className: "w-[200px]" } };
