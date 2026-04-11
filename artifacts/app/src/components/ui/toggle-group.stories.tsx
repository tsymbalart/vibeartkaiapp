import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { BiAlignLeft, BiAlignMiddle, BiAlignRight } from "react-icons/bi";

const meta: Meta<typeof ToggleGroup> = {
  title: "UI/ToggleGroup",
  component: ToggleGroup,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Segmented group of `Toggle` buttons — either single-select or multi-select (Radix ToggleGroup).",
          "**When to use**: Segmented controls (list view ↔ grid view), alignment pickers, filter groups. Use `type=\"single\"` for one-of-many, `type=\"multiple\"` for independent toggles.",
          "**Composition**: `ToggleGroup` (with `type`, `value`, `onValueChange`) wraps `ToggleGroupItem`s.",
          "**Where in the app**: View switchers, filter groups.",
          "**Related**: Tabs (tab-style), RadioGroup (labelled), Toggle (single).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ToggleGroup>;

export const Single: Story = {
  render: () => (
    <ToggleGroup type="single" defaultValue="center">
      <ToggleGroupItem value="left" aria-label="Align left"><BiAlignLeft className="w-4 h-4" /></ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center"><BiAlignMiddle className="w-4 h-4" /></ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right"><BiAlignRight className="w-4 h-4" /></ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Multiple: Story = {
  render: () => (
    <ToggleGroup type="multiple" defaultValue={["risks"]}>
      <ToggleGroupItem value="risks">Risks</ToggleGroupItem>
      <ToggleGroupItem value="opportunities">Opportunities</ToggleGroupItem>
      <ToggleGroupItem value="archived">Archived</ToggleGroupItem>
    </ToggleGroup>
  ),
};
