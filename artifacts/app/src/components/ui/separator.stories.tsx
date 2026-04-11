import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "./separator";

const meta: Meta<typeof Separator> = {
  title: "UI/Separator",
  component: Separator,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Thin horizontal or vertical divider line (Radix Separator).",
          "**When to use**: Visual break between grouped content — sections in a Card, rows in a DropdownMenu, items in an inline toolbar.",
          "**Key props**: `orientation` (`horizontal` default, `vertical`), `decorative` (default true).",
          "**Where in the app**: Sidebar sections, DropdownMenu separators, Card internal dividers, Settings groups.",
          "**Related**: DropdownMenuSeparator (menu-specific), Card.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <p className="text-sm font-medium">Section A</p>
      <Separator />
      <p className="text-sm font-medium">Section B</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center gap-4 text-sm">
      <span>Dashboard</span>
      <Separator orientation="vertical" />
      <span>Settings</span>
      <Separator orientation="vertical" />
      <span>Help</span>
    </div>
  ),
};
