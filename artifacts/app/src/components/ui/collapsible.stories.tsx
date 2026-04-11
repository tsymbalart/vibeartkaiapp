import type { Meta, StoryObj } from "@storybook/react-vite";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { Button } from "./button";
import { BiChevronDown } from "react-icons/bi";

const meta: Meta<typeof Collapsible> = {
  title: "UI/Collapsible",
  component: Collapsible,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Single-section expand/collapse primitive (Radix Collapsible).",
          "**When to use**: One on/off disclosure — \"advanced options\", \"more filters\", an inline details toggle. For multiple panels in a list use Accordion.",
          "**Composition**: `Collapsible` → `CollapsibleTrigger` → `CollapsibleContent`.",
          "**Where in the app**: Inline \"show advanced\" toggles in forms.",
          "**Related**: Accordion (multi-panel), Tabs (peer sections).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-[300px]">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          Advanced options <BiChevronDown className="w-4 h-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 p-3 rounded-lg border text-sm text-muted-foreground">
        Hidden settings appear here.
      </CollapsibleContent>
    </Collapsible>
  ),
};
