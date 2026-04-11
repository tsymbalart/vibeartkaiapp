import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Button } from "./button";
import { BiSolidHelpCircle } from "react-icons/bi";

const meta: Meta<typeof Tooltip> = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Small hover/focus popup that explains or labels an element (Radix Tooltip).",
          "**When to use**: Icon-only buttons, truncated labels, metric explanations, keyboard shortcut hints. Never put essential info in a tooltip alone (inaccessible on touch).",
          "**Composition**: Wrap the app (or local subtree) in `TooltipProvider`, then use `Tooltip` → `TooltipTrigger` (`asChild` for custom element) → `TooltipContent`.",
          "**Where in the app**: Sidebar collapsed-icon labels, HealthBadge metric explanations, ScoreSelector guidance, icon-only buttons app-wide.",
          "**Related**: HoverCard (richer preview), Popover (clickable panel).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <BiSolidHelpCircle className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>This is a tooltip</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
