import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toggle } from "./toggle";
import { BiBold, BiItalic, BiUnderline } from "react-icons/bi";

const meta: Meta<typeof Toggle> = {
  title: "UI/Toggle",
  component: Toggle,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Single pressable two-state button (Radix Toggle).",
          "**When to use**: Independent on/off states — \"show archived\", \"include drafts\", rich-text formatting buttons. For mutually-exclusive sets use ToggleGroup.",
          "**Key props**: `pressed` / `defaultPressed`, `onPressedChange`, `disabled`. Variants: `default`, `outline`.",
          "**Where in the app**: Filter toggles (show archived, show only my items), content formatting controls.",
          "**Related**: ToggleGroup (segmented set), Switch (labelled settings), Checkbox (form).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  render: () => <Toggle aria-label="Toggle italic"><BiItalic className="w-4 h-4" /></Toggle>,
};

export const Outline: Story = {
  render: () => (
    <Toggle variant="outline" aria-label="Toggle bold">
      <BiBold className="w-4 h-4" />
    </Toggle>
  ),
};

export const WithText: Story = {
  render: () => (
    <Toggle aria-label="Toggle underline">
      <BiUnderline className="w-4 h-4 mr-2" /> Underline
    </Toggle>
  ),
};
