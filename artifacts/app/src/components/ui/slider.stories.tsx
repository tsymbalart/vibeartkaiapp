import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./slider";

const meta: Meta<typeof Slider> = {
  title: "UI/Slider",
  component: Slider,
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
