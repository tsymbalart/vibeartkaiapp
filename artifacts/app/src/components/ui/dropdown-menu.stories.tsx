import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./dropdown-menu";
import { Button } from "./button";
import { BiDotsHorizontalRounded, BiSolidPencil, BiArchive, BiTrash } from "react-icons/bi";

const meta: Meta<typeof DropdownMenu> = {
  title: "UI/DropdownMenu",
  component: DropdownMenu,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Contextual menu opened from a trigger button (Radix DropdownMenu).",
          "**When to use**: Row-level actions in tables (edit/archive/delete), overflow menus on cards, user-profile menu in Sidebar. Prefer over raw buttons when you have 3+ actions to group.",
          "**Composition**: `DropdownMenu` → `DropdownMenuTrigger` → `DropdownMenuContent` → `DropdownMenuLabel` / `DropdownMenuItem` / `DropdownMenuSeparator`.",
          "**Where in the app**: ItemCard overflow (…), Design Team row actions, Sidebar user menu, project row actions.",
          "**Related**: ContextMenu (right-click variant), Popover (non-menu overlay), NavigationMenu (top-nav).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <BiDotsHorizontalRounded className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <BiSolidPencil className="w-3.5 h-3.5 mr-2" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem>
          <BiArchive className="w-3.5 h-3.5 mr-2" /> Archive
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          <BiTrash className="w-3.5 h-3.5 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
